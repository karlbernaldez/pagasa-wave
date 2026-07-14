FROM mambaorg/micromamba:1.5.10

USER root

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    MAMBA_DOCKERFILE_ACTIVATE=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        bash \
        ca-certificates \
        tini \
    && rm -rf /var/lib/apt/lists/*

COPY --chown=$MAMBA_USER:$MAMBA_USER environment.yml /tmp/environment.yml

USER $MAMBA_USER

RUN micromamba install -y -n base -f /tmp/environment.yml \
    && micromamba clean -a -y

WORKDIR /app/wavetiles

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["bash", "scripts/build_ww3.sh"]
