FROM ghcr.io/osgeo/gdal:ubuntu-small-3.10.2

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        python3 \
        python3-pip \
        python3-venv \
        python3-gdal \
        gdal-bin \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m pip install --break-system-packages --no-cache-dir \
    numpy \
    scipy \
    xarray \
    netCDF4 \
    rasterio

WORKDIR /app/wavetiles

CMD ["bash", "scripts/build_ww3.sh"]
