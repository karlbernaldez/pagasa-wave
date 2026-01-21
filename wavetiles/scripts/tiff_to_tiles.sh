#!/bin/bash
set -e

TIF=$1
OUTDIR=$2
MINZOOM=${3:-0}
MAXZOOM=${4:-8}

mkdir -p "$OUTDIR"

echo "→ Generating XYZ tiles..."
gdal2tiles.py --xyz -z $MINZOOM-$MAXZOOM -w none "$TIF" "$OUTDIR"

echo "✓ Tiles ready in $OUTDIR"
