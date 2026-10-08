"use client";

import { useReducedMotion } from "motion/react";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Reduced-motion preference, false on the server and first render to avoid hydration mismatches. */
export function useReduced(): boolean {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const prefers = useReducedMotion();
  return mounted && Boolean(prefers);
}
