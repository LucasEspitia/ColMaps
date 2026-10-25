import { Migration } from '@mikro-orm/migrations';

export class Migration20261025145611 extends Migration {
  override name = 'Migration20261025145611';

  override up(): void | Promise<void> {
    this.addSql(
      `create table "quality_runs" ("id" uuid not null, "source" varchar(255) not null, "status" varchar(255) not null, "environment" varchar(255) not null, "commit_sha" varchar(255) null, "branch" varchar(255) null, "artifact_url" varchar(255) null, "started_at" timestamptz not null, "finished_at" timestamptz null, primary key ("id"));`,
    );

    this.addSql(
      `create table "quality_results" ("id" uuid not null, "run_id" uuid not null, "metric" varchar(255) not null, "value" double precision not null, "unit" varchar(255) not null, "target" varchar(255) null, "device" varchar(255) not null, "page_url" varchar(255) null, "details" jsonb null, primary key ("id"));`,
    );

    this.addSql(`drop table if exists "osm2pgsql_properties" cascade;`);
    this.addSql(`drop table if exists "osm_features" cascade;`);
    this.addSql(`drop table if exists "pois" cascade;`);

    this.addSql(
      `alter table "quality_results" add constraint "quality_results_run_id_foreign" foreign key ("run_id") references "quality_runs" ("id") on delete cascade;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "quality_results" drop constraint "quality_results_run_id_foreign";`,
    );

    this.addSql(
      `create table "osm2pgsql_properties" ("property" text not null, "value" text not null, primary key ("property"));`,
    );

    this.addSql(
      `create table "osm_features" ("osm_type" char(1) not null, "osm_id" int8 not null, "name" text null, "tags" jsonb null, "geom" geometry(Geometry,3857) null);`,
    );
    this.addSql(
      `create index "osm_features_geom_idx" on "osm_features" using gist ("geom") with (fillfactor = 100);`,
    );

    this.addSql(
      `create table "pois" ("osm_type" char(1) not null, "osm_id" int8 not null, "name" text null, "primary_category" text not null, "categories" text[] not null, "subcategory" text not null, "marker_geom" geometry(Point,4326) not null, primary key ("osm_type", "osm_id"));`,
    );
    this.addSql(
      `comment on table "pois" is 'Read-optimized POI representation derived from validated OSM features.';`,
    );
    this.addSql(
      `create index "pois_categories_idx" on "pois" using gin ("categories");`,
    );
    this.addSql(
      `create index "pois_marker_geom_idx" on "pois" using gist ("marker_geom");`,
    );

    this.addSql(`drop table if exists "quality_runs" cascade;`);
    this.addSql(`drop table if exists "quality_results" cascade;`);

    this.addSql(
      `alter table "pois" add constraint "pois_categories_not_empty" check (cardinality(categories) > 0);`,
    );
    this.addSql(
      `alter table "pois" add constraint "pois_marker_not_empty" check (NOT st_isempty(marker_geom));`,
    );
    this.addSql(
      `alter table "pois" add constraint "pois_primary_category_valid" check (primary_category = ANY (categories));`,
    );
  }
}
