import useCurrentDashboardUser from '@/shared/hooks/useCurrentDashboardUser';

/**
 * Loads and caches the current authenticated admin user.
 * Kept as an admin-header adapter so existing imports stay stable.
 *
 * @returns {{ user: DerivedUser, logout: () => Promise<void> }}
 */
const useCurrentUser = () => useCurrentDashboardUser();

export default useCurrentUser;
