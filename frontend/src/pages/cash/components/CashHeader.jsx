import { WalletCards } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";
import { useTranslation } from "react-i18next";

function CashHeader() {
  const { t } = useTranslation();

  return (
    <PageHeader icon={WalletCards} title={t("nav.cash")} subtitle={t("cash.subtitle")} />
  );
}

export default CashHeader;
