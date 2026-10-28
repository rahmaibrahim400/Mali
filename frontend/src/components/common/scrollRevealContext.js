import { createContext, useContext } from "react";

export const RevealedContext = createContext(true);

// Inside a <ScrollReveal>: false until the section has scrolled into view (charts wait for it so
// their own animation plays when it can be seen). Outside one it is always true.
export function useScrollRevealed() {
  return useContext(RevealedContext);
}
