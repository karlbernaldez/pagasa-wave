// utils/getLayoutConfig.js
const getLayoutConfig = ({ isAuthPage, isDashboardPage, isEditPage }) => ({
  showHeader: !(isAuthPage || isDashboardPage),
  showFooter: !(isEditPage || isAuthPage || isDashboardPage),
  showDivider: !(isEditPage || isAuthPage || isDashboardPage),
  addTopPadding: !isAuthPage && !isDashboardPage,
});

export default getLayoutConfig;
