import { Children, useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

function Select({ id, name, value, onChange, children, className, disabled, required, placeholderClassName }) {
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const generatedId = useId();
  const buttonId = id || `select-${generatedId}`;
  const listId = `${buttonId}-listbox`;

  const options = Children.toArray(children)
    .filter((child) => child?.props && "value" in child.props)
    .map((child) => ({
      value: child.props.value,
      label: child.props.children,
      disabled: Boolean(child.props.disabled),
    }));

  const selectedIndex = options.findIndex((opt) => String(opt.value) === String(value ?? ""));
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return undefined;
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function openList() {
    if (disabled) return;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : options.findIndex((opt) => !opt.disabled));
    setOpen(true);
  }

  function selectValue(optionValue) {
    if (disabled) return;
    onChange?.({ target: { name, value: optionValue } });
    setOpen(false);
    buttonRef.current?.focus();
  }

  function moveActive(step) {
    if (!options.length) return;
    let next = activeIndex;
    for (let i = 0; i < options.length; i += 1) {
      next = (next + step + options.length) % options.length;
      if (!options[next].disabled) break;
    }
    setActiveIndex(next);
  }

  function handleKeyDown(event) {
    if (disabled) return;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp":
        event.preventDefault();
        if (!open) openList();
        else moveActive(event.key === "ArrowDown" ? 1 : -1);
        break;
      case "Home":
      case "End":
        if (!open) return;
        event.preventDefault();
        setActiveIndex(event.key === "Home" ? options.findIndex((o) => !o.disabled) : options.findLastIndex((o) => !o.disabled));
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (!open) openList();
        else if (activeIndex >= 0 && !options[activeIndex]?.disabled) selectValue(options[activeIndex].value);
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
        }
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
    }
  }

  const hasValue = selected && selected.value !== "";

  return (
    <div ref={containerRef} className="relative">
      {name && <input type="hidden" name={name} value={value ?? ""} readOnly />}
      {required && (
        // Invisible stand-in so the browser's form validation blocks submitting an empty choice.
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          value={value ?? ""}
          onChange={() => {}}
          onKeyDown={() => buttonRef.current?.focus()}
          data-select-proxy=""
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-full opacity-0"
        />
      )}

      <button
        ref={buttonRef}
        type="button"
        id={buttonId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
        className={`flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-start text-sm outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 ${className || ""}`}
      >
        <span className={`min-w-0 truncate ${hasValue ? "text-slate-800" : placeholderClassName || "text-slate-400"}`}>
          {selected?.label ?? ""}
        </span>
        <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={buttonId}
          className="absolute z-40 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 text-start shadow-lg"
        >
          {options.map((opt, index) => {
            const isSelected = index === selectedIndex;
            const isActive = index === activeIndex;
            return (
              <div
                key={String(opt.value)}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled || undefined}
                onMouseEnter={() => !opt.disabled && setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => !opt.disabled && selectValue(opt.value)}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  opt.disabled
                    ? "cursor-not-allowed text-slate-300"
                    : `cursor-pointer ${isActive ? "bg-slate-50" : ""} ${isSelected ? "bg-brand-50 font-semibold text-brand-700" : "text-slate-700"}`
                }`}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Select;
