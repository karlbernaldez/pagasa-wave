import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/styles/index.css';
import App from './App';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ⭐ create ONE shared client for whole app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,   // avoids annoying refetch loops in dashboards
      retry: 1,                      // safer for APIs with auth
      staleTime: 1000 * 60 * 5,      // 5 min cache (good default for admin data)
    },
  },
});

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);