import { BarChartCard, DistributionCard, TrendCard } from '../AnalyticsVisuals';
import AnalyticsMetricStrip from '../components/AnalyticsMetricStrip';
import {
  contributionMixRows,
  entriesByCount,
} from '../analyticsWorkspaceModel';
import { bucketLabel, buildTrend } from '../analyticsPresentation';

export default function CollaborationActivityPanel({ payload, isDarkMode }) {
  const summary = payload.summary || {};
  const trend = buildTrend(payload.contributions?.trend, payload.range, ['total']);

  return (
    <div className="space-y-5">
      <AnalyticsMetricStrip
        isDarkMode={isDarkMode}
        items={[
          { label: 'Accounts', value: summary.totalAccounts ?? 0, helper: 'Non-deleted accounts' },
          { label: 'Active', value: summary.activeAccounts ?? 0, helper: 'Currently active' },
          { label: 'Pending', value: summary.pendingAccounts ?? 0, helper: 'Awaiting activation' },
          {
            label: 'Restricted',
            value: summary.restrictedAccounts ?? 0,
            helper: 'Suspended or locked',
          },
          {
            label: 'Contributors',
            value: summary.activeContributors ?? 0,
            helper: 'Distinct operational participants',
          },
          {
            label: 'Events',
            value: summary.contributionEvents ?? 0,
            helper: 'Aggregate workflow events',
          },
        ]}
      />

      <section className="grid gap-5 xl:grid-cols-2">
        <DistributionCard
          title="Account State Distribution"
          description="Aggregate account state without names, emails, or contact information."
          rows={entriesByCount(payload.statusCounts)}
          isDarkMode={isDarkMode}
        />
        <DistributionCard
          title="Configured User Type Distribution"
          description="Counts by configured User Type key; not an employee score or ranking."
          rows={entriesByCount(payload.roleCounts)}
          isDarkMode={isDarkMode}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.75fr)]">
        <TrendCard
          title="Operational Participation"
          description="Aggregate forecast/review activity over time."
          rows={trend}
          series={[{ dataKey: 'total', label: 'Operational events', stroke: '#06b6d4' }]}
          bucketLabel={bucketLabel(payload.range?.days)}
          isDarkMode={isDarkMode}
        />
        <BarChartCard
          title="Contribution Event Mix"
          description="Tracked workflow events grouped by action."
          rows={contributionMixRows(payload.contributions)}
          isDarkMode={isDarkMode}
        />
      </section>
    </div>
  );
}
