-- ColMaps
-- Optimized POI read model
-- Source: public.osm_features

CREATE TABLE IF NOT EXISTS public.pois (
    osm_type CHAR(1) NOT NULL,
    osm_id BIGINT NOT NULL,

    name TEXT,

    primary_category TEXT NOT NULL,
    categories TEXT[] NOT NULL,
    subcategory TEXT NOT NULL,

    marker_geom geometry(Point, 3857) NOT NULL,

    CONSTRAINT pois_pkey
        PRIMARY KEY (osm_type, osm_id),

    CONSTRAINT pois_categories_not_empty
        CHECK (cardinality(categories) > 0),

    CONSTRAINT pois_primary_category_valid
        CHECK (primary_category = ANY(categories)),

    CONSTRAINT pois_marker_not_empty
        CHECK (NOT ST_IsEmpty(marker_geom))
);

-- Spatial viewport queries
CREATE INDEX IF NOT EXISTS pois_marker_geom_idx
ON public.pois
USING GIST (marker_geom);

-- Category filtering
CREATE INDEX IF NOT EXISTS pois_categories_idx
ON public.pois
USING GIN (categories);

COMMENT ON TABLE public.pois IS
'Read-optimized POI representation derived from validated OSM features.';