#!/usr/bin/env python3
"""Build the optimized public.pois read model from imported OSM features.

Run from any directory. Use Docker Compose locally or psql directly in the
import container. The OSM download, filtering and import are NOT rerun.

Usage:
    python database/scripts/build_pois.py --check-only
    python database/scripts/build_pois.py
    python scripts/build_pois.py --direct  # inside data-import container
    python database/scripts/build_pois.py --scope path.csv --rules path.json
"""

from __future__ import annotations

import argparse
import csv
import json
import subprocess
from collections import Counter
from pathlib import Path


DATABASE_DIR = Path(__file__).resolve().parent.parent
REPOSITORY_DIR = DATABASE_DIR.parent
PIPELINE_DIR = REPOSITORY_DIR / "data-pipeline"

# Local development: filters/
# Docker: shared processed/ volume
RULES_DIR = PIPELINE_DIR / "filters"

if not RULES_DIR.exists():
    RULES_DIR = PIPELINE_DIR / "processed"

DEFAULT_SCOPE = RULES_DIR / "02_validated_feature_scope.csv"
DEFAULT_RULES = RULES_DIR / "03_preparation_rules.json"

REQUIRED_COLUMNS = {
    "category", "osm_key", "osm_value", "include", "decision",
    "secondary_key", "rule_type",
}
VALID_DECISIONS = {"RETAIN", "REFINE", "EXCLUDE"}


def normalize_column(column: str) -> str:
    """Tolerate markdown formatting in copied versions of the source CSV."""
    return column.strip().strip("*").strip()


def read_inputs(scope_path: Path, rules_path: Path) -> list[dict]:
    if not scope_path.is_file():
        raise FileNotFoundError(f"Mapping CSV not found: {scope_path}")
    if not rules_path.is_file():
        raise FileNotFoundError(f"Preparation rules JSON not found: {rules_path}")

    with rules_path.open(encoding="utf-8-sig") as source:
        refinements = json.load(source)
    if not isinstance(refinements, dict):
        raise ValueError("Preparation rules JSON must be an object")

    with scope_path.open(encoding="utf-8-sig", newline="") as source:
        reader = csv.DictReader(source)
        if reader.fieldnames is None:
            raise ValueError("Mapping CSV has no header")
        reader.fieldnames = [normalize_column(field) for field in reader.fieldnames]
        missing = REQUIRED_COLUMNS - set(reader.fieldnames)
        if missing:
            raise ValueError(f"Missing mapping CSV columns: {sorted(missing)}")
        rows = list(reader)

    prepared: list[dict] = []
    seen: set[tuple[str, str, str]] = set()
    used_refinements: set[str] = set()

    for line_number, row in enumerate(rows, start=2):
        if not row.get("category"):
            continue

        category = row["category"].strip()
        osm_key = row["osm_key"].strip()
        osm_value = row["osm_value"].strip()
        include = row["include"].strip().lower()
        decision = row["decision"].strip().upper()
        secondary_key = (row.get("secondary_key") or "").strip()
        rule_type = (row.get("rule_type") or "").strip()

        if not all((category, osm_key, osm_value)):
            raise ValueError(f"CSV line {line_number}: missing category or OSM tag")
        if include not in {"true", "false"}:
            raise ValueError(f"CSV line {line_number}: invalid include value")
        if decision not in VALID_DECISIONS:
            raise ValueError(f"CSV line {line_number}: invalid decision {decision}")

        identity = (category, osm_key, osm_value)
        if identity in seen:
            raise ValueError(f"CSV line {line_number}: repeated mapping {identity}")
        seen.add(identity)

        if include == "false":
            continue

        spec = {
            "category": category,
            "osm_key": osm_key,
            "osm_value": osm_value,
            "decision": decision,
        }
        if decision == "REFINE":
            identity_key = f"{osm_key}={osm_value}"
            rule = refinements.get(identity_key)
            if not isinstance(rule, dict):
                raise ValueError(f"Missing JSON refinement: {identity_key}")
            if rule.get("secondary_key") != secondary_key or rule.get("rule_type") != rule_type:
                raise ValueError(f"CSV/JSON refinement mismatch: {identity_key}")
            if rule_type not in {"classification", "restriction"}:
                raise ValueError(f"Unsupported rule type: {rule_type}")
            if rule.get("missing_value") not in {"retain", "exclude"}:
                raise ValueError(f"Unsupported missing_value in {identity_key}")

            if rule_type == "classification":
                if not isinstance(rule.get("allowed_values"), list):
                    raise ValueError(f"Missing allowed_values in {identity_key}")
                if not isinstance(rule.get("reclassify", {}), dict):
                    raise ValueError(f"Invalid reclassify in {identity_key}")
            else:
                if not isinstance(rule.get("excluded_values"), list):
                    raise ValueError(f"Missing excluded_values in {identity_key}")
                csv_exclusions = (row.get("excluded_values") or "").strip("*").strip()
                if csv_exclusions and set(csv_exclusions.split("|")) != set(rule["excluded_values"]):
                    raise ValueError(f"CSV/JSON exclusions mismatch: {identity_key}")

            spec.update(rule)
            used_refinements.add(identity_key)
        prepared.append(spec)

    if not prepared:
        raise ValueError("No included mappings found")
    extra_refinements = set(refinements) - used_refinements
    if extra_refinements:
        raise ValueError(f"JSON contains unused refinements: {sorted(extra_refinements)}")
    return prepared


def sql_string(value: str) -> str:
    """Quote a validated JSON document as a PostgreSQL string literal."""
    return "'" + value.replace("'", "''") + "'"


def build_sql(mappings: list[dict]) -> str:
    payload = sql_string(json.dumps(mappings, ensure_ascii=False, separators=(",", ":")))
    # Explicit BEGIN/COMMIT keep the refresh atomic when psql reads from stdin.
    # A temporary table is fully computed and validated BEFORE public.pois is touched.
    return f"""
BEGIN;

DO $$
BEGIN

  IF to_regclass('public.osm_features') IS NULL THEN
    RAISE EXCEPTION 'Source table public.osm_features does not exist';
  END IF;
  IF to_regclass('public.pois') IS NULL THEN
    RAISE EXCEPTION 'Target public.pois does not exist; apply the SQL migration first';
  END IF;
END $$;

CREATE TEMP TABLE colmaps_pois_stage ON COMMIT DROP AS
WITH input_rules AS (
  SELECT item.rule,
         item.priority
  FROM jsonb_array_elements({payload}::jsonb)
       WITH ORDINALITY AS item(rule, priority)
),
rule_map AS (
  SELECT
    priority,
    rule->>'category' AS category,
    rule->>'osm_key' AS osm_key,
    rule->>'osm_value' AS osm_value,
    rule->>'decision' AS decision,
    rule->>'rule_type' AS rule_type,
    rule->>'secondary_key' AS secondary_key,
    COALESCE(rule->>'missing_value', 'retain') AS missing_value,
    COALESCE(rule->'allowed_values', '[]'::jsonb) AS allowed_values,
    COALESCE(rule->'excluded_values', '[]'::jsonb) AS excluded_values,
    COALESCE(rule->'reclassify', '{{}}'::jsonb) AS reclassify
  FROM input_rules
),
matched AS (
  SELECT
    f.osm_type,
    f.osm_id,
    r.category,
    r.priority,
    CASE
      WHEN r.rule_type = 'classification'
           AND r.reclassify ? (f.tags->>r.secondary_key)
        THEN r.reclassify->>(f.tags->>r.secondary_key)
      WHEN r.rule_type = 'classification'
           AND r.allowed_values ? (f.tags->>r.secondary_key)
        THEN f.tags->>r.secondary_key
      ELSE r.osm_value
    END AS subcategory
  FROM public.osm_features AS f
  CROSS JOIN LATERAL jsonb_each_text(COALESCE(f.tags, '{{}}'::jsonb)) AS t(key, value)
  JOIN rule_map AS r
    ON r.osm_key = t.key AND r.osm_value = t.value
  WHERE f.geom IS NOT NULL
    AND NOT ST_IsEmpty(f.geom)
    AND r.decision <> 'EXCLUDE'
    AND (
      r.decision = 'RETAIN'
      OR (
        r.decision = 'REFINE'
        AND (
          (r.rule_type = 'restriction' AND (
            (f.tags->>r.secondary_key IS NULL AND r.missing_value = 'retain')
            OR (f.tags->>r.secondary_key IS NOT NULL
                AND NOT (r.excluded_values ? (f.tags->>r.secondary_key)))
          ))
          OR (r.rule_type = 'classification' AND (
            (f.tags->>r.secondary_key IS NULL AND r.missing_value = 'retain')
            OR r.allowed_values ? (f.tags->>r.secondary_key)
            OR r.reclassify ? (f.tags->>r.secondary_key)
          ))
        )
      )
    )
),
one_category_match AS (
  SELECT osm_type, osm_id, category, priority, subcategory
  FROM (
    SELECT matched.*,
           ROW_NUMBER() OVER (
             PARTITION BY osm_type, osm_id, category
             ORDER BY priority, subcategory
           ) AS category_rank
    FROM matched
  ) AS numbered
  WHERE category_rank = 1
),
classified AS (
  SELECT
    osm_type,
    osm_id,
    ARRAY_AGG(category ORDER BY priority, category) AS categories,
    (ARRAY_AGG(subcategory ORDER BY priority, category))[1] AS subcategory
  FROM one_category_match
  GROUP BY osm_type, osm_id
)
SELECT
  f.osm_type,
  f.osm_id,
  f.name,
  c.categories[1] AS primary_category,
  c.categories,
  c.subcategory,
  ST_PointOnSurface(f.geom)::geometry(Point, 3857) AS marker_geom
FROM classified AS c
JOIN public.osm_features AS f
  ON f.osm_type = c.osm_type AND f.osm_id = c.osm_id;

-- Abort without modifying the existing POIs if preparation is incomplete.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM colmaps_pois_stage) THEN
    RAISE EXCEPTION 'POI staging table is empty; refusing to replace public.pois';
  END IF;
  IF EXISTS (
    SELECT 1 FROM colmaps_pois_stage
    GROUP BY osm_type, osm_id HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'POI staging table has duplicated OSM identities';
  END IF;
  IF EXISTS (
    SELECT 1 FROM colmaps_pois_stage
    WHERE marker_geom IS NULL OR ST_IsEmpty(marker_geom)
      OR ST_SRID(marker_geom) <> 3857
      OR NOT (primary_category = ANY(categories))
  ) THEN
    RAISE EXCEPTION 'POI staging data failed geometry/category validation';
  END IF;
END $$;

TRUNCATE TABLE public.pois;
INSERT INTO public.pois (
  osm_type, osm_id, name, primary_category, categories, subcategory, marker_geom
)
SELECT
  osm_type, osm_id, name, primary_category, categories, subcategory, marker_geom
FROM colmaps_pois_stage
ORDER BY osm_type, osm_id;

ANALYZE public.pois;

SELECT COUNT(*) AS total_pois FROM public.pois;
SELECT category, COUNT(*) AS total
FROM public.pois CROSS JOIN LATERAL UNNEST(categories) AS c(category)
GROUP BY category
ORDER BY category;

COMMIT;
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scope", type=Path, default=DEFAULT_SCOPE,
                        help="Path to the validated OSM feature mappings CSV")
    parser.add_argument("--rules", type=Path, default=DEFAULT_RULES,
                        help="Path to the JSON refinement rules")
    parser.add_argument("--service", default="db",
                        help="Docker Compose PostgreSQL service name (default: db)")
    parser.add_argument("--check-only", action="store_true",
                        help="Validate inputs without changing PostgreSQL")
    parser.add_argument("--direct", action="store_true",
                        help="Execute SQL directly using psql inside Docker",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    mappings = read_inputs(args.scope, args.rules)
    counts = Counter(m["decision"] for m in mappings)
    categories = {m["category"] for m in mappings if m["decision"] != "EXCLUDE"}
    print(f"Loaded {len(mappings)} rules across {len(categories)} categories:")
    print("  " + ", ".join(f"{decision}={counts[decision]}" for decision in sorted(counts)))
    print("Primary-category priority follows the validated CSV row order.")
    if args.check_only:
        print("Check passed. Database unchanged.")
        return

    if args.direct:
        # Inside data-import, the Dockerfile exports PGHOST, PGPORT,
        # PGUSER, PGDATABASE and PGPASSWORD before running this script.
        command = ["psql", "-X", "-v", "ON_ERROR_STOP=1"]
        working_directory = DATABASE_DIR
    else:
        # From the Linux host, use the existing Compose database service.
        command = [
            "docker", "compose", "exec", "-T", args.service,
            "sh", "-c",
            'exec psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"',
        ]
        working_directory = REPOSITORY_DIR

    print("Building public.pois within a single PostgreSQL transaction...", flush=True)
    result = subprocess.run(
        command,
        input=build_sql(mappings),
        text=True,
        cwd=working_directory,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError("POI build failed; transaction rolled back. See psql error above.")
    print("POI preparation completed successfully.")


if __name__ == "__main__":
    main()
