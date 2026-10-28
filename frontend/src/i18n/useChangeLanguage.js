import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { saveLocale } from "../store/slices/authSlice";
import switchLanguage from "../utils/switchLanguage";

// Switches the UI language (shared by LanguageSwitcher and Settings → Preferences).
export default function useChangeLanguage() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  return useCallback(
    (lng) => {
      // يتزامن مع حساب المستخدم عشان يفضل نفس اللغة على أي جهاز يسجّل دخول منه.
      if (switchLanguage(lng) && token) dispatch(saveLocale(lng));
    },
    [dispatch, token]
  );
}
