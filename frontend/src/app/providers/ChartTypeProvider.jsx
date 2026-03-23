import { createContext, useContext, useState, useMemo } from "react";

const ChartTypeContext = createContext(null);

export const ChartTypeProvider = ({ children }) => {
  const [activeChartType, setActiveChartType] = useState("wave-wind");

  const value = useMemo(
    () => ({ activeChartType, setActiveChartType }),
    [activeChartType]
  );

  return (
    <ChartTypeContext.Provider value={value}>
      {children}
    </ChartTypeContext.Provider>
  );
};

export const useChartType = () => {
  const ctx = useContext(ChartTypeContext);
  if (!ctx) throw new Error("useChartType must be used inside ChartTypeProvider");
  return ctx;
};
