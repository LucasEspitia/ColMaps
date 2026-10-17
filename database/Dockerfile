# Build context: ./database
FROM mambaorg/micromamba:2.0.8

USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        osm2pgsql \
        postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/database

COPY --chown=$MAMBA_USER:$MAMBA_USER environment.yml /tmp/environment.yml

RUN micromamba install -y -n base -f /tmp/environment.yml \
    && micromamba clean --all --yes

COPY --chown=$MAMBA_USER:$MAMBA_USER . /app/database/

ENV PYTHONUNBUFFERED=1

USER $MAMBA_USER

CMD ["sh", "-ec", "\
  python scripts/build_pois.py --check-only && \
  python scripts/import_osm.py && \
  export PGHOST=\"${DB_HOST:-db}\" \
         PGPORT=\"${DB_PORT:-5432}\" \
         PGUSER=\"$DB_USER\" \
         PGDATABASE=\"$DB_NAME\" \
         PGPASSWORD=\"$DB_PASSWORD\" && \
  psql -X -v ON_ERROR_STOP=1 -f migrations/001_create_pois.sql && \
  python scripts/build_pois.py --direct \
"]