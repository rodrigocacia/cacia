import { Icon } from "@/components/icone";
import { Header } from "@/components/header";
import { Breadcrumbs } from "@/components/ui/custom-breadcrumb";
import { NavDoConsumo } from "@/components/consumo-ia/nav-do-consumo";

import { aiBillingCrumbs } from "@/constants/breadcrumbs";
import { getAiBilling } from "@/http/ai-usage/ai-billing";

import { ParametrosDeCobranca } from "./parametros-de-cobranca";

export default async function ParametrosDeCobrancaPage() {
  const resultado = await getAiBilling();

  return (
    <div className="w-full h-full max-lg:px-4">
      <Header title="Consumo de IA" />

      <Breadcrumbs crumbs={aiBillingCrumbs} />

      <NavDoConsumo />

      {resultado.success ? (
        <ParametrosDeCobranca inicial={resultado.data} />
      ) : (
        <div className="w-full mt-6 p-8 bg-white rounded-2xl shadow-sm flex items-center gap-3">
          <Icon icon="mdi:alert-outline" className="text-[#BDBDBD] w-8 h-8" />
          <p className="text-base text-[#707070] font-medium">
            {resultado.error}
          </p>
        </div>
      )}
    </div>
  );
}
