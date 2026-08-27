-- Build the NYC taxi cube from the public TLC Parquet files with DuckDB.
--   1. stream 60 monthly files -> raw.parquet  (day, borough, zone grain)
--   2. expand into one cube of GROUP BY GROUPING SETS -> public/cube.parquet
--
-- Dimensions: borough (8) and pickup zone (~265, drills down within a borough).
-- Zone → borough is 1:1, so zone sections carry their borough as an attribute.
-- Each grouping set is a contiguous section, day-sorted so a date window maps to
-- a small range read.

INSTALL httpfs; LOAD httpfs;

SET VARIABLE urls = (
  SELECT list('https://d37ci6vzurychx.cloudfront.net/trip-data/yellow_tripdata_'
       || y || '-' || lpad(m::VARCHAR, 2, '0') || '.parquet')
  FROM range(2019, 2024) t(y), range(1, 13) s(m)
);

CREATE TABLE zones AS
  SELECT LocationID::INT AS loc, Borough AS borough, Zone AS zone
  FROM read_csv('https://d37ci6vzurychx.cloudfront.net/misc/taxi_zone_lookup.csv', header=true);

-- raw.parquet: trips + revenue per (day, borough, zone).
COPY (
  WITH trips AS (
    SELECT CAST(tpep_pickup_datetime AS DATE) AS day,
           PULocationID AS loc,
           total_amount
    FROM read_parquet(getvariable('urls'), union_by_name=true)
    WHERE tpep_pickup_datetime >= DATE '2019-01-01' AND tpep_pickup_datetime < DATE '2024-01-01'
      AND total_amount BETWEEN 0 AND 1000
  )
  SELECT t.day,
         coalesce(z.borough, 'Unknown') AS borough,
         coalesce(z.zone, 'Unknown') AS zone,
         count(*) AS trips,
         round(sum(t.total_amount), 2) AS revenue
  FROM trips t LEFT JOIN zones z ON t.loc = z.loc
  GROUP BY 1, 2, 3
) TO 'raw.parquet' (FORMAT parquet, COMPRESSION snappy);

-- cube.parquet: grouping sets stacked in one file, sorted by (g, day, borough,
-- zone) so each section is contiguous and the daily sections are day-sorted.
--   g0 total          g1 by borough      g2 by zone
--   g3 daily          g4 daily × borough g5 daily × zone (the workhorse; range-read)
COPY (
  SELECT * FROM (
    SELECT 0 AS g, CAST(NULL AS DATE) AS day, CAST(NULL AS VARCHAR) AS borough, CAST(NULL AS VARCHAR) AS zone,
           sum(trips) AS trips, round(sum(revenue),2) AS revenue FROM 'raw.parquet'
    UNION ALL
    SELECT 1, NULL, borough, NULL, sum(trips), round(sum(revenue),2) FROM 'raw.parquet' GROUP BY borough
    UNION ALL
    SELECT 2, NULL, borough, zone, sum(trips), round(sum(revenue),2) FROM 'raw.parquet' GROUP BY borough, zone
    UNION ALL
    SELECT 3, day, NULL, NULL, sum(trips), round(sum(revenue),2) FROM 'raw.parquet' GROUP BY day
    UNION ALL
    SELECT 4, day, borough, NULL, sum(trips), round(sum(revenue),2) FROM 'raw.parquet' GROUP BY day, borough
    UNION ALL
    SELECT 5, day, borough, zone, sum(trips), round(sum(revenue),2) FROM 'raw.parquet' GROUP BY day, borough, zone
  )
  ORDER BY g, day, borough, zone
) TO 'public/cube.parquet' (FORMAT parquet, COMPRESSION snappy, ROW_GROUP_SIZE 8192);
