import { asyncBufferFromUrl, parquetMetadataAsync, parquetReadObjects } from 'hyparquet';
import { compressors } from 'hyparquet-compressors';
import type { Dimension as Dim, Filter, LeaderRow, Totals } from './types';

// One Parquet file holds every GROUP BY GROUPING SETS section, stacked and sorted
// by (g, day, borough, zone) so each section is a contiguous, day-ordered byte
// range fetchable in a single HTTP range request.
//   g0 totals  g1 by borough  g2 by zone  g3 daily  g4 daily×borough  g5 daily×zone

const COLUMNS = ['g', 'day', 'borough', 'zone', 'trips', 'revenue'];
const SECTION_COUNT = 6;
const TOTALS_G = 0; // resident after the head read
const DAILY_G = 3; // resident after the head read
const MS_PER_DAY = 86_400_000;

// Dimension bitmask per section (D=1, B=2, Z=4). A section with dims A answers any
// panel whose dims ⊆ A by folding the extra dimensions away.
//   g0 {}  g1 {B}  g2 {B,Z}  g3 {D}  g4 {D,B}  g5 {D,B,Z}
const SECTION_DIMS = [0, 2, 6, 1, 3, 7];
const DAY_BIT = 1;
const hasDay = (g: number): boolean => (SECTION_DIMS[g] & DAY_BIT) !== 0;

export interface DailyRow {
    t: number;
    trips: number;
    revenue: number;
}

export interface Section {
    g: number;
    label: string;
    rows: number;
    rowGroups: number;
    bytes: number;
}

interface Group {
    startRow: number;
    endRow: number;
    gMin: number;
    gMax: number;
    dayMin: number;
    dayMax: number;
    byteStart: number;
    byteEnd: number;
    bytes: number;
}

type Slicer = { byteLength: number; slice: (start: number, end?: number) => ArrayBuffer | Promise<ArrayBuffer> };

export interface Cube {
    file: Slicer;
    meta: Awaited<ReturnType<typeof parquetMetadataAsync>>;
    groups: Group[];
    totalBytes: number;
    footerBytes: number;
    bytesRead: () => number;
    requests: () => number;
    daily: DailyRow[];
    totals: { trips: number; revenue: number };
    sectionRows: { start: number; end: number }[];
    sections: Section[];
}

export interface ViewResult {
    daily: DailyRow[];
    boroughLb: LeaderRow[];
    zoneLb: LeaderRow[];
    totals: Totals;
    sections: number[]; // the distinct grouping sets that answered this view
    bytes: number;
    groupsRead: number;
    rowsScanned: number;
    requests: number;
    ms: number;
}

interface Window {
    d0: number;
    d1: number;
}

type Row = Record<string, unknown>;

const num = (x: unknown): number => (typeof x === 'bigint' ? Number(x) : (x as number));
const trips = (r: Row): number => Number(r.trips as bigint);
const revenue = (r: Row): number => r.revenue as number;
const has = (v?: string[]): boolean => !!v && v.length > 0;

function toMs(v: unknown): number {
    if (v instanceof Date) {
        return v.getTime();
    }
    if (typeof v === 'number') {
        return v * MS_PER_DAY;
    }
    return v == null ? NaN : Number(v);
}

// Prefetch one contiguous byte span and serve hyparquet's per-column slices from
// it, so a section read costs a single HTTP range request instead of one per column.
async function coalescedRead(
    cube: { file: Slicer; meta: Cube['meta'] },
    byteStart: number,
    byteEnd: number,
    rowStart: number,
    rowEnd: number,
    columns: string[] = COLUMNS,
): Promise<Row[]> {
    const prefetched = await cube.file.slice(byteStart, byteEnd);
    const mem: Slicer = {
        byteLength: cube.file.byteLength,
        slice: (s, e) => {
            const end = e ?? cube.file.byteLength;
            if (s >= byteStart && end <= byteEnd) {
                return prefetched.slice(s - byteStart, end - byteStart);
            }
            return cube.file.slice(s, e);
        },
    };
    return parquetReadObjects({ file: mem, metadata: cube.meta, compressors, columns, rowStart, rowEnd });
}

// Range reads address the *selected representation*, so an origin that transcodes
// the response (gzip/br) silently shifts every offset onto the compressed stream —
// the footer read then lands on encoding trailer bytes. Diagnose that here rather
// than letting it surface downstream as a bogus "invalid parquet file".
async function probe(url: string): Promise<number> {
    const res = await fetch(url, { method: 'HEAD' });
    if (!res.ok) {
        throw new Error(`${url} → HTTP ${res.status} ${res.statusText}`);
    }
    const encoding = res.headers.get('content-encoding');
    if (encoding) {
        throw new Error(`origin re-encoded the cube (content-encoding: ${encoding}); range reads need it served verbatim`);
    }
    const length = Number(res.headers.get('content-length'));
    if (!length) {
        throw new Error(`${url} → no content-length; cannot plan range reads`);
    }
    return length;
}

export async function openCube(url: string): Promise<Cube> {
    // Passing byteLength keeps hyparquet from issuing its own HEAD for the same fact.
    const raw = await asyncBufferFromUrl({ url, byteLength: await probe(url) });
    let read = 0;
    let reqs = 0;
    const file: Slicer = {
        byteLength: raw.byteLength,
        slice: async (start: number, end?: number) => {
            read += (end ?? raw.byteLength) - start;
            reqs += 1;
            return raw.slice(start, end);
        },
    };

    const meta = await parquetMetadataAsync(file);
    const cols = meta.row_groups[0].columns.map((c) => c.meta_data?.path_in_schema.join('.'));
    const dayCol = cols.indexOf('day');
    const gCol = cols.indexOf('g');

    let rowc = 0;
    let dataBytes = 0;
    const groups: Group[] = meta.row_groups.map((rg) => {
        const n = Number(rg.num_rows);
        let byteStart = Infinity;
        let byteEnd = 0;
        let compressed = 0; // total_compressed_size — total_byte_size is uncompressed
        for (const c of rg.columns) {
            const m = c.meta_data;
            if (!m) {
                continue;
            }
            const off = num(m.dictionary_page_offset ?? m.data_page_offset);
            byteStart = Math.min(byteStart, off);
            byteEnd = Math.max(byteEnd, off + num(m.total_compressed_size));
            compressed += num(m.total_compressed_size);
        }
        const day = rg.columns[dayCol].meta_data?.statistics;
        const gStat = rg.columns[gCol].meta_data?.statistics;
        const group: Group = {
            startRow: rowc,
            endRow: rowc + n,
            gMin: num(gStat?.min_value),
            gMax: num(gStat?.max_value),
            dayMin: toMs(day?.min_value),
            dayMax: toMs(day?.max_value),
            byteStart,
            byteEnd,
            bytes: compressed,
        };
        rowc += n;
        dataBytes += compressed;
        return group;
    });

    const cube: Cube = {
        file,
        meta,
        groups,
        totalBytes: raw.byteLength,
        footerBytes: raw.byteLength - dataBytes,
        bytesRead: () => read,
        requests: () => reqs,
        daily: [],
        totals: { trips: 0, revenue: 0 },
        sectionRows: [],
        sections: [],
    };

    // Section boundaries come from the row-group `g` statistics in the footer we
    // already hold. The cube is sorted by g, so a row group whose g min == max lies
    // wholly inside one section and needs no read at all; only the handful that
    // straddle a boundary have their `g` column read to pin the exact row.
    const total = Number(meta.num_rows);
    const sectionStart = new Array<number>(SECTION_COUNT).fill(-1);
    for (const grp of groups) {
        if (grp.gMin === grp.gMax) {
            if (sectionStart[grp.gMin] === -1) {
                sectionStart[grp.gMin] = grp.startRow;
            }
            continue;
        }
        const rows = await coalescedRead(cube, grp.byteStart, grp.byteEnd, grp.startRow, grp.endRow, ['g']);
        rows.forEach((r, i) => {
            const g = Number(r.g);
            if (sectionStart[g] === -1) {
                sectionStart[g] = grp.startRow + i;
            }
        });
    }
    // Right-to-left so a section with no rows collapses to an empty range.
    for (let g = SECTION_COUNT - 1; g >= 0; g--) {
        if (sectionStart[g] === -1) {
            sectionStart[g] = g + 1 < SECTION_COUNT ? sectionStart[g + 1] : total;
        }
    }
    cube.sectionRows = sectionStart.map((start, g) => ({
        start,
        end: g + 1 < SECTION_COUNT ? sectionStart[g + 1] : total,
    }));

    // The head sections share the first row groups: one read seeds totals + line.
    const headEnd = cube.sectionRows[DAILY_G + 1].start;
    const headCover = groups.filter((g) => g.startRow < headEnd);
    const headRows = await coalescedRead(cube, Math.min(...headCover.map((g) => g.byteStart)), Math.max(...headCover.map((g) => g.byteEnd)), 0, headEnd);
    for (const r of headRows) {
        const g = Number(r.g);
        if (g === TOTALS_G) {
            cube.totals = { trips: trips(r), revenue: revenue(r) };
        } else if (g === DAILY_G) {
            cube.daily.push({ t: (r.day as Date).getTime(), trips: trips(r), revenue: revenue(r) });
        }
    }
    cube.daily.sort((a, b) => a.t - b.t);

    // Row-group count and on-disk bytes per section (apportioned at boundaries).
    const stat = (g: number): { rowGroups: number; bytes: number } => {
        const { start, end } = cube.sectionRows[g];
        let rowGroups = 0;
        let bytes = 0;
        for (const grp of groups) {
            const overlap = Math.min(end, grp.endRow) - Math.max(start, grp.startRow);
            if (overlap > 0) {
                rowGroups += 1;
                bytes += grp.bytes * (overlap / (grp.endRow - grp.startRow));
            }
        }
        return { rowGroups, bytes };
    };
    const labels = ['totals', 'by borough', 'by zone', 'daily', 'daily × borough', 'daily × zone'];
    cube.sections = labels.map((label, g) => ({ g, label, rows: cube.sectionRows[g].end - cube.sectionRows[g].start, ...stat(g) }));

    return cube;
}

// ─── Minimal-section routing ────────────────────────────────────────────────
// Every panel reads the smallest grouping set that can answer it, de-duped so an
// interaction issues one range request per distinct section.

// The grouping set holding exactly the requested dimensions (needZone ⇒ needBorough).
function sectionFor(needDay: boolean, needBorough: boolean, needZone: boolean): number {
    const b = needBorough || needZone;
    if (needZone) {
        return needDay ? 5 : 2;
    }
    if (needDay) {
        return b ? 4 : 3;
    }
    return b ? 1 : 0;
}

// Zone is excluded from the line on purpose: a single zone's rows are scattered
// across the day-sorted daily-zone section, so folding a per-zone line would force
// a full-section scan. Zone stays a leaderboard/KPI filter, keeping reads small.
function lineSection(filter: Filter): number {
    return sectionFor(true, has(filter.borough), false);
}

function leaderSection(dim: Dim, filter: Filter, isFull: boolean): number {
    return sectionFor(!isFull, dim === 'borough' || has(filter.borough), dim === 'zone' || has(filter.zone));
}

function totalsSection(filter: Filter, isFull: boolean): number {
    return sectionFor(!isFull, has(filter.borough), has(filter.zone));
}

function popcount(n: number): number {
    let c = 0;
    for (let x = n; x; x >>= 1) {
        c += x & 1;
    }
    return c;
}

function inWindow(r: Row, win: Window | null): boolean {
    if (!win) {
        return true;
    }
    const t = (r.day as Date).getTime();
    return t >= win.d0 && t <= win.d1;
}

// A leaderboard leaves its own dimension (`skip`) free so its full ranking shows.
function matches(r: Row, filter: Filter, skip?: Dim): boolean {
    if (skip !== 'borough' && has(filter.borough) && !filter.borough!.includes(r.borough as string)) {
        return false;
    }
    if (skip !== 'zone' && has(filter.zone) && !filter.zone!.includes(r.zone as string)) {
        return false;
    }
    return true;
}

function withAvg(trips: number, revenue: number): Totals {
    return { trips, revenue, avgFare: trips ? revenue / trips : 0 };
}

function foldDaily(rows: Row[], filter: Filter): DailyRow[] {
    const byDay = new Map<number, DailyRow>();
    for (const r of rows) {
        if (!matches(r, filter)) {
            continue;
        }
        const t = (r.day as Date).getTime();
        let d = byDay.get(t);
        if (!d) {
            d = { t, trips: 0, revenue: 0 };
            byDay.set(t, d);
        }
        d.trips += trips(r);
        d.revenue += revenue(r);
    }
    return Array.from(byDay.values()).sort((a, b) => a.t - b.t);
}

function foldLeader(rows: Row[], dim: Dim, filter: Filter, win: Window | null): LeaderRow[] {
    const byKey = new Map<string, LeaderRow>();
    for (const r of rows) {
        if (!inWindow(r, win) || !matches(r, filter, dim)) {
            continue;
        }
        const key = r[dim] as string;
        let x = byKey.get(key);
        if (!x) {
            x = { key, trips: 0, revenue: 0 };
            byKey.set(key, x);
        }
        x.trips += trips(r);
        x.revenue += revenue(r);
    }
    return Array.from(byKey.values()).sort((a, b) => b.trips - a.trips);
}

function foldTotals(rows: Row[], filter: Filter, win: Window | null): Totals {
    let t = 0;
    let rev = 0;
    for (const r of rows) {
        if (!inWindow(r, win) || !matches(r, filter)) {
            continue;
        }
        t += trips(r);
        rev += revenue(r);
    }
    return withAvg(t, rev);
}

// A day-grained section under a window range-reads only the row groups it overlaps;
// every other section reads its (small) whole range.
async function readSection(cube: Cube, g: number, win: Window | null): Promise<{ rows: Row[]; groups: number }> {
    const { start, end } = cube.sectionRows[g];
    const cover = cube.groups.filter((grp) => {
        const overlaps = grp.endRow > start && grp.startRow < end;
        if (!overlaps) {
            return false;
        }
        return !(hasDay(g) && win) || (grp.dayMax >= win.d0 && grp.dayMin <= win.d1);
    });
    if (!cover.length) {
        return { rows: [], groups: 0 };
    }
    const rowStart = Math.max(start, cover[0].startRow);
    const rowEnd = Math.min(end, cover[cover.length - 1].endRow);
    const rows = (await coalescedRead(cube, Math.min(...cover.map((x) => x.byteStart)), Math.max(...cover.map((x) => x.byteEnd)), rowStart, rowEnd))
        .filter((r) => Number(r.g) === g);
    return { rows, groups: cover.length };
}

interface Read {
    g: number;
    full: boolean; // spans full history rather than the current window
    rows: Row[];
}

export async function readView(cube: Cube, filter: Filter, d0: number, d1: number): Promise<ViewResult> {
    const first = cube.daily[0].t;
    const last = cube.daily[cube.daily.length - 1].t;
    const isFull = d0 <= first && d1 >= last;
    const win: Window | null = isFull ? null : { d0, d1 };

    const before = { bytes: cube.bytesRead(), reqs: cube.requests() };
    const t0 = performance.now();

    // Each panel resolves to the finest already-planned read that contains its
    // dimensions, so one fetch answers the coarser panels for free. The resident
    // head sections (totals, daily) seed the plan at no cost.
    const reads: Read[] = [
        { g: TOTALS_G, full: true, rows: [] },
        { g: DAILY_G, full: true, rows: [] },
    ];
    const serves = (r: Read, g: number, needFull: boolean): boolean =>
        (SECTION_DIMS[g] & SECTION_DIMS[r.g]) === SECTION_DIMS[g] && (r.full || !needFull);
    const resolve = (g: number, needFull: boolean): Read => {
        const hit = reads.find((r) => serves(r, g, needFull));
        if (hit) {
            return hit;
        }
        const read: Read = { g, full: needFull || isFull, rows: [] };
        reads.push(read);
        return read;
    };

    // Resolve the full-history line first, then the rest finest-first for reuse.
    const lineRead = resolve(lineSection(filter), true);
    const panels: [Dim | 'kpi', number][] = [
        ['borough', leaderSection('borough', filter, isFull)],
        ['zone', leaderSection('zone', filter, isFull)],
        ['kpi', totalsSection(filter, isFull)],
    ];
    panels.sort((a, b) => popcount(SECTION_DIMS[b[1]]) - popcount(SECTION_DIMS[a[1]]));
    const readOf = new Map<string, Read>(panels.map(([key, g]) => [key, resolve(g, false)]));

    let groupsRead = 0;
    for (const r of reads) {
        if (r.g === TOTALS_G || r.g === DAILY_G) {
            continue;
        }
        const { rows, groups } = await readSection(cube, r.g, r.full ? null : win);
        r.rows = rows;
        groupsRead += groups;
    }

    // Only day-grained sources need the window; all-time sections carry no day.
    const foldWin = (g: number): Window | null => (hasDay(g) && !isFull ? win : null);

    const daily = lineRead.g === DAILY_G ? cube.daily : foldDaily(lineRead.rows, { borough: filter.borough });
    const boroughRead = readOf.get('borough')!;
    const zoneRead = readOf.get('zone')!;
    const kpiRead = readOf.get('kpi')!;
    const boroughLb = foldLeader(boroughRead.rows, 'borough', filter, foldWin(boroughRead.g));
    const zoneLb = foldLeader(zoneRead.rows, 'zone', filter, foldWin(zoneRead.g));
    const totals = totalsFor(cube, kpiRead, filter, win);

    const sections = Array.from(new Set([lineRead.g, boroughRead.g, zoneRead.g, kpiRead.g])).sort((a, b) => a - b);
    const rowsScanned = reads.reduce((sum, r) => sum + r.rows.length, 0);

    return {
        daily,
        boroughLb,
        zoneLb,
        totals,
        sections,
        bytes: cube.bytesRead() - before.bytes,
        groupsRead,
        rowsScanned,
        requests: cube.requests() - before.reqs,
        ms: performance.now() - t0,
    };
}

function totalsFor(cube: Cube, read: Read, filter: Filter, win: Window | null): Totals {
    if (read.g === TOTALS_G) {
        return withAvg(cube.totals.trips, cube.totals.revenue);
    }
    // No filter, sub-window: sum the resident daily series over the window.
    if (read.g === DAILY_G) {
        let trips = 0;
        let revenue = 0;
        for (const d of cube.daily) {
            if (!win || (d.t >= win.d0 && d.t <= win.d1)) {
                trips += d.trips;
                revenue += d.revenue;
            }
        }
        return withAvg(trips, revenue);
    }
    return foldTotals(read.rows, filter, win && hasDay(read.g) ? win : null);
}
