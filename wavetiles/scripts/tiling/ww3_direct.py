#!/usr/bin/env python3
"""Generate frontend-compatible WW3 XYZ PNG tiles without GDAL or Rasterio."""

from __future__ import annotations

import argparse
import json
import math
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
import xarray as xr
from PIL import Image
from scipy.interpolate import RegularGridInterpolator
from scipy.ndimage import gaussian_filter

TILE_SIZE = 256
WEB