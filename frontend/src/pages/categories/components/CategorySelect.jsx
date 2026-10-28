import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { listCategories, createCategory, deleteCategory } from "../../../api/categoryApi";
import Select from "../../../components/common/Select";
import { extractError } from "../../../utils/errorHandler";

const DEFAULT_COLOR = "#6b7280";

const TYPE_OPTIONS = [
  { value: "daily" },
  { value: "fixed" },
  { value: "emergency" },
];

import { MANDATORY_CATEGORIES, categoryLabel } from "./mandatoryCategories";

export default function CategorySelect({
  id = "category",
  name = "category",
  value,
  onChange,
  expenseType = "daily",
  className,
  required,
}) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [isOpen,     setIsOpen]     = useState(false);
  const [adding,     setAdding]     = useState(false);
  const [newName,    setNewName]    = useState("");
  const [newType,    setNewType]    = useState(expenseType || "daily");
  const [newColor,   setNewColor]   = useState(DEFAULT_COLOR);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [listError, setListError] = useState("");

  const containerRef = useRef(null);

  // إغلاق القائمة عند الضغط خارجها
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setAdding(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // جلب التصنيفات ديناميكياً من API الباك إند
  useEffect(() => {
    let isMounted = true;

    async function loadApiCategories() {
      setLoading(true);
      try {
        const data = await listCategories();
        if (!isMounted) return;
        setCategories(Array.isArray(data) ? data : []);
      } catch {
        if (isMounted) setCategories([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadApiCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  // اختيار تصنيف بالاسم
  function handleSelect(catName) {
    onChange?.(catName);
    setIsOpen(false);
  }

  // إضافة تصنيف مخصص جديد عبر POST /api/expense-categories
  async function handleCreate(e) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setError(t("categoriesPage.nameRequired"));
      return;
    }

    setSaving(true);
    setError("");

    try {
      const created = await createCategory({
        name:  trimmed,
        type:  newType,
        color: newColor,
      });

      // إضافة التصنيف الجديد العائد من الباك إند للقائمة فوراً
      setCategories((prev) => {
        const exists = prev.some((c) => c._id === created._id || c.name === created.name);
        return exists ? prev : [...prev, created];
      });

      // تحديد الاسم مباشرة في الفورم
      onChange?.(created.name || trimmed);

      setAdding(false);
      setIsOpen(false);
      setNewName("");
      setNewType(expenseType || "daily");
      setNewColor(DEFAULT_COLOR);
    } catch (err) {
      setError(
        extractError(err, t("categoriesPage.createError"))
      );
    } finally {
      setSaving(false);
    }
  }

  // حذف تصنيف مخصص عبر DELETE /api/expense-categories/:id
  async function handleDelete(e, cat) {
    e.stopPropagation();
    if (!cat._id || cat.isDefault || MANDATORY_CATEGORIES.includes(cat.name)) return;

    setDeletingId(cat._id);
    setListError("");
    try {
      await deleteCategory(cat._id);

      setCategories((prev) => prev.filter((c) => c._id !== cat._id));

      if (value === cat.name || String(value) === String(cat._id)) {
        onChange?.("");
      }
    } catch (err) {
      setListError(extractError(err, t("categoriesPage.deleteError")));
    } finally {
      setDeletingId(null);
    }
  }

  // مطابقة التصنيف المختار سواء تم حفظه كاسم أو كـ ID
  const selectedCategory = categories.find(
    (c) => c.name === value || (c._id && String(c._id) === String(value))
  );

  const displayLabel = selectedCategory
    ? categoryLabel(selectedCategory.name)
    : value
      ? categoryLabel(value)
      : t("categoriesPage.select.placeholder");

  const defaultButtonClass =
    "flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-start outline-none transition focus:border-brand-500";

  return (
    <div ref={containerRef} className="relative w-full">
      <input type="hidden" name={name} value={value || ""} />
      {required && (
        // Invisible stand-in so the browser's form validation blocks submitting without a category.
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          value={value || ""}
          onChange={() => {}}
          data-select-proxy=""
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-full opacity-0"
        />
      )}

      {/* زر عرض القائمة المنسدلة */}
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen(!isOpen);
          setAdding(false);
        }}
        className={`min-h-11 ${className || defaultButtonClass}`}
      >
        <div className="flex items-center gap-2">
          {selectedCategory || value ? (
            <span className="flex items-center gap-1.5 font-medium text-slate-800">
              <span
                className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: selectedCategory?.color || "#6b7280" }}
              />
              {displayLabel}
            </span>
          ) : (
            <span className="text-slate-400">
              {loading ? t("categoriesPage.select.loading") : t("categoriesPage.select.placeholder")}
            </span>
          )}
        </div>

        {/* أيقونة السهم لأسفل SVG */}
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* القائمة المنسدلة بدون كلمة "اختر التصنيف" وبأيقونات SVG */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
          {adding ? (
            <div className="rounded-lg bg-slate-50 p-2.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">{t("categoriesPage.select.newTitle")}</span>
                <button
                  type="button"
                  onClick={() => { setAdding(false); setError(""); }}
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              </div>

              <input
                type="text"
                autoFocus
                placeholder={t("categoriesPage.select.newPlaceholder")}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreate(e);
                  }
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-brand-500 focus:outline-none"
              />

              <div className="mt-2 grid grid-cols-2 gap-2">
                <Select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs focus:outline-none"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{t(`categoriesPage.type.${opt.value}`)}</option>
                  ))}
                </Select>

                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="h-7 w-8 cursor-pointer rounded border border-slate-300 p-0.5"
                  />
                  <span className="text-xs text-slate-400">{newColor}</span>
                </div>
              </div>

              {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}

              <div className="mt-2.5 flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => { setAdding(false); setError(""); }}
                  className="min-h-10 rounded-md px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-200"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={saving}
                  className="min-h-10 rounded-md bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {saving ? t("categoriesPage.select.adding") : t("categoriesPage.select.add")}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* قائمة الاختيارات المسترجعة من الـ API */}
              {listError && <p className="px-3 py-1.5 text-xs text-rose-600">{listError}</p>}
              <div className="max-h-56 overflow-y-auto space-y-0.5">
                {categories.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-slate-400">
                    {loading ? t("categoriesPage.select.loadingList") : t("categoriesPage.select.none")}
                  </p>
                ) : (
                  categories.map((cat) => {
                    const isCustom = !cat.isDefault && !MANDATORY_CATEGORIES.includes(cat.name) && Boolean(cat._id);
                    const isSelected = value === cat.name || String(value) === String(cat._id);

                    return (
                      <div
                        key={cat._id || cat.name}
                        onClick={() => handleSelect(cat.name)}
                        className={`group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-slate-100 ${
                          isSelected ? "bg-brand-50 font-semibold text-brand-700" : "text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: cat.color || "#6b7280" }}
                          />
                          <span>{categoryLabel(cat.name)}</span>
                        </div>

                        {/* أيقونة الحذف SVG للتصنيفات المخصصة */}
                        {isCustom && (
                          <button
                            type="button"
                            title={t("categoriesPage.select.deleteTitle")}
                            onClick={(e) => handleDelete(e, cat)}
                            disabled={deletingId === cat._id}
                            className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-rose-100 hover:text-rose-600 disabled:opacity-50"
                          >
                            {deletingId === cat._id ? (
                              <span className="text-xs">...</span>
                            ) : (
                              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* زر إضافة تصنيف جديد بأيقونة SVG */}
              <div className="mt-1 border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setNewType(expenseType || "daily");
                    setAdding(true);
                  }}
                  className="flex w-full items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-brand-600 transition hover:bg-brand-50"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                  </svg>
                  <span>{t("categoriesPage.select.addOption")}</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
