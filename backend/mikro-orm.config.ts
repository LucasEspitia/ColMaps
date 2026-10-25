import { config } from 'dotenv';

import { defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';

// Load the environment before evaluating the ORM options (also used by the CLI).
config({ path: ['../.env', '.env'], quiet: true });

export default defineConfig({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  dbName: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  entities: ['./dist/**/*.entity.js'],
  entitiesTs: ['./src/**/*.entity.ts'],

  extensions: [Migrator],

  migrations: {
    path: './dist/migrations',
    pathTs: './src/migrations',
    dropTables: false,
  },

  schemaGenerator: {
    skipTables: ['osm2pgsql_properties', 'osm_features', 'pois'],
  },

  discovery: {
    warnWhenNoEntities: false,
  },

  debug: false,
});
