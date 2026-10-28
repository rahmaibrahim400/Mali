function AuthFormHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

export default AuthFormHeader;
