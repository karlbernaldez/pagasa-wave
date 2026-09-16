import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import DeploymentOperationsStatus from './DeploymentOperationsStatus';

describe('DeploymentOperationsStatus', () => {
  it('renders a read-only unavailable state before the first server report exists', () => {
    render(<DeploymentOperationsStatus deployment={{ available: false }} isDarkMode={false} />);

    expect(screen.getByText('Deployment validation report not available')).toBeInTheDocument();
    expect(
      screen.getByText(/No deployment commands are executed from this page/i)
    ).toBeInTheDocument();
  });

  it('renders sanitized deployment, service, timer, and warning information', () => {
    render(
      <DeploymentOperationsStatus
        isDarkMode={false}
        deployment={{
          available: true,
          result: 'WARN',
          host: 'vote3',
          branch: 'main',
          shortRevision: '7ec9c4786937',
          backendEnvironment: 'production',
          generatedAt: '2026-09-16T08:30:00.000Z',
          reportId: '2026-09-16_163000_7ec9c4786937',
          backend: { startedAt: '2026-09-16 16:02:24 PST', recentErrorCount: 1 },
          services: { wavelab_backend: 'active', nginx: 'active' },
          timers: { ww3_package_builder: 'active', ecwam_package_builder: 'active' },
          checks: [
            {
              key: 'backend_errors',
              label: 'Backend errors since current start',
              status: 'WARN',
              detail: '1',
            },
          ],
        }}
      />
    );

    expect(screen.getByText('Application & deployment health')).toBeInTheDocument();
    expect(screen.getByText('Validated with warnings')).toBeInTheDocument();
    expect(screen.getByText(/vote3.*main.*7ec9c4786937/i)).toBeInTheDocument();
    expect(screen.getByText('production')).toBeInTheDocument();
    expect(screen.getByText('Application services')).toBeInTheDocument();
    expect(screen.getByText('Scheduled automation')).toBeInTheDocument();
    expect(screen.getByText('Backend errors since current start')).toBeInTheDocument();
    expect(screen.getByText(/read-only monitoring/i)).toBeInTheDocument();
  });
});
