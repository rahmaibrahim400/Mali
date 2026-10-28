function AuthBanner({ variant = "error", children }) {
  const className =
    variant === "success"
      ? "mb-4 rounded-xl bg-income-soft px-4 py-2.5 text-sm font-medium text-income"
      : "mb-4 rounded-xl bg-expense-soft px-4 py-2.5 text-sm font-medium text-expense";

  return <p className={className}>{children}</p>;
}

export default AuthBanner;
