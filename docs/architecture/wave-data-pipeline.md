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
  -> staged package
  -> atomic publication
  -> lifecycle / retention
```

## Architectural boundary

The adapter layer owns source-specific behavior. The generic package path must not parse WW3 archives, ECWAM GRIB files, or future model-native formats directly.

Adapters own source discovery, native parsing, variable mapping, unit conversion, coordinate normalization, direction conventions, forecast reduction, and retained-cycle assembly. Downstream product generation owns normalized-contract validation, raster generation, contours/vectors, package metadata, integrity checks, staging, and publication.

## Time semantics

For the current WW3 and ECWAM operational profiles, each WaveLab package date uses the required previous-day 18Z source cycle with no fallback to another cycle.

Example:

```text
package date   = 2026-09-07
sourceCycle    = 2026090618
referenceTime  = 2026-09-06T18:00:00Z
forecastHours  = 0, 3, ..., 60
```

For every retained frame:

```text
validTime = referenceTime + forecastHour
```

If the required 18Z source is incomplete, automation waits for a later timer retry instead of silently selecting a fallback cycle.

## Normalized contract v1

Storage implementation: NetCDF. Granularity: one normalized dataset per model/reference time.

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

The initial operational profile retains 21 frames from T+0 through T+60 every three hours. Contract v1 exposes `valid_time`, `forecast_hour`, `latitude`, and `longitude`, with one-dimensional unique strictly ascending latitude/longitude coordinates.

The canonical wave-height variable is `significant_wave_height` in metres with dimensions `valid_time, latitude, longitude`. Source-specific names such as WW3 `hs` and ECWAM `swh` are mapped by adapters. Smoothing remains downstream in product generation rather than being stored in the canonical dataset.

## Manifest

`manifest.json` records provenance and normalized contract metadata. Validation cross-checks it against `wave.nc`, including model, source cycle, reference time, forecast-hour axis, and canonical variables.

## Real operational validation

### WW3

The real `2026090618` WW3 cycle was normalized and all 21 retained frames were compared with the native NetCDF inputs after coordinate canonicalization.

```text
Worst max absolute difference : 0.0000000000
Worst mean absolute difference: 0.0000000000
```

A normalized shadow package for WaveLab package date `2026-09-07` then matched the raw production products:

```text
light tree     : 57,375 files, exact SHA-256 parity
dark tree      : 57,375 files, exact SHA-256 parity
contours       : 21 GeoJSON files, exact SHA-256 parity
package.json   : semantically identical
missing files  : 0
```

The normalized compatibility path also completed staged validation and publication successfully with 114,708 PNG tiles and 21 contour frames.

### ECWAM

The real `2026090618` ECWAM GRIB1 cycle was normalized successfully into the same contract. A normalized shadow package for `2026-09-07` matched the current raw production products:

```text
light tree     : 36,498 files, exact SHA-256 parity
dark tree      : 36,498 files, exact SHA-256 parity
contours       : 21 GeoJSON files, exact SHA-256 parity
package.json   : semantically identical
missing files  : 0
```

The ECWAM normalized compatibility path also completed staged validation and publication successfully with 72,954 PNG tiles and 21 contour frames.

These results prove parity for the validated real operational cycle and settings; they are not a claim that every historical or future cycle has been exhaustively compared.

## Compatibility rollout

Both model package paths support an explicit input mode:

```text
WW3_PRODUCT_INPUT=raw|normalized
ECWAM_PRODUCT_INPUT=raw|normalized
```

`raw` remains the default during rollout. There is no silent normalized-to-raw fallback. A configured normalized run must fail clearly if normalization or normalized product generation fails.

The AlmaLinux automation wrappers call the compatibility builders, but deployment environment examples keep both models on `raw`. Existing WW3 build markers without a `product_input` field are treated as `raw` for backward compatibility. ECWAM records the published mode alongside the package so changing input mode forces a supervised rebuild instead of being mistaken for an already-complete package.

Normalized product mode builds into an isolated staging tree first. The staged package is validated for PNG output, all 21 contour frames, and package metadata. Publication first copies each complete package directory onto the destination filesystem and then performs a local atomic rename with rollback protection. This also supports destinations mounted on a different filesystem from the staging tree.

## Migration phases

### Completed

- normalized contract and validators
- adapter base interface
- WW3 NetCDF adapter and real-cycle data parity
- ECWAM GRIB1 adapter and real-cycle normalization
- normalized reader
- normalized WW3 and ECWAM product shadow builders
- product parity validation for both operational models
- raw/normalized compatibility builders
- validated staged publication with cross-filesystem support
- AlmaLinux automation wrapper integration with raw default

### Next

Perform one supervised production run per model with `*_PRODUCT_INPUT=normalized`, verify package metadata/counts and Studio rendering, then decide whether normalized mode should become the operational default.

After rollout, consolidate remaining duplicated lifecycle behavior into a common runner where it materially improves locking, timeout/signal handling, retry classification, retention, and observability.

## Retention rule

Raw inputs are not deleted merely because normalization succeeded. Cleanup is allowed only after normalization validation and successful package publication, subject to the configured retention policy.

Do not combine multiple historical retained windows into a single NetCDF file. Corruption, retry, replacement, and retention boundaries remain per model/reference time.
