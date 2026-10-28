import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { setAdminUnauthorizedHandler } from "../api/adminClient";
import { adminSessionExpired, fetchAdmin, getAdminTokenExpiry } from "../store/slices/adminAuthSlice";
import { PageLoader } from "../components/common/Loader";

function AdminProtectedRoute() {
  const dispatch = useDispatch();
  const { token, checked } = useSelector((state) => state.adminAuth);

  // أي 401 من API الأدمن → امسح الجلسة وارجع للوجين
  useEffect(() => {
    setAdminUnauthorizedHandler(() => dispatch(adminSessionExpired()));
    return () => setAdminUnauthorizedHandler(null);
  }, [dispatch]);

  // اتأكد من السيرفر إن التوكن لسه صالح
  useEffect(() => {
    if (token && !checked) dispatch(fetchAdmin());
  }, [token, checked, dispatch]);

  // اقفل الجلسة أول ما التوكن يخلص (30 دقيقة) حتى لو مفيش طلبات
  useEffect(() => {
    if (!token) return undefined;
    const remaining = getAdminTokenExpiry(token) - Date.now();
    const timeoutId = window.setTimeout(() => dispatch(adminSessionExpired()), Math.max(remaining, 0));
    return () => window.clearTimeout(timeoutId);
  }, [token, dispatch]);

  if (!token) return <Navigate to="/login" replace />;
  if (!checked) return <PageLoader />;
  return <Outlet />;
}

export default AdminProtectedRoute;
