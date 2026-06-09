'use strict';

/**
 * Database configuration — PostgreSQL 12+ (on-premise / Azure Database for PostgreSQL)
 * Driver: pg (PostgreSQL native)
 * ORM: Bookshelf.js (Strapi v4 internals)
 *
 * Constitution: DATABASE_CLIENT=postgres obligatorio
 * Strapi auto-creates all tables on first start.
 * Producción: Azure Database for PostgreSQL (Standard B1s → Premium D8s)
 */
module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST', 'localhost'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'foton_strapi'),
      user: env('DATABASE_USERNAME', 'postgres'),
      password: env('DATABASE_PASSWORD', ''),
      schema: env('DATABASE_SCHEMA', 'public'),
      ssl: env.bool('DATABASE_SSL', false)
        ? {
            rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', false),
          }
        : false,
    },
    pool: {
      min: env.int('DATABASE_POOL_MIN', 2),
      max: env.int('DATABASE_POOL_MAX', 10),
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
    },
    acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    debug: env.bool('DATABASE_DEBUG', false),
  },
});
