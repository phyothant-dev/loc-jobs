import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";

interface FilterCounts {
  nearby: number;
  explore: number;
  chat: number;
  notifications: number;
}

interface FilterCountContextValue {
  counts: FilterCounts;
  setCount: (tab: keyof FilterCounts, count: number) => void;
}

const FilterCountContext = createContext<FilterCountContextValue>({
  counts: { nearby: 0, explore: 0, chat: 0, notifications: 0 },
  setCount: () => {},
});

export function FilterCountProvider({ children }: { children: ReactNode }) {
  const [counts, setCounts] = useState<FilterCounts>({ nearby: 0, explore: 0, chat: 0, notifications: 0 });
  const setCount = useCallback((tab: keyof FilterCounts, count: number) => {
    setCounts((prev) => ({ ...prev, [tab]: count }));
  }, []);
  const value = useMemo(() => ({ counts, setCount }), [counts, setCount]);
  return (
    <FilterCountContext.Provider value={value}>
      {children}
    </FilterCountContext.Provider>
  );
}

export const useFilterCount = () => useContext(FilterCountContext);
