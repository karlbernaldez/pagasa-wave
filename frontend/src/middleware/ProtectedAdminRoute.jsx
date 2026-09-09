import ProtectedRoute from './ProtectedRoute';

// Legacy compatibility wrapper. New routes should use ProtectedRoute directly.
// Authorization is permission-driven; the User Type name never grants access by itself.
const ProtectedAdminRoute = ({ children, requireAuth = true, permission = null }) => (
  <ProtectedRoute requireAuth={requireAuth} permission={permission} deniedRedirect="/">
    {children}
  </ProtectedRoute>
);

export default ProtectedAdminRoute;
