FROM mambaorg/micromamba:2.0.8

WORKDIR /app/data-pipeline

COPY --chown=$MAMBA_USER:$MAMBA_USER environment.yml /tmp/environment.yml

RUN micromamba install \
    -y \
    -n base \
    -f /tmp/environment.yml \
    && micromamba clean --all --yes

COPY --chown=$MAMBA_USER:$MAMBA_USER . .

RUN mkdir -p raw filtered processed

ENV PYTHONUNBUFFERED=1

CMD ["bash", "-c", "python scripts/download_osm.py && python scripts/filter_osm.py"]