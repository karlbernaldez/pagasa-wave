import { Outlet } from 'react-router-dom';
import ProtectedRoute from '@/middleware/ProtectedRoute';
import ForecasterShell from './ForecasterShell';

export default function ForecasterRouteLayout() {
  return (
    <ProtectedRoute requireAuth={true}>
      <ForecasterShell>
        <Outlet />
      </ForecasterShell>
    </ProtectedRoute>
  );
}
