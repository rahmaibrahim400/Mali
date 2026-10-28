function AuthCard({ children, as: Component = "form", className = "", ...props }) {
  return (
    <Component className={`w-full ${className}`} {...props}>
      {children}
    </Component>
  );
}

export default AuthCard;
