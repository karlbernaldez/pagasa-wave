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
  -> cycle assembly
  -> normalized/<MODEL>/<CYCLE>/wave.nc + manifest.json
  -> generic package builder
  -> validation
  -> atomic publication
  -> lifecycle / retention
```

## Architectural boundary

The adapter layer owns source-specific behavior. The generic package builder must not parse WW3 archives, ECWAM GRIB files, or future model-native formats directly.

Adapters are responsible for:

- source discovery and cycle selection
- native format parsing
- variable mapping
- unit conversion
- coordinate normalization
- wave-direction convention normalization
- forecast-range and cadence reduction
- cycle assembly into the WaveLab normalized contract

The downstream package builder is responsible for:

- normalized contract validation
- raster generation
- vectors/arrows when supported
- contour generation
- package metadata
- product integrity checks
- atomic publication

## Normalized contract v1

Storage implementation: NetCDF.

Granularity: one normalized dataset per model per source cycle.

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

### Canonical variables

Initial canonical variables:

- `significant_wave_height`
  - units: `m`
  - dimensions: `valid_time, latitude, longitude`
- `mean_wave_direction`
  - units: `degree`
  - direction convention: `from_north_clockwise`
  - dimensions: `valid_time, latitude, longitude`

Adapters must explicitly convert native naming, units, and direction conventions into the canonical representation.

## Manifest

`manifest.json` records provenance and normalized contract metadata.

Example:

```json
{
  "contractVersion": "wavelab-wave-v1",
  "model": "WW3",
  "sourceCycle": "2026090618",
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

## Migration plan

### Phase 1 - Contract foundation

- versioned normalized contract
- manifest builder/validator
- dataset validator
- adapter base interface
- contract tests

No production builder behavior changes in this phase.

### Phase 2 - WW3 adapter

- consume the current extracted WW3 NetCDF cycle
- retain only T+0 through T+60 at three-hour cadence
- map `hs` to `significant_wave_height`
- assemble one cycle-level `wave.nc`
- produce `manifest.json`
- validate against the contract
- compare normalized data against current WW3 published products before switching input paths

### Phase 3 - Generic WW3 product path

Teach the package builder to read the normalized contract rather than the raw WW3 file hierarchy, behind a compatibility switch until output parity is proven.

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

Do not combine multiple historical source cycles into a single NetCDF file. Corruption, retry, replacement, and retention boundaries remain per model/cycle.
