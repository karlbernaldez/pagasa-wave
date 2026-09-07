# WaveLab Wave Data Pipeline

## Goal

Standardize model-specific inputs behind adapters so WaveLab product generation consumes one canonical normalized dataset contract regardless of whether a source model arrives as NetCDF, GRIB, or another supported format.

## Pipeline

```text
model source
  -> ingestion / staging
  -> model adapter
  -> reduction
  -> normalization
  -> retained-cycle assembly
  -> normalized/<MODEL>/<REFERENCE_TIME>/wave.nc + manifest.json
  -> generic package builder
  -> validation
  -> atomic publication
  -> lifecycle / retention
```

## Architectural boundary

The adapter layer owns source-specific behavior. The generic package builder must not parse WW3 archives, ECWAM GRIB files, or future model-native formats directly.

Adapters are responsible for:

- source discovery and native source-cycle selection
- native format parsing
- variable mapping
- unit conversion
- coordinate normalization
- wave-direction convention normalization
- forecast-range and cadence reduction
- retained-cycle assembly into the WaveLab normalized contract

The downstream package builder is responsible for:

- normalized contract validation
- raster generation
- vectors/arrows when supported
- contour generation
- package metadata
- product integrity checks
- atomic publication

## Time semantics

The normalized contract records both `sourceCycle` and `referenceTime` because future models may need different semantics. For the current WW3 operational profile, however, they are intentionally the same.

WW3 requires the previous-day 18Z model cycle for each WaveLab package date:

```text
package date   = 2026-09-07
sourceCycle    = 2026090618
referenceTime  = 2026-09-06T18:00:00Z
forecastHours  = 0, 3, ..., 60
```

The WW3 adapter and package selector enforce this invariant. A complete 12Z cycle is not used as a fallback if the required 18Z cycle is incomplete; the automation waits for a later retry instead.

For every normalized WW3 frame:

```text
validTime = referenceTime + forecastHour
```

Therefore WW3 T+0 is the native 18Z model T+0, T+3 is the native 18Z model T+3, and so on through T+60.

## Normalized contract v1

Storage implementation: NetCDF.

Granularity: one normalized dataset per model per WaveLab reference time. Source provenance remains recorded in the manifest and dataset attributes.

```text
normalized/
  WW3/
    2026090618/
      wave.nc
      manifest.json
  ECWAM/
    2026090618/
      wave.nc
      manifest.json
```

NetCDF is the v1 storage implementation, not the permanent architectural interface. A future chunked implementation such as Zarr may implement the same logical contract without changing model adapters or product semantics.

### Forecast axis

The initial operational profile retains T+0 through T+60 at three-hour cadence:

```text
0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60
```

This is 21 frames.

The dataset exposes:

- `valid_time`
- `forecast_hour`
- `latitude`
- `longitude`

Contract v1 requires latitude and longitude to be one-dimensional, unique, and strictly ascending. Curvilinear grids require a future contract revision or an adapter-side remapping step.

Required dataset attributes include:

- `contract_version`
- `model`
- `source_cycle`
- `reference_time`

### Canonical variables

Initial canonical variables:

- `significant_wave_height`
  - units: `m`
  - dimensions: `valid_time, latitude, longitude`
- `mean_wave_direction`
  - units: `degree`
  - direction convention: `from_north_clockwise`
  - dimensions: `valid_time, latitude, longitude`

Adapters must explicitly convert native naming, units, coordinates, and direction conventions into the canonical representation.

## Manifest

`manifest.json` records provenance and normalized contract metadata. Validation cross-checks the manifest against `wave.nc`, including model, source cycle, reference time, forecast-hour axis, and canonical variables.

Example:

```json
{
  "contractVersion": "wavelab-wave-v1",
  "model": "WW3",
  "sourceCycle": "2026090618",
  "referenceTime": "2026-09-06T18:00:00Z",
  "sourceFormat": "netcdf",
  "adapter": {
    "id": "ww3-netcdf",
    "version": "1"
  },
  "forecastHours": [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60],
  "frameCount": 21,
  "variables": ["significant_wave_height"],
  "sourceFiles": [],
  "normalizedAt": "2026-09-07T00:00:00Z"
}
```

## Real WW3 validation

The `2026090618` operational WW3 cycle was normalized on AlmaLinux using the real staged NetCDF inputs. All 21 retained frames from T+0 through T+60 were compared directly against the canonical `significant_wave_height` frames.

Observed parity:

```text
Worst max absolute difference : 0.0000000000
Worst mean absolute difference: 0.0000000000
```

This proves the WW3 adapter preserves the source wave-height values exactly for the validated operational cycle. Product parity is still required before the normalized path may replace the production raw-file product path.

## Migration plan

### Phase 1 - Contract foundation

- versioned normalized contract
- manifest builder/validator
- dataset validator
- adapter base interface
- contract tests

No production builder behavior changes in this phase.

### Phase 2 - WW3 shadow adapter

- consume the current extracted WW3 NetCDF source cycle
- require the previous-day 18Z WW3 cycle
- require `sourceCycle == referenceTime` for WW3
- retain exactly T+0 through T+60 at three-hour cadence
- do not fall back to 12Z when the required 18Z cycle is incomplete
- map `hs` to `significant_wave_height`
- convert supported source units to metres
- canonicalize latitude/longitude ordering
- assemble one retained-window `wave.nc`
- produce `manifest.json`
- validate the written artifacts before atomically exposing the normalized directory
- compare normalized data against native WW3 frames before switching input paths

The normalization command is:

```bash
python wavetiles/scripts/normalize_ww3_cycle.py \
  wavetiles/input/ww3 \
  2026090618
```

It writes only below `wavetiles/normalized/WW3/` and does not modify existing tiles, contours, package markers, or Studio URLs.

### Phase 3 - Generic normalized reader and WW3 product shadow

`NormalizedCycleReader` validates and reads the canonical contract without knowing the source format or native source hierarchy.

The WW3 compatibility bridge consumes that reader and sends canonical frames through the same production WW3 tile and contour algorithms, but writes into an isolated shadow tree:

```bash
python wavetiles/scripts/build_normalized_ww3_shadow.py \
  wavetiles/normalized/WW3/2026090618 \
  2026-09-07
```

Default output:

```text
wavetiles/shadow-products/WW3/
```

The shadow builder refuses to write inside `wavetiles/tiles/WW3`. Production remains on the raw WW3 path until raster and contour parity is proven.

### Phase 4 - ECWAM adapter

Decode the current GRIB1 + index inputs through the ECWAM adapter and produce the same normalized contract. Product generation remains unchanged because it consumes canonical data.

### Phase 5 - Common runner and lifecycle

Move duplicated builder lifecycle behavior into a shared runner:

- locking
- staging cleanup
- timeout/signal handling
- retry classification
- normalized status output
- atomic package promotion
- retention hooks

## Retention rule

Raw inputs are not deleted merely because normalization succeeded. Cleanup is allowed only after normalization validation and successful package publication, subject to the configured retention policy.

Do not combine multiple historical retained windows into a single NetCDF file. Corruption, retry, replacement, and retention boundaries remain per model/reference time.
