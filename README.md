# Parquet Taxi Dashboard

Interactive analytics over **217 million** NYC yellow-taxi trips (2019–2023), rendered
entirely **client-side with no backend**. The data lives in one **3.9 MB Parquet "cube"**;
the browser reads its footer once, then fetches only the row groups a selection needs — one
HTTP range request per interaction.

**Live demo:** https://squirrelosopher.github.io/parquet-taxi-dashboard/

## How it works

The cube is a single Parquet file holding several `GROUP BY GROUPING SETS`, sorted by
`(g, day, borough, zone)` so each section is a contiguous, day-ordered byte range:

| g | grouping set | g | grouping set |
|---|---|---|---|
| 0 | totals | 3 | daily |
| 1 | by borough | 4 | daily × borough |
| 2 | by zone | 5 | daily × zone |

On load the browser reads the footer plus the small head (totals + daily line). Each borough,
zone, or date-range selection routes to the smallest grouping set that answers it and
range-reads just those row groups with [hyparquet](https://github.com/hyparam/hyparquet) — no
database, no API. The "Cube layout" panel shows what each interaction actually fetched.

## Run

```bash
npm install
npm run dev            # http://localhost:5173
```

`public/cube.parquet` is committed, so it runs out of the box.

## Rebuilding the cube

Needs the [DuckDB](https://duckdb.org) CLI:

```bash
duckdb < build_cube.sql
```

It streams the NYC TLC files into `raw.parquet` (a git-ignored intermediate) and writes the
grouping-sets `public/cube.parquet`.

## Credit

Approach adapted from Hamilton Ulmer's
[Customer-facing dashboards without a backend](https://www.hamiltonulmer.com/customer-dashboards-r2-hyparquet/).
Data: NYC TLC [Yellow Taxi Trip Records](https://www.nyc.gov/site/tlc/about/tlc-trip-record-data.page).

## License

MIT — see [LICENSE](LICENSE).
