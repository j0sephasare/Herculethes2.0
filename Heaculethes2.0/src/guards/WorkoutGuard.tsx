// src/guards/WorkoutGuard.tsx
import { createContext, useContext, useState, type ReactNode } from "react";

type Ctx = {
  dirty: boolean;
  setDirty: (d: boolean) => void;
};

const GuardContext = createContext<Ctx | undefined>(undefined);

export function WorkoutGuardProvider({ children }: { children: ReactNode }) {
  const [dirty, setDirty] = useState(false);
  return (
    <GuardContext.Provider value={{ dirty, setDirty }}>
      {children}
    </GuardContext.Provider>
  );
}

export function useWorkoutGuard() {
  const ctx = useContext(GuardContext);
  if (!ctx) throw new Error("useWorkoutGuard must be used within WorkoutGuardProvider");
  return ctx;
}
