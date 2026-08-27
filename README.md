# Parquet Taxi Dashboard

Interactive analytics over **217 million** NYC yellow-taxi trips (2019–2023) with **no backend,
no database, and no API**. The data is one **3.9 MB Parquet "cube"** on static hosting. The
browser reads its footer once, then answers every interaction by routing to the cheapest
pre-aggregate that can serve it and range-reading only those bytes.

**Live demo:** https://squirrelosopher.github.io/parquet-taxi-dashboard/

The dashboard reports what each interaction actually cost — bytes fetched, HTTP requests, row
groups touched, rows scanned. Those numbers are measured, not estimated.

## The idea

A dashboard asks a small, predictable set of questions. Precomputing the answers turns
"query 217M rows" into "seek to the right bytes."

One `GROUP BY GROUPING SETS` builds six aggregates into a single file, sorted by
`(g, day, borough, zone)` so each section is a **contiguous, day-ordered byte range**:

| g | grouping set | dims | g | grouping set | dims |
|---|---|---|---|---|---|
| 0 | totals | — | 3 | daily | D |
| 1 | by borough | B | 4 | daily × borough | D·B |
| 2 | by zone | B·Z | 5 | daily × zone | D·B·Z |

**Routing.** Each dimension is a bit (`D=1, B=2, Z=4`), so a section with dims `A` can answer
any panel whose dims are a subset of `A` by folding the extras away. Panels resolve
finest-first, so one fetch covers the coarser panels for free — a four-panel view usually
collapses to one or two range requests. The line chart, KPI row, and both leaderboards
frequently share a single read.

**Pruning.** Day-grained sections carry per-row-group `day` statistics in the footer. A date
window skips every row group whose range falls outside it, so narrowing the window narrows the
fetch.

**Coalescing.** Parquet stores columns separately, so reading six columns would mean six
requests per row group. Each section read prefetches one contiguous span and serves
hyparquet's per-column slices out of it — **one HTTP request per section**.

**Startup.** Section boundaries are derived from the row-group `g` statistics already present
in the footer. A row group whose `g` min equals its max sits wholly inside one section and is
never read; only the few that straddle a boundary are touched. Opening the cube costs the
footer plus the head sections — no full-column scan.

One deliberate omission: zone is excluded from the time series. A single zone's rows are
scattered across the day-sorted `daily × zone` section, so a per-zone line would force a
full-section scan. Zone stays a leaderboard and KPI filter, which keeps every read small.

## A note on hosting: `cube.parquet.png`

The extension is not a typo. GitHub Pages gzip-transcodes `application/octet-stream` when the
client sends `Accept-Encoding: gzip` — which every browser does. HTTP ranges apply to the
*selected representation*, so once the response is compressed, offsets address the gzip stream
instead of the file: `Content-Length` reports the compressed size, a footer read returns
encoding trailer bytes, and reads past the compressed length return `416`. It fails only in
browsers, which is what makes it easy to miss — `curl` doesn't request compression by default.

Extensions mapping to an already-compressed type are passed through verbatim, so the cube is
served as `image/png` and arrives byte-exact. It is ordinary Parquet; only the content-type the
CDN infers changes. Any origin that serves bytes without transcoding — R2, S3, or a CDN you
control the headers on — needs no such trick.

`openCube` checks for this explicitly and fails with the actual diagnosis rather than an
"invalid parquet file" that blames the wrong thing.

## Run

```bash
npm install
npm run dev            # http://localhost:5173
```

`public/cube.parquet.png` is committed, so it runs out of the box.

## Rebuilding the cube

Needs the [DuckDB](https://duckdb.org) CLI:

```bash
duckdb < build_cube.sql
```

It streams the NYC TLC files into `raw.parquet` (a git-ignored intermediate) and writes the
grouping-sets cube. `ROW_GROUP_SIZE 8192` sets read granularity: smaller row groups prune more
precisely and cost more footer metadata.

## Built with

[hyparquet](https://github.com/hyparam/hyparquet) for Parquet in the browser, DuckDB for the
cube, React + Mantine + Vite for the UI. No server-side anything.

## Credit

The backend-less approach is adapted from Hamilton Ulmer's
[Customer-facing dashboards without a backend](https://www.hamiltonulmer.com/customer-dashboards-r2-hyparquet/),
which range-reads a single-grain Parquet file from R2. This project extends that to a
**multi-section cube** — six grouping sets in one file with subset-based routing, cross-panel
read deduplication, coalesced column reads, footer-statistics section discovery, and per-interaction
fetch accounting in the UI.

Data: NYC TLC [Yellow Taxi Trip Records](https://www.nyc.gov/site/tlc/about/tlc-trip-record-data.page).

## License

MIT — see [LICENSE](LICENSE).
