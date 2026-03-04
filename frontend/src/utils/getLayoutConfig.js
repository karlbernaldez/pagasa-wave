// utils/getLayoutConfig.js
const getLayoutConfig = ({ isAuthPage, isDashboardPage, isStudioPage, isStudioProjectPage, isChartsPage }) => ({
  showHeader: !(isAuthPage || isDashboardPage),
  showFooter: !(isStudioPage || isAuthPage || isDashboardPage || isChartsPage),
  showDivider: !(isStudioPage || isAuthPage || isDashboardPage || isChartsPage),
  addTopPadding: !isAuthPage && !isDashboardPage,
});

export default getLayoutConfig;
