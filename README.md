# Parquet Taxi Dashboard

Interactive analytics over **217 million** NYC yellow-taxi trips (2019–2023) with no backend,
no database and no API. The data is a single **3.9 MB** Parquet file sitting on static
hosting, and the browser fetches only the bytes each interaction actually needs.

**Live demo:** https://squirrelosopher.github.io/parquet-taxi-dashboard/

## Contents

- [The idea](#the-idea)
- [Run](#run)
- [Rebuilding the cube](#rebuilding-the-cube)
- [Design notes](#design-notes)
- [Data and credits](#data-and-credits)

## The idea

A dashboard only ever asks a handful of questions, so the answers are worked out ahead of
time. One DuckDB query rolls all 217M trips into six summaries and writes them to one file:

| | summary | rows | size |
|---|---|---|---|
| **g0** | totals | 1 | 12 B |
| **g1** | per borough | 8 | 97 B |
| **g2** | per zone | 262 | 3 KB |
| **g3** | per day | 1,826 | 22 KB |
| **g4** | per day × borough | 14,460 | 157 KB |
| **g5** | per day × zone | 415,651 | 3.6 MB |

Every summary covers all 217M trips and totals the same figure; they differ only in how much
detail survived the roll-up. Each occupies its own stretch of the file, ordered by date, so
the browser can fetch one with a single HTTP range request.

Detail that has been aggregated away cannot be recovered, so each question is routed to the
coarsest summary that still carries the dimensions it needs:

- **Total trips?** `g0`, a single row, 12 bytes. The same figure could be reached by summing
  all 415,651 rows of `g5`, at a cost of 3.6 MB.
- **Trips per day in Manhattan?** Needs day and borough, so `g4` at 157 KB rather than `g5`.
- **Busiest pickup zones?** Needs zone but not day, so `g2` at 3 KB.

A typical interaction therefore costs one request and a few dozen kilobytes, never the whole
file.

The panel at the bottom of the page shows what each interaction really cost: bytes fetched,
requests made, row groups touched. Those numbers are measured, not estimated.

## Run

```bash
npm install
npm run dev            # http://localhost:5173
```

The cube is committed, so it runs out of the box.

## Rebuilding the cube

Needs the [DuckDB](https://duckdb.org/) CLI:

```bash
duckdb < build_cube.sql
```

This streams the NYC TLC files into `raw.parquet` and writes the six summaries into the
cube. `ROW_GROUP_SIZE` sets how finely the file can be sliced: smaller row groups fetch more
precisely but cost more metadata.

## Design notes

A few decisions that are easy to miss when reading the code.

**Zone is deliberately absent from the time series.** A single zone's rows are spread across the
whole of the day-sorted `daily × zone` summary, so drawing a per-zone line would mean scanning
all 3.6 MB of it. Zone stays a leaderboard and KPI filter, where the coarser summaries answer it,
and every read stays small.

**Section boundaries come out of the footer, not a scan.** Each row group records the smallest
and largest `g` it contains. Rows are sorted by `g`, so a row group whose two values match sits
entirely inside one summary and is never read. Only the handful straddling a boundary are opened
to find the exact row it falls on — two of fifty-three in the current cube.

**A section costs one request, not one per column.** Parquet stores each column separately, so
reading six columns the obvious way means six requests per row group. Each read fetches one
contiguous span covering all of them and serves the per-column slices out of that span.

**The cube is served with a `.png` extension.** It is an ordinary Parquet file. GitHub Pages
picks a content type from the extension alone and compresses anything it deems compressible,
which shifts every byte offset and breaks range requests. The suffix makes Pages hand the file
over untouched. Anywhere response headers can be set directly, plain `cube.parquet` works.

## Data and credits

Trip data comes from the NYC TLC
[Yellow Taxi Trip Records](https://www.nyc.gov/site/tlc/about/tlc-trip-record-data.page).

The backend-less approach is adapted from Hamilton Ulmer's
[Customer-facing dashboards without a backend](https://www.hamiltonulmer.com/customer-dashboards-r2-hyparquet/),
which reads one Parquet file straight from R2. This version keeps six summaries at different
levels of detail in a single file and routes each interaction to the cheapest one that can
answer it.

Built with [hyparquet](https://github.com/hyparam/hyparquet/) for reading Parquet in the browser,
[DuckDB](https://duckdb.org/) for building the cube, and [React](https://react.dev/),
[Mantine](https://mantine.dev/) and [Vite](https://vite.dev/) for the interface.

## License

MIT — see [LICENSE](LICENSE).

Author: Aleksandar Miladinović ([@squirrelosopher](https://github.com/squirrelosopher/))
