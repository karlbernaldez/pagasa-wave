import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SystemPipelinePanel from './SystemPipelinePanel';

const payload = {
  available: true,
  packageDate: '2026-09-24',
  summary: {
    models: 2,
    readyModels: 1,
    packagesAvailable: 1,
    pipelineHealth: 'processing',
    currentForecastCycle: '2026092318',
  },
  models: [
    {
      code: 'CUSTOM_A',
      label: 'Custom A',
      state: 'READY',
      packageDate: '2026-09-24',
      packageTag: '2026SEP24',
      requiredSourceCycle: '2026092318',
      sourceCycle: '2026092318',
      frameCount: 21,
      expectedFrameCount: 21,
      published: true,
      lastCheckAt: '2026-09-24T01:00:00.000Z',
      completedAt: '2026-09-24T01:00:00.000Z',
    },
    {
      code: 'CUSTOM_B',
      label: 'Custom B',
      state: 'BUILDING',
      packageDate: '2026-09-24',
      requiredSourceCycle: '2026092318',
      sourceCycle: '2026092318',
      frameCount: 8,
      expectedFrameCount: 21,
      published: false,
      lastCheckAt: '2026-09-24T01:05:00.000Z',
      completedAt: null,
    },
  ],
  history: {
    available: true,
    collectingSince: '2026-09-22T01:00:00.000Z',
    latestRunAt: '2026-09-24T01:00:00.000Z',
    files: 2,
    totalBytes: 4096,
    invalidRecords: 0,
    summary: {
      runs: 3,
      successful: 2,
      failed: 1,
      retryAttempts: 1,
      successRate: 66.7,
      failureRate: 33.3,
      medianDurationSeconds: 900,
      p90DurationSeconds: 1200,
      durationSampleSize: 3,
    },
    trend: [
      { date: '2026-09-23', successful: 1, failed: 1, runs: 2 },
      { date: '2026-09-24', successful: 1, failed: 0, runs: 1 },
    ],
    models: [
      {
        model: 'CUSTOM_A',
        runs: 2,
        successful: 1,
        failed: 1,
        retryAttempts: 1,
        successRate: 50,
        medianDurationSeconds: 750,
        p90DurationSeconds: 870,
      },
      {
        model: 'CUSTOM_B',
        runs: 1,
        successful: 1,
        failed: 0,
        retryAttempts: 0,
        successRate: 100,
        medianDurationSeconds: 1200,
        p90DurationSeconds: 1200,
      },
    ],
    recentRuns: [
      {
        runId: 'run-3',
        model: 'CUSTOM_B',
        packageDate: '2026-09-24',
        sourceCycle: '2026092318',
        outcome: 'READY',
        durationSeconds: 1200,
        frameCount: 21,
        expectedFrameCount: 21,
        published: true,
        completedAt: '2026-09-24T01:00:00.000Z',
      },
    ],
  },
  alerts: {
    active: false,
    critical: 0,
    warning: 0,
    alerts: [],
  },
  range: {
    start: '2026-09-01',
    end: '2026-09-24',
    days: 24,
    timezone: 'Asia/Manila',
  },
};

describe('SystemPipelinePanel', () => {
  it('renders current readiness and persisted historical reliability together', () => {
    render(<SystemPipelinePanel payload={payload} isDarkMode={false} />);

    expect(screen.getByText('Model Readiness Matrix')).toBeInTheDocument();
    expect(screen.getByText('Telemetry Storage Health')).toBeInTheDocument();
    expect(
      screen.getByText(/No active pipeline degradation alerts are meeting/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Recorded runs')).toBeInTheDocument();
    expect(screen.getAllByText('Success rate').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Pipeline Run Outcomes')).toBeInTheDocument();
    expect(screen.getByText('Model Reliability')).toBeInTheDocument();
    expect(screen.getByText('Recent Pipeline Runs')).toBeInTheDocument();
    expect(screen.getByText('66.7%')).toBeInTheDocument();
    expect(screen.getAllByText('Custom A').length).toBeGreaterThan(0);
  });

  it('renders active pipeline degradation alerts from the backend evaluation', () => {
    render(
      <SystemPipelinePanel
        payload={{
          ...payload,
          alerts: {
            active: true,
            critical: 1,
            warning: 1,
            alerts: [
              {
                id: 'consecutive-failures:CUSTOM_A',
                severity: 'critical',
                type: 'consecutive_failures',
                model: 'CUSTOM_A',
                message: 'CUSTOM_A has 2 consecutive failed pipeline runs.',
                value: 2,
                threshold: 2,
              },
              {
                id: 'telemetry-malformed',
                severity: 'warning',
                type: 'telemetry_integrity',
                message: 'Pipeline telemetry contains 1 malformed record.',
                value: 1,
                threshold: 1,
              },
            ],
          },
        }}
        isDarkMode={false}
      />
    );

    expect(screen.getByText('Active Degradation Alerts')).toBeInTheDocument();
    expect(
      screen.getByText(/CUSTOM_A has 2 consecutive failed pipeline runs/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Pipeline telemetry contains 1 malformed record/i)).toBeInTheDocument();
  });

  it('surfaces malformed telemetry without hiding valid historical analytics', () => {
    render(
      <SystemPipelinePanel
        payload={{
          ...payload,
          history: {
            ...payload.history,
            invalidRecords: 2,
          },
        }}
        isDarkMode={false}
      />
    );

    expect(screen.getByText(/contains 2 malformed records/i)).toBeInTheDocument();
    expect(screen.getByText('Recorded runs')).toBeInTheDocument();
  });

  it('explains that history starts from real telemetry rather than fabricated backfill', () => {
    render(<SystemPipelinePanel payload={payload} isDarkMode />);

    expect(
      screen.getByText(/No historical build outcomes are backfilled or inferred/i)
    ).toBeInTheDocument();
  });

  it('keeps historical analytics visible when live readiness is unavailable', () => {
    render(
      <SystemPipelinePanel
        payload={{
          ...payload,
          available: false,
          sourceError: 'live source unavailable',
          summary: {
            models: 0,
            readyModels: 0,
            packagesAvailable: 0,
            pipelineHealth: 'unavailable',
            currentForecastCycle: null,
          },
          models: [],
        }}
        isDarkMode={false}
      />
    );

    expect(screen.getByText(/Live wave-pipeline status is unavailable/i)).toBeInTheDocument();
    expect(screen.getByText('Recorded runs')).toBeInTheDocument();
    expect(screen.getByText('Recent Pipeline Runs')).toBeInTheDocument();
  });
});
