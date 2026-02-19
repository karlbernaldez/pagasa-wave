import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from '@/components/layout/ErrorBoundary';
import AppProviders from './providers/AppProviders';
import AppRouter from './router/AppRouter';

const App = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;
