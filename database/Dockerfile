FROM mambaorg/micromamba:2.0.8

USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends osm2pgsql \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/database

COPY --chown=$MAMBA_USER:$MAMBA_USER environment.yml /tmp/environment.yml

RUN micromamba install \
    -y \
    -n base \
    -f /tmp/environment.yml \
    && micromamba clean --all --yes

COPY --chown=$MAMBA_USER:$MAMBA_USER . .

ENV PYTHONUNBUFFERED=1

USER $MAMBA_USER

CMD ["python", "scripts/import_osm.py"]