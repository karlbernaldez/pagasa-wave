// utils/getLayoutConfig.js
const getLayoutConfig = ({ isAuthPage, isDashboardPage, isStudioPage, isStudioProjectPage, isChartsPage, isVerifyEmailPage }) => ({
  showHeader: !(isAuthPage || isDashboardPage || isVerifyEmailPage),
  showFooter: !(isStudioPage || isStudioProjectPage || isAuthPage || isDashboardPage || isChartsPage || isVerifyEmailPage),
  showDivider: !(isStudioPage || isAuthPage || isDashboardPage || isChartsPage || isVerifyEmailPage),
  addTopPadding: !isAuthPage && !isDashboardPage
});

export default getLayoutConfig;
