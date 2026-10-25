import { Migration } from '@mikro-orm/migrations';

export class Migration20261025145611 extends Migration {
  override name = 'Migration20261025145611';

  override up(): void {
    this.addSql(`
      create table "quality_runs" (
        "id" uuid not null,
        "source" varchar(255) not null,
        "status" varchar(255) not null,
        "environment" varchar(255) not null,
        "commit_sha" varchar(255) null,
        "branch" varchar(255) null,
        "artifact_url" varchar(255) null,
        "started_at" timestamptz not null,
        "finished_at" timestamptz null,
        primary key ("id")
      );
    `);

    this.addSql(`
      create table "quality_results" (
        "id" uuid not null,
        "run_id" uuid not null,
        "metric" varchar(255) not null,
        "value" double precision not null,
        "unit" varchar(255) not null,
        "target" varchar(255) null,
        "device" varchar(255) not null,
        "page" varchar(255) null,
        "details" jsonb null,
        primary key ("id")
      );
    `);

    this.addSql(`
      alter table "quality_results"
      add constraint "quality_results_run_id_foreign"
      foreign key ("run_id")
      references "quality_runs" ("id")
      on delete cascade;
    `);
  }

  override down(): void {
    this.addSql(`drop table if exists "quality_results" cascade;`);
    this.addSql(`drop table if exists "quality_runs" cascade;`);
  }
}
