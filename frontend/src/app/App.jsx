import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import AppRoutes from "../routes/AppRoutes";
import { fetchCurrentUser, markAuthChecked } from "../store/slices/authSlice";
import { LANGUAGE_STORAGE_KEY } from "../i18n/i18n";
import { PageLoader } from "../components/common/Loader";

function App() {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const { token, authChecked, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      dispatch(fetchCurrentUser());
    } else {
      dispatch(markAuthChecked());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // لو المستخدم مختار لغة مختلفة من حساب تاني، نتزامن معاها أول ما نجيب بياناته
    // (بس لو مفيش لغة متحفوظة محليًا على الجهاز ده قبل كده).
    if (user?.locale && !localStorage.getItem(LANGUAGE_STORAGE_KEY) && user.locale !== i18n.language) {
      i18n.changeLanguage(user.locale);
    }
  }, [user?.locale, i18n]);

  if (!authChecked) {
    return <PageLoader />;
  }

  return <AppRoutes />;
}

export default App;
