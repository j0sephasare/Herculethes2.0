// src/hooks/useUnsavedChanges.ts
import { useEffect } from "react";

/** Adds browser-level guard (refresh/close). You control when it's dirty. */
export default function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore custom messages
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
}
