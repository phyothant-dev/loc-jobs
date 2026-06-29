import { createContext, useContext, useState, ReactNode } from "react";

interface FilterCounts {
  nearby: number;
  explore: number;
  chat: number;
}

interface FilterCountContextValue {
  counts: FilterCounts;
  setCount: (tab: keyof FilterCounts, count: number) => void;
}

const FilterCountContext = createContext<FilterCountContextValue>({
  counts: { nearby: 0, explore: 0, chat: 0 },
  setCount: () => {},
});

export function FilterCountProvider({ children }: { children: ReactNode }) {
  const [counts, setCounts] = useState<FilterCounts>({ nearby: 0, explore: 0, chat: 0 });
  const setCount = (tab: keyof FilterCounts, count: number) => {
    setCounts((prev) => ({ ...prev, [tab]: count }));
  };
  return (
    <FilterCountContext.Provider value={{ counts, setCount }}>
      {children}
    </FilterCountContext.Provider>
  );
}

export const useFilterCount = () => useContext(FilterCountContext);
