import { useEffect, useRef } from "react";

// Calls `callback` right away and then every `interval` ms while the tab is visible,
// and again as soon as the tab comes back into view. A new `restartKey` restarts it
// (runs right away), e.g. when a search changes.
export default function usePolling(callback, interval, enabled = true, restartKey = null) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;
    const run = () => {
      if (!document.hidden) callbackRef.current();
    };
    run();
    const id = setInterval(run, interval);
    document.addEventListener("visibilitychange", run);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", run);
    };
  }, [interval, enabled, restartKey]);
}
