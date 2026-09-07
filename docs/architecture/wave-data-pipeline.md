# WaveLab Wave Data Pipeline

## Goal

Standardize model-specific inputs behind adapters so WaveLab product generation consumes one canonical normalized dataset contract regardless of whether a source model arrives as NetCDF, GRIB, or another supported format.

## Pipeline

```text
model source
  -> source-specific ingestion / retry scheduling
  -> model adapter
  -> reduction / normalization
  -> retained-cycle assembly
  -> normalized/<MODEL>/<REFERENCE_TIME>/wave.nc + manifest.json
  -> common normalized package runner
  -> model product renderer
  -> staged validation
  -> publication with rollback protection
  -> structured operational status
  -> Studio + Admin Dashboard
  -> lifecycle / retention
```

## Architectural boundary

The adapter layer owns source-specific behavior. The common package path must not parse WW3 archives, ECWAM GRIB files, or future model-native formats directly.

Adapters own source discovery, native parsing, variable mapping, unit conversion, coordinate normalization, direction conventions, forecast reduction, and retained-cycle assembly. Downstream product generation owns normalized-contract validation, raster generation, contours/vectors, package metadata, integrity checks, staging, and publication.

Source scheduling remains independent per model because source availability and retry cadence are ingestion concerns. Normalization does not require WW3 and ECWAM to share one timer.

Studio remains downstream of the stable tile/contour product contract. It does not read normalized NetCDF directly. This keeps the normalized storage implementation replaceable without coupling the interactive forecast workspace to source-format or pipeline internals.

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

## Common normalized package runner

`run_normalized_wave_package.py` owns the shared normalized product lifecycle for the currently supported WW3 and ECWAM models:

```text
validated normalized cycle
  -> isolated unique stage directory
  -> model renderer
  -> staged package validation
  -> production publication
  -> stage cleanup on success or failure
```

The model-specific compatibility scripts still own source selection and normalization because those operations depend on native input formats. Once a normalized cycle exists, both paths enter the same runner.

The runner verifies that the normalized cycle model and `sourceCycle` match the requested build before invoking a renderer. The publisher validates package metadata, all 21 contour frames, and non-empty PNG output before replacing production directories.

Publication is atomic per package category, not as one filesystem transaction across all categories. Each complete staged category is copied beside its production destination and promoted with a local atomic rename. If a later category fails, already-promoted categories are rolled back to their backups. This design supports staging and production roots on different filesystems while preserving the previous complete package on failures covered by the rollback path.

## Pipeline observability

The normalized runner writes a small atomic JSON status snapshot per model under the shared writable staging tree:

```text
wavetiles/.normalized-product-stage/.status/
  WW3.json
  ECWAM.json
```

The status schema exposes operational states such as `BUILDING`, `VALIDATING`, `PUBLISHING`, `READY`, and `FAILED`, together with package date, required/source cycle, input mode, retained-frame counts, timestamps, and any failure message.

The backend exposes this information through an admin-only API:

```text
GET /api/admin/wave-pipeline
```

The Admin Dashboard consumes the API through a dedicated Wave Pipeline page. The backend does not scrape `journalctl` or expose arbitrary systemd logs. For `READY`, it cross-checks the current Manila package against the published `package.json` before reporting the package as ready for Studio. If the current package is not published yet, the dashboard reports `WAITING_FOR_SOURCE` unless a current transient/failure state is available from the runner snapshot.

This observability boundary deliberately separates product consumption from pipeline operations:

```text
Studio         -> published tiles / contours
Admin pipeline -> structured status API
```

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

The production systemd service then completed a supervised normalized build successfully with 114,708 PNG tiles and 21 contour frames. Its production marker records `source_cycle=2026090618` and `product_input=normalized`.

### ECWAM

The real `2026090618` ECWAM GRIB1 cycle was normalized successfully into the same contract. A normalized shadow package for `2026-09-07` matched the current raw production products:

```text
light tree     : 36,498 files, exact SHA-256 parity
dark tree      : 36,498 files, exact SHA-256 parity
contours       : 21 GeoJSON files, exact SHA-256 parity
package.json   : semantically identical
missing files  : 0
```

The production systemd service then completed a supervised normalized build successfully with 72,954 PNG tiles and 21 contour frames. The live ECWAM package is marked `normalized`.

These results prove parity for the validated real operational cycle and settings; they are not a claim that every historical or future cycle has been exhaustively compared.

## Compatibility and production rollout

Both model package paths support an explicit input mode:

```text
WW3_PRODUCT_INPUT=raw|normalized
ECWAM_PRODUCT_INPUT=raw|normalized
```

There is no silent normalized-to-raw fallback. A configured normalized run must fail clearly if normalization or normalized product generation fails.

The AlmaLinux wrappers call the compatibility builders. Production on `vote3` was deliberately cut over to `normalized` for both models after supervised validation. Existing WW3 build markers without a `product_input` field remain treated as `raw` for backward compatibility. ECWAM records the published mode alongside the package so changing input mode forces a supervised rebuild instead of being mistaken for an already-complete package.

The systemd services retain `ProtectSystem=strict`; only the required model input/output, normalized model directory, shared normalized staging directory, and service state/runtime paths are writable.

## Migration phases

### Completed

- normalized contract and validators
- adapter base interface
- WW3 NetCDF adapter and real-cycle data parity
- ECWAM GRIB1 adapter and real-cycle normalization
- normalized reader
- normalized WW3 and ECWAM product renderers
- product parity validation for both operational models
- raw/normalized compatibility builders
- staged publication with cross-filesystem support and rollback protection
- package metadata validation before publication
- common normalized package runner for build/stage/validate/publish/cleanup
- structured runner status snapshots and admin-only status API
- Admin Dashboard Wave Pipeline status page
- AlmaLinux automation integration
- supervised production cutover of both WW3 and ECWAM to normalized input

### Remaining hardening

- observe and record unattended timer-driven normalized cycles
- add direct native-GRIB-to-normalized numerical parity verification for ECWAM
- add retention/status history only if operations require trend or audit views beyond the current latest-snapshot model
- complete final merge-readiness review after unattended operation and CI are green

Do not merge source-specific retry cadence into one global timer solely for architectural symmetry. A common contract and lifecycle runner do not require common source scheduling.

## Retention rule

Raw inputs are not deleted merely because normalization succeeded. Cleanup is allowed only after normalization validation and successful package publication, subject to the configured retention policy.

Do not combine multiple historical retained windows into a single NetCDF file. Corruption, retry, replacement, and retention boundaries remain per model/reference time.
