import { BarChartCard, DistributionCard, TrendCard } from '../AnalyticsVisuals';
import AnalyticsMetricStrip from '../components/AnalyticsMetricStrip';
import AnalyticsTable from '../components/AnalyticsTable';
import { contributionMixRows, entriesByCount } from '../analyticsWorkspaceModel';
import { bucketLabel, buildTrend } from '../analyticsPresentation';

export default function CollaborationActivityPanel({ payload, isDarkMode }) {
  const summary = payload.summary || {};
  const trend = buildTrend(payload.contributions?.trend, payload.range, ['total']);
  const actionRows = contributionMixRows(payload.contributions);

  return (
    <div className="space-y-4">
      <AnalyticsMetricStrip
        isDarkMode={isDarkMode}
        items={[
          { label: 'Accounts', value: summary.totalAccounts ?? 0, helper: 'Non-deleted accounts' },
          { label: 'Active', value: summary.activeAccounts ?? 0, helper: 'Currently active' },
          { label: 'Pending', value: summary.pendingAccounts ?? 0, helper: 'Awaiting activation' },
          { label: 'Restricted', value: summary.restrictedAccounts ?? 0, helper: 'Suspended or locked' },
          { label: 'Contributors', value: summary.activeContributors ?? 0, helper: 'Distinct operational participants' },
          { label: 'Events', value: summary.contributionEvents ?? 0, helper: 'Aggregate workflow events' },
        ]}
      />

      <section className="grid gap-4 2xl:grid-cols-[minmax(0,1.5fr)_minmax(22rem,0.75fr)]">
        <TrendCard
          title="Operational Participation Trend"
          description="Aggregate forecast and review activity over time."
          rows={trend}
          series={[{ dataKey: 'total', label: 'Operational events', stroke: '#06b6d4' }]}
          bucketLabel={bucketLabel(payload.range?.days)}
          isDarkMode={isDarkMode}
        />
        <BarChartCard
          title="Contribution Event Mix"
          description="Tracked workflow activity grouped by persisted action."
          rows={actionRows}
          isDarkMode={isDarkMode}
        />
      </section>

      <section className="grid gap-4 2xl:grid-cols-2">
        <DistributionCard
          title="Account State Distribution"
          description="Current aggregate account state."
          rows={entriesByCount(payload.statusCounts)}
          isDarkMode={isDarkMode}
        />
        <DistributionCard
          title="Configured User Type Distribution"
          description="Current accounts grouped by configured User Type key."
          rows={entriesByCount(payload.roleCounts)}
          isDarkMode={isDarkMode}
        />
      </section>

      <AnalyticsTable
        title="Participation Evidence Matrix"
        description="Aggregate-only collaboration evidence. No individual scoring or identity ranking."
        isDarkMode={isDarkMode}
        headers={['Workflow action', 'Events', 'Share of tracked events']}
        rows={actionRows.map((row) => [
          row.label,
          row.value,
          summary.contributionEvents
            ? `${Math.round((row.value / summary.contributionEvents) * 1000) / 10}%`
            : '—',
        ])}
      />
    </div>
  );
}
