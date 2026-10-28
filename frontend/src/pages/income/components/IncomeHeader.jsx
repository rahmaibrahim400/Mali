import { TrendingUp } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";
import { useTranslation } from "react-i18next";

function IncomeHeader({ actions }) {
  const { t } = useTranslation();

  return <PageHeader icon={TrendingUp} title={t("income.title")} subtitle={t("income.description")} actions={actions} />;
}

export default IncomeHeader;
