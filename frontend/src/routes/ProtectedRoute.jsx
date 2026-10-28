import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute() {
  const { token } = useSelector((state) => state.auth);
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
