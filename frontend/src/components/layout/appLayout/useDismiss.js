import { useEffect } from "react";

// Closes a dropdown while it's open: on a click outside `containerRef`, or on Escape.
function useDismiss(containerRef, open, onClose) {
  useEffect(() => {
    if (!open) return undefined;
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) onClose();
    }
    function handleEscape(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [containerRef, open, onClose]);
}

export default useDismiss;
