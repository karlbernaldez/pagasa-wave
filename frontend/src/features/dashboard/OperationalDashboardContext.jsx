import { createContext, useContext } from 'react';

const OperationalDashboardContext = createContext(null);

export function OperationalDashboardProvider({ children, value }) {
  return (
    <OperationalDashboardContext.Provider value={value}>
      {children}
    </OperationalDashboardContext.Provider>
  );
}

export function useOperationalDashboard() {
  const context = useContext(OperationalDashboardContext);

  if (!context) {
    throw new Error('useOperationalDashboard must be used within OperationalDashboardProvider');
  }

  return context;
}
