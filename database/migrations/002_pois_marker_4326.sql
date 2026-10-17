-- 002_pois_marker_4326.sql
-- Migrate only public.pois marker geometry to WGS84 longitude/latitude.
-- Safe to rerun: skips when marker_geom is already EPSG:4326.

BEGIN;

DO $$
DECLARE
current_srid integer;
BEGIN
    SELECT srid INTO current_srid
    FROM public.geometry_columns
    WHERE f_table_schema = 'public'
      AND f_table_name = 'pois'
      AND f_geometry_column = 'marker_geom';

    IF current_srid = 3857 THEN
        ALTER TABLE public.pois
            ALTER COLUMN marker_geom TYPE geometry(Point, 4326)
            USING ST_Transform(marker_geom, 4326);
    ELSIF current_srid = 4326 THEN
        RAISE NOTICE 'public.pois.marker_geom is already EPSG:4326';
    ELSE
        RAISE EXCEPTION 'Unexpected or missing public.pois.marker_geom SRID: %', current_srid;
    END IF;
END $$;

ANALYZE public.pois;

COMMIT;
