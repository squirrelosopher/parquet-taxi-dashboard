# Parquet Taxi Dashboard

Interactive analytics over **217 million** NYC yellow-taxi trips (2019–2023) with no backend,
no database and no API. The data is a single **3.9 MB** Parquet file sitting on static
hosting, and the browser fetches only the bytes each interaction actually needs.

**Live demo:** https://squirrelosopher.github.io/parquet-taxi-dashboard/

## The idea

A dashboard only ever asks a handful of questions, so the answers are worked out ahead of
time. One DuckDB query rolls all 217M trips into six summaries and writes them to one file:

| | summary | | summary |
|---|---|---|---|
| **g0** | totals | **g3** | per day |
| **g1** | per borough | **g4** | per day × borough |
| **g2** | per zone | **g5** | per day × zone |

Each summary occupies its own stretch of the file, ordered by date. When you pick a borough
or drag out a date range, the browser works out which summary can answer it and fetches just
that stretch with an HTTP range request — normally one request and a few dozen kilobytes,
never the whole file.

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

## Built with

- **[hyparquet](https://github.com/hyparam/hyparquet/)** — reads Parquet in the browser
- **[DuckDB](https://duckdb.org/)** — builds the cube offline
- **React**, **Mantine**, **Vite** — the interface

## Note on the file name

`cube.parquet.png` is an ordinary Parquet file. GitHub Pages decides how to serve a file from
its extension alone, and compresses anything it considers compressible — which shifts the byte
offsets this project relies on and breaks range requests. The `.png` suffix makes Pages hand
the file over untouched. Anywhere you can set response headers yourself, plain
`cube.parquet` works fine.

## Credit

Adapted from Hamilton Ulmer's
[Customer-facing dashboards without a backend](https://www.hamiltonulmer.com/customer-dashboards-r2-hyparquet/),
which reads one Parquet file straight from R2. This version keeps six summaries at different
levels of detail in a single file and picks the cheapest one that can answer each interaction.

Data: NYC TLC [Yellow Taxi Trip Records](https://www.nyc.gov/site/tlc/about/tlc-trip-record-data.page).

## License

MIT — see [LICENSE](LICENSE).
