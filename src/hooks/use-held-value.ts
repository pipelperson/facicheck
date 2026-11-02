import { useEffect, useRef, useState } from "react";

/** Menahan perubahan nilai agar tidak berganti lebih cepat dari holdMs. */
export function useHeldValue<T>(value: T, holdMs: number): T {
  const [shown, setShown] = useState(value);
  const changedAt = useRef(0);

  useEffect(() => {
    if (Object.is(value, shown)) return;
    const wait = Math.max(0, holdMs - (Date.now() - changedAt.current));
    const id = window.setTimeout(() => {
      changedAt.current = Date.now();
      setShown(value);
    }, wait);
    return () => window.clearTimeout(id);
  }, [value, shown, holdMs]);

  return shown;
}