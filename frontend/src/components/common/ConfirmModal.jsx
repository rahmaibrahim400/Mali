import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Lock, X } from "lucide-react";

const ANIMATION_MS = 180;

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  icon: Icon = Lock,
  title,
  description,
  cancelLabel,
  confirmLabel,
  confirmVariant = "primary",
}) {
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(false);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setMounted(true);
    } else {
      setVisible(false);
    }
  }

  useEffect(() => {
    if (!isOpen) {
      if (!mounted) return undefined;
      const timeout = setTimeout(() => setMounted(false), ANIMATION_MS);
      return () => clearTimeout(timeout);
    }
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [isOpen, mounted]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 transition-opacity ease-out ${
        visible ? "opacity-100 duration-200" : "opacity-0 duration-150"
      }`}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl shadow-slate-900/10 transition-all ease-out ${
          visible
            ? "scale-100 opacity-100 duration-200"
            : "scale-95 opacity-0 duration-150"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={cancelLabel}
          className="absolute inset-e-4 top-4 text-slate-400 transition hover:text-slate-600"
        >
          <X size={18} strokeWidth={1.75} />
        </button>

        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <Icon size={20} strokeWidth={1.75} className="text-slate-800" />
        </span>

        <h2 className="mt-4 text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>

        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-95"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-full py-2.5 text-sm font-semibold text-white transition active:scale-95 ${
              confirmVariant === "destructive"
                ? "bg-expense hover:bg-red-700"
                : "bg-brand-600 hover:bg-brand-700"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConfirmModal;
