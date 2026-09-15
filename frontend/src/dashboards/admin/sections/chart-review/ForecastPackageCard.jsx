import SharedForecastPackageCard from '@/features/forecasts/components/ForecastPackageCard';
import useCurrentDashboardUser from '@/shared/hooks/useCurrentDashboardUser';

export default function ForecastPackageCard(props) {
  const { rawUser } = useCurrentDashboardUser();

  return (
    <SharedForecastPackageCard
      {...props}
      permissions={props.permissions ?? rawUser?.permissions ?? []}
    />
  );
}
