# Pipeline degradation alerts

WaveLab evaluates persisted wave-pipeline telemetry and current runtime status for operational degradation. The same threshold definitions are used by System Analytics and the production health monitor.

## Default thresholds

- consecutive failed terminal runs per model: 2
- maximum age of latest completed pipeline run: 36 hours
- maximum duration of a model's latest completed run: 7200 seconds
- malformed telemetry records: 1

The health monitor runs every five minutes and applies its existing `FAILURE_THRESHOLD` debounce before sending Discord notifications. With the default `FAILURE_THRESHOLD=2`, a degradation condition must remain present for two consecutive monitor executions before an alert is sent.

## Configuration

Configure `/etc/wavelab/monitor.env`:

```text
PIPELINE_ALERTS_ENABLED=1
PIPELINE_CONSECUTIVE_FAILURE_THRESHOLD=2
PIPELINE_MAX_RUN_AGE_HOURS=36
PIPELINE_MAX_RUN_DURATION_SECONDS=7200
PIPELINE_MALFORMED_RECORD_THRESHOLD=1
```

Keep the existing Discord webhook and health-monitor settings in the same protected file. See `deploy/almalinux/monitor.env.example`.

## Alert conditions

### Consecutive failures

Triggers when the latest terminal attempts for a model are failures and the count reaches the configured threshold. An intervening successful run resets the sequence.

### Stale telemetry

Triggers when a completed pipeline run has previously been recorded but the latest terminal run is older than the configured maximum age.

A new deployment with no terminal history does not immediately trigger this condition.

### Slow latest run

Triggers when the most recent completed run for a model exceeds the configured duration threshold. Older slow runs do not keep the alert active after a newer healthy-duration run completes.

### Malformed telemetry

Triggers when invalid JSONL records meet the configured threshold. Valid records remain available to Analytics.

### Current failed state

Triggers when a model's current runtime status is `FAILED`.

## Operational behavior

The monitor reads the pipeline status/history files directly and does not require MongoDB. Backend/API health remains a separate monitor check.

Discord sends one alert after the health monitor debounce threshold is reached. When all monitor checks recover, the existing recovery notification is sent.

## Validation

After deployment:

```bash
sudo systemctl start wavelab-health-monitor.service
sudo journalctl -u wavelab-health-monitor.service -n 100 --no-pager
cd /home/wavelab/app/backend
sudo -u wavelab node scripts/checkPipelineAlerts.js
```

The standalone checker prints JSON containing active alert counts, thresholds, and alert details.

## Rollback

Set:

```text
PIPELINE_ALERTS_ENABLED=0
```

in `/etc/wavelab/monitor.env` and restart the timer/service if pipeline alert evaluation needs to be disabled while retaining the existing service, backend, and disk checks.
