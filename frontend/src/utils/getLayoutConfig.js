// utils/getLayoutConfig.js
const getLayoutConfig = ({ isAuthPage, isDashboardPage, isStudioPage, isStudioProjectPage, isChartsPage, isVerifyEmailPage, isForecasterDashboardPage }) => ({
  showHeader: !(isAuthPage || isDashboardPage || isVerifyEmailPage || isForecasterDashboardPage),
  showFooter: !(isStudioPage || isStudioProjectPage || isAuthPage || isDashboardPage || isChartsPage || isVerifyEmailPage || isForecasterDashboardPage),
  showDivider: !(isStudioPage || isAuthPage || isDashboardPage || isChartsPage || isVerifyEmailPage || isForecasterDashboardPage),
  addTopPadding: !isAuthPage && !isDashboardPage && !isForecasterDashboardPage
});

export default getLayoutConfig;
