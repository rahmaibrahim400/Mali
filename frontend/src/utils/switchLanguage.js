import { flushSync } from "react-dom";
import i18n from "../i18n/i18n";

// Cross-fade old and new language (text + direction) instead of an abrupt jump.
// flushSync makes React render the new language inside the transition callback.
export default function switchLanguage(lng) {
  if (i18n.language === lng) return false;
  const apply = () => flushSync(() => i18n.changeLanguage(lng));
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (document.startViewTransition && !reduceMotion) document.startViewTransition(apply);
  else apply();
  return true;
}
