'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Period = { term: string; session: string };

const PeriodContext = createContext<{ period: Period; setPeriod: (p: Period) => void }>({
  period: { term: 'First Term', session: '2024/2025' },
  setPeriod: () => {},
});

export function PeriodProvider({ children }: { children: React.ReactNode }) {
  const [period, setPeriodState] = useState<Period>({ term: 'First Term', session: '2024/2025' });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings/period', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setPeriodState({ term: data.term, session: data.session });
        }
      } catch {}
    })();
  }, []);

  const setPeriod = async (p: Period) => {
    setPeriodState(p);
    try {
      await fetch('/api/settings/period', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
    } catch {}
  };

  return (
    <PeriodContext.Provider value={{ period, setPeriod }}>
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod() {
  return useContext(PeriodContext);
}


