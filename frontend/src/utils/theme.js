import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

// The app's visual themes, applied as <html data-theme="..."> (styles in index.css).
// index.html applies the saved theme before React loads, so a reload doesn't flash the default.
export const THEMES = ["mali", "emerald"];
export const DEFAULT_THEME = "mali";

// How each theme presents itself in the theme menu and the profile's Appearance tab.
// Preview colors are fixed (not theme variables) so every option shows its own look.
export const THEME_OPTIONS = [
  {
    id: "mali",
    preview: {
      primary: "#334155",
      accent: "#ff9b51",
      sidebar: "#ffffff",
      sidebarLine: "#e2e8f0",
      sidebarActive: "#334155",
      heroStart: "#334155",
      heroEnd: "#334155",
    },
  },
  {
    id: "emerald",
    preview: {
      primary: "#059669",
      accent: "#34d399",
      sidebar: "#151f2b",
      sidebarLine: "rgb(255 255 255 / 0.12)",
      sidebarActive: "rgb(16 185 129 / 0.35)",
      heroStart: "#1e2a38",
      heroEnd: "#151f2b",
    },
  },
];
const STORAGE_KEY = "appTheme";

const listeners = new Set();

export function getTheme() {
  const theme = document.documentElement.dataset.theme;
  return THEMES.includes(theme) ? theme : DEFAULT_THEME;
}

export function setTheme(theme) {
  if (!THEMES.includes(theme) || theme === getTheme()) return;

  // Cross-fade into the new theme, like the language switch.
  const apply = () =>
    flushSync(() => {
      document.documentElement.dataset.theme = theme;
      listeners.forEach((listener) => listener());
    });
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (document.startViewTransition && !reduceMotion) document.startViewTransition(apply);
  else apply();

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage blocked (private mode): the theme still applies for this visit.
  }
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Current theme, re-rendering when it changes. For the few values styles can't switch
// (e.g. preset color swatches saved with an account).
export function useTheme() {
  return useSyncExternalStore(subscribe, getTheme);
}
