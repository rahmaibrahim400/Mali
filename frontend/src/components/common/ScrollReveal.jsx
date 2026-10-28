import { useEffect, useRef, useState } from "react";
import { RevealedContext } from "./scrollRevealContext";

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/*
  A page section that appears when it scrolls into view: it fades and rises in, then the parts
  marked inside it come alive — [data-reveal-stagger] children one after another and
  [data-reveal-bar] bars filling from zero (see index.css).

  `ready` is false while the section's data is loading: the skeleton shows normally and nothing
  is decided yet, because the page is still short and everything looks "in view". Once ready,
  the section stays hidden until it is really on screen. Sections visible at that moment come in
  one after another (`index` sets the order); the rest wait for the scroll. Once shown, a
  section stays shown (a later reload of its data doesn't hide it again).
*/
function ScrollReveal({ ready = true, index = 0, className = "", children }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(() => typeof IntersectionObserver === "undefined" || reducedMotion());
  const waiting = ready && !shown;

  useEffect(() => {
    if (!waiting) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    // In view the moment the data arrived: part of the opening sequence, so keep the order.
    const onScreenNow = el.getBoundingClientRect().top < window.innerHeight;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        el.style.setProperty("--reveal-delay", `${onScreenNow ? Math.min(index, 5) * 90 : 0}ms`);
        setShown(true);
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [waiting, index]);

  return (
    <div
      ref={ref}
      data-scroll-reveal=""
      className={`scroll-reveal ${waiting ? "is-waiting" : ""} ${shown ? "is-shown" : ""} ${className}`}
    >
      <RevealedContext.Provider value={shown || !ready}>{children}</RevealedContext.Provider>
    </div>
  );
}

export default ScrollReveal;
