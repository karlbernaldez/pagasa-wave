#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Wed Jun 19 11:55:33 2024

@author: tau
"""

import os
import sys
import subprocess
import numpy as np
import xarray as xr
import pandas as pd
from glob import glob
import cartopy.crs as ccrs
import cartopy.feature as cft
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
import cartopy.io.shapereader as shpreader
from matplotlib.ticker import FuncFormatter

from matplotlib.colorbar import ColorbarBase
from matplotlib.colors import ListedColormap, BoundaryNorm

from matplotlib.transforms import blended_transform_factory
from cartopy.mpl.ticker import LongitudeFormatter, LatitudeFormatter
from datetime import datetime as dt, timedelta as td, timezone as tz

from datetime import datetime
import matplotlib
import matplotlib.font_manager as fm


# -------------------------------
# FONT CONFIGURATION (NO WARNINGS)
# -------------------------------

# Ensure a valid font is always available
def font_exists(name):
    return any(f.name.lower() == name.lower() for f in fm.fontManager.ttflist)

# Preferred fonts
if font_exists("Arial"):
    DEFAULT_FONT = "Arial"
elif font_exists("Calibri"):
    DEFAULT_FONT = "Calibri"
else:
    DEFAULT_FONT = "DejaVu Sans"

matplotlib.rcParams['font.family'] = DEFAULT_FONT


init = str(sys.argv[1])
yyyys = int(init[:4])
mms = int(init[4:6])
dds = int(init[6:8])
hhs = int(init[8:10])

dt_start = dt(yyyys, mms, dds, hhs)
omain = dt_start.strftime('%Y_%m_%b')

param = pd.read_excel('mri3_params.xls')
ishp = './shp/Shipping_Zone.shp'
shape = list(shpreader.Reader(ishp).geometries())

contour_levels = {
    'robbshgt': [0, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8, 9, 10, 12, 14, 20],
    'robbsprd': [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20]
}

contour_colors = {
    'robbshgtcol': ['#caedfb', '#60caf3', '#0e9ed4', '#c1f1c9', '#82e28f',
                    '#01b051', '#ffff00', '#ffe701', '#fea401', '#fe0001',
                    '#aa1501', '#ab4500', '#6c3300', '#d86dcd', '#792070',
                    '#51154a', '#156183', '#0f2941', '#818180', '#000000'],
    'robbsprdcol': ['#c7eefd', '#61cbf3', '#119fd7', '#c1efc8', '#83e291', '#01ae50',
                    '#fffc02', '#ffce01', '#ff7502', '#d01315', '#740f15', '#782172', '#000000']
}

gls = {
    'Ph': [1.0, 5, 25, 115, 135, 'gray'],
    'WNP': [1.0, -5, 50, 100, 180, 'gray']
}


def compress_png_inplace(input_path, quality="65-80", speed=3):
    try:
        subprocess.run([
            "pngquant",
            "--quality", quality,
            "--speed", str(speed),
            "--output", input_path,
            "--force",
            input_path
        ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        print(f"Compression successful: {input_path}")
    except subprocess.CalledProcessError as e:
        print("Compression failed:", e.stderr.decode())


def wave_dir_wnd(wavep, waved, sfcwind, idxn):
    print(parsed_datf)
    wavep = ds[wavep][idxn].data
    waved = ds[waved][idxn].data
    uwnd = ds['u'][idxn].data * 1.94384
    vwnd = ds['v'][idxn].data * 1.94384

    arw_len = 0.4
    mwd_deg = waved
    mwd_rad = np.deg2rad(mwd_deg)
    u = wavep * -np.sin(mwd_rad)
    v = wavep * -np.cos(mwd_rad)
    mag = np.hypot(u, v)
    u_norm, v_norm = u / mag, v / mag
    u_scaled, v_scaled = u_norm * arw_len, v_norm * arw_len

    lef, rig = (0, 0)
    top, bot = (0.07, 0.01)
    plt_ht, plt_wd = (9.5, 12.8)
    fig_ht = plt_ht + (plt_ht * top) + (plt_ht * bot)
    fig_wd = plt_wd + (plt_wd * lef) + (plt_wd * rig)

    lons, lats = np.meshgrid(ds.lon, ds.lat)
    bound = [lats.min(), lats.max(), lons.min(), lons.max()]
    ext_bound = np.add(bound, [1, -1, 1, -1]).tolist()
    extent = ext_bound[2:] + ext_bound[:2]

    xf = np.arange(gls['Ph'][3], gls['Ph'][4] + 1, gls['Ph'][0])
    yf = np.arange(gls['Ph'][1], gls['Ph'][2] + 1, gls['Ph'][0])
    xf_mul = xf[xf % 5 == 0]
    yf_mul = yf[yf % 5 == 0]

    xlon = xf_mul
    ylat = yf_mul

    crs = ccrs.PlateCarree()
    fig, ax = plt.subplots(figsize=(fig_wd, fig_ht), dpi=100, subplot_kw=dict(projection=crs))
    ax.set_extent(extent, crs=crs)
    ax.spines['geo'].set(linewidth=0.8, zorder=5)
    ax.set_xticks(xlon, crs=crs)
    ax.set_yticks(ylat, crs=crs)
    ax.xaxis.set_major_formatter(LongitudeFormatter(transform_precision=0.1, degree_symbol='°'))
    ax.yaxis.set_major_formatter(LatitudeFormatter(transform_precision=0.1, degree_symbol='°'))
    ax.tick_params(axis='both', which='major', labelsize=10, length=2, width=1, pad=4)

    land = cft.NaturalEarthFeature(category='cultural', name='admin_0_countries', scale='10m')
    ax.add_feature(land, facecolor='#fde4ae', edgecolor='black', linewidth=0.7, zorder=4)
    ax.add_geometries(shape, crs=crs, edgecolor='black', linewidth=1, facecolor='None', alpha=1, zorder=3)

    levs = contour_levels[row['cbar_lev']]
    cols = contour_colors[row['cbar_col']]

    ax.contourf(lons, lats, wavep, levels=levs, colors=cols, vmin=0, vmax=20, alpha=1.0, zorder=1)

    if isinstance(waved, float):
        skip = 6
        cb_ax1 = plt.axes([0.29, 0.08, 0.45, 0.035])
    else:
        skip = 6
        idx = (slice(0, None, skip), slice(0, None, skip))
        arrow = dict(width=0.05, headwidth=4, headlength=5, headaxislength=5, capstyle='round', hatch='.')
        kw_quiv = dict(scale=0.8, angles='xy', units='xy', pivot='tail', alpha=1)
        ax.quiver(lons[idx], lats[idx], u_scaled[idx], v_scaled[idx], color='black', **kw_quiv, **arrow, zorder=2)
        cb_ax1 = plt.axes([0.222, 0.085, 0.56, 0.03])

    kw_sizes = dict(spacing=0.1, height=0.5, width=0.25, emptybarb=0.05)
    kw_barb = dict(length=5, linewidth=0.7, color='royalblue', sizes=kw_sizes, zorder=2)
    ax.barbs(lons[idx], lats[idx], uwnd[idx], vwnd[idx], **kw_barb)

    ax.gridlines(draw_labels=False, linestyle=':', linewidth=0.5, color='blue')

    cb_ticks = np.linspace(0, 1, len(levs))
    cb_labels = list(map(lambda x: str(x), levs))
    cmap = ListedColormap(cols, name='custom_cmap', N=len(cols))
    cb = ColorbarBase(cb_ax1, cmap=cmap, ticks=cb_ticks, orientation='horizontal')

    # Use default font (no warnings)
    cb.set_ticklabels(cb_labels, family=DEFAULT_FONT, fontsize=12)
    cb.ax.tick_params(length=0, width=0, direction='out', color='black', labelcolor='black', pad=5)
    cb.outline.set_linewidth(0.7)

    if isinstance(waved, float):
        cb_ax1.text(0.5, -1.7, '(seconds)', transform=cb_ax1.transAxes, family=DEFAULT_FONT, fontsize=13, fontweight='regular', ha='center')
        for line in cb_ticks:
            cb_ax1.axvline(line, color='black', linewidth=0.7)
    else:
        cb_ax1.text(0.5, -2.3, '(meters)', transform=cb_ax1.transAxes, family=DEFAULT_FONT, fontsize=13, fontweight='regular', ha='center')
        sea_ticks = np.array([0, 0.45, 1.28, 2, 2.83, 3.5, 4.8, 6, 7.5, 9, 11, 13, 14.52, 16, 17.5, 19, 20]) / 20
        sea_labels = ['Calm⠀⠀', '│', '―― Smooth ――', '│', '―― Slight ――', '│', '――― Moderate ―――', '│', '―――― Rough ――――',
                      '│', '――――― Very Rough ―――――', '│', '――――― High ―――――', '│', '―――― Very High ―――――', '│', '⠀⠀Phenomenal']
        for line in cb_ticks:
            cb_ax1.axvline(line, color='black', linewidth=0.7)

        cb_ax2 = cb_ax1.twiny()
        cb_ax2.set_xticks(sea_ticks)
        cb_ax2.set_xticklabels(sea_labels, fontfamily=DEFAULT_FONT)
        cb_ax2.xaxis.set_ticks_position('bottom')
        cb_ax2.xaxis.set_tick_params(pad=22, length=0, labelsize=8)

    plt.subplots_adjust(left=0.05, right=0.95, top=0.90, bottom=0.145)

    title_line = f"MRI3 {row['longname']} and 10-m Winds (barb,knots)"
    plt.figtext(0.025, 0.94, title_line, va='center', ha='left', size=18, family=DEFAULT_FONT, weight='semibold')

    init_line = f'Initialization: {fdt}'
    plt.figtext(0.025, 0.915, init_line, va='center', ha='left', size=17, family=DEFAULT_FONT, weight='regular')

    fcst_line = f'Forecast: {parsed_datf} [T+{idxn:02d}]'
    plt.figtext(0.85, 0.915, fcst_line, va='center', ha='right', size=17, family=DEFAULT_FONT, weight='regular')

    ISO_code = 'TAU-06 Rev.0/15-08-2023'
    plt.figtext(0.8, 0.96, ISO_code, va='center', ha='right', size=13, family=DEFAULT_FONT, weight='regular')

    odir = f"./wave3data/OUT_IMG/{init}/Philippines/{row['foldername']}"
    os.makedirs(odir, exist_ok=True)
    ofname = f"{row['filename']}"
    ofpath = f'{odir}/MRI3_PHL_{ofname}_{idxn:03d}h.png'
    fig.savefig(ofpath, dpi=100, bbox_inches='tight')
    fig.clf()
    plt.close()
    compress_png_inplace(ofpath)


def wave_dir(wavep, waved, idxn):
    print(parsed_datf)
    wavep = ds[wavep][idxn].data
    waved = ds[waved][idxn].data

    arw_len = 0.4
    mwd_deg = waved
    mwd_rad = np.deg2rad(mwd_deg)
    u = wavep * -np.sin(mwd_rad)
    v = wavep * -np.cos(mwd_rad)
    mag = np.hypot(u, v)
    u_norm, v_norm = u / mag, v / mag
    u_scaled, v_scaled = u_norm * arw_len, v_norm * arw_len

    lef, rig = (0, 0)
    top, bot = (0.07, 0.01)
    plt_ht, plt_wd = (9.5, 12.8)
    fig_ht = plt_ht + (plt_ht * top) + (plt_ht * bot)
    fig_wd = plt_wd + (plt_wd * lef) + (plt_wd * rig)

    lons, lats = np.meshgrid(ds.lon, ds.lat)
    bound = [lats.min(), lats.max(), lons.min(), lons.max()]
    ext_bound = np.add(bound, [1, -1, 1, -1]).tolist()
    extent = ext_bound[2:] + ext_bound[:2]

    xf = np.arange(gls['Ph'][3], gls['Ph'][4] + 1, gls['Ph'][0])
    yf = np.arange(gls['Ph'][1], gls['Ph'][2] + 1, gls['Ph'][0])
    xf_mul = xf[xf % 5 == 0]
    yf_mul = yf[yf % 5 == 0]

    xlon = xf_mul
    ylat = yf_mul

    crs = ccrs.PlateCarree()
    fig, ax = plt.subplots(figsize=(fig_wd, fig_ht), dpi=100, subplot_kw=dict(projection=crs))
    ax.set_extent(extent, crs=crs)
    ax.spines['geo'].set(linewidth=0.8, zorder=5)
    ax.set_xticks(xlon, crs=crs)
    ax.set_yticks(ylat, crs=crs)
    ax.xaxis.set_major_formatter(LongitudeFormatter(transform_precision=0.1, degree_symbol='°'))
    ax.yaxis.set_major_formatter(LatitudeFormatter(transform_precision=0.1, degree_symbol='°'))
    ax.tick_params(axis='both', which='major', labelsize=10, length=2, width=1, pad=4)

    land = cft.NaturalEarthFeature(category='cultural', name='admin_0_countries', scale='10m')
    ax.add_feature(land, facecolor='#fde4ae', edgecolor='black', linewidth=0.7, zorder=4)
    ax.add_geometries(shape, crs=crs, edgecolor='black', linewidth=1, facecolor='None', alpha=1, zorder=3)

    levs = contour_levels[row['cbar_lev']]
    cols = contour_colors[row['cbar_col']]

    ax.contourf(lons, lats, wavep, levels=levs, colors=cols, vmin=0, vmax=20, alpha=1.0, zorder=1)

    skip = 6
    idx = (slice(0, None, skip), slice(0, None, skip))
    arrow = dict(width=0.05, headwidth=4, headlength=5, headaxislength=5, capstyle='round', hatch='.')
    kw_quiv = dict(scale=0.8, angles='xy', units='xy', pivot='tail', alpha=1)
    ax.quiver(lons[idx], lats[idx], u_scaled[idx], v_scaled[idx], color='black', **kw_quiv, **arrow, zorder=2)
    cb_ax1 = plt.axes([0.33, 0.085, 0.35, 0.03])

    kw_sizes = dict(spacing=0.1, height=0.5, width=0.25, emptybarb=0.05)
    kw_barb = dict(length=5, linewidth=0.7, color='royalblue', sizes=kw_sizes, zorder=2)
    ax.barbs(
        lons[idx],
        lats[idx],
        ds['u'][idxn].data[idx] * 1.94384,
        ds['v'][idxn].data[idx] * 1.94384,
        **kw_barb
    )

    ax.gridlines(draw_labels=False, linestyle=':', linewidth=0.5, color='blue')

    cb_ticks = np.linspace(0, 1, len(levs))
    cb_labels = list(map(lambda x: str(x), levs))
    cmap = ListedColormap(cols, name='custom_cmap', N=len(cols))
    cb = ColorbarBase(cb_ax1, cmap=cmap, ticks=cb_ticks, orientation='horizontal')
    cb.set_ticklabels(cb_labels, family=DEFAULT_FONT, fontsize=12)
    cb.ax.tick_params(length=0, width=0, direction='out', color='black', labelcolor='black', pad=5)
    cb.outline.set_linewidth(0.7)

    cb_ax1.text(0.5, -1.45, '(seconds)', transform=cb_ax1.transAxes, family=DEFAULT_FONT, fontsize=13, fontweight='regular', ha='center')
    for line in cb_ticks:
        cb_ax1.axvline(line, color='black', linewidth=0.7)

    plt.subplots_adjust(left=0.05, right=0.95, top=0.90, bottom=0.145)

    title_line = f"MRI3 {row['longname']}"
    plt.figtext(0.025, 0.94, title_line, va='center', ha='left', size=18, family=DEFAULT_FONT, weight='semibold')

    init_line = f'Initialization: {fdt}'
    plt.figtext(0.025, 0.915, init_line, va='center', ha='left', size=17, family=DEFAULT_FONT, weight='regular')

    fcst_line = f'Forecast: {parsed_datf} [T+{idxn:02d}]'
    plt.figtext(0.85, 0.915, fcst_line, va='center', ha='right', size=17, family=DEFAULT_FONT, weight='regular')

    ISO_code = 'TAU-06 Rev.0/15-08-2023'
    plt.figtext(0.8, 0.96, ISO_code, va='center', ha='right', size=13, family=DEFAULT_FONT, weight='regular')

    odir = f"./wave3data/OUT_IMG/{init}/Philippines/{row['foldername']}"
    os.makedirs(odir, exist_ok=True)
    ofname = f"{row['filename']}"
    ofpath = f'{odir}/MRI3_PHL_{ofname}_{idxn:03d}h.png'
    fig.savefig(ofpath, dpi=100, bbox_inches='tight')
    fig.clf()
    plt.close()
    compress_png_inplace(ofpath)


# -------------------------------------------------
# Main processing
# -------------------------------------------------

inputdir = f'../input/mri3_2026011200'
inputfile = f"{init}_PH.nc"
inp = f'{inputdir}/{inputfile}'

ds = xr.open_dataset(inp, engine='netcdf4')

bt = ds.time[0].data
strbt = str(bt)[:13]
parsed_bt = datetime.strptime(strbt, "%Y-%m-%dT%H")
fdt = parsed_bt.strftime("%H00Z %a %b-%d, %Y")

print(f"Basetime: {fdt}")

dataskip = 3

for idxn, t in enumerate(ds.time[::dataskip]):
    idxn = idxn * dataskip
    st = str(t.data)[:13]
    parsed_date = datetime.strptime(st, "%Y-%m-%dT%H")
    parsed_datf = parsed_date.strftime("%H00Z %a %b-%d, %Y")
    print("\n\n", f"{idxn:02d} Basetime: {fdt}", "-", parsed_date)

    for index, row in param.iterrows():
        wavep = row['shortname']
        waved = row['direction']
        sfcwind = row['with_10mwind']

        if sfcwind == 'yes':
            print(f'{wavep} | {waved} | {sfcwind}')
            wave_dir_wnd(wavep, waved, sfcwind, idxn)
        else:
            print(f'{wavep} | {waved} | {sfcwind}')
            wave_dir(wavep, waved, idxn)
