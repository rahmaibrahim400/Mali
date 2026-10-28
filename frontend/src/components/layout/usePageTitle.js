import { useEffect } from "react";
import { useTranslation } from "react-i18next";

// Browser tab title: "<page> · Mali", so open tabs and history entries say where they lead.
// Keeps the "(n) " unread-chat prefix that ChatUnreadContext puts in front.
export default function usePageTitle(label) {
  const { t } = useTranslation();
  const appName = t("common.appName");

  useEffect(() => {
    const prefix = document.title.match(/^\(\d+\)\s*/)?.[0] || "";
    document.title = `${prefix}${label ? `${label} · ${appName}` : appName}`;
  }, [label, appName]);
}
