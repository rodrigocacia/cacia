import { Header } from "@/components/header";
import { PageHeader } from "@/components/ui/page-header";
import { AvisoDeErro } from "@/components/consumo-ia/aviso-de-erro";
import { NavDoConsumo } from "@/components/consumo-ia/nav-do-consumo";

import { getAiBilling } from "@/http/ai-usage/ai-billing";

import { ParametrosDeCobranca } from "./parametros-de-cobranca";

export default async function ParametrosDeCobrancaPage() {
  const resultado = await getAiBilling();

  return (
    <div className="flex w-full flex-col pb-10">
      <Header title="Consumo de IA" name="Parâmetros de cobrança" />

      <PageHeader
        eyebrow="Consumo de IA"
        title="Cobrança"
        description="Margem, câmbio e preço de cada modelo: a base do custo e do valor a cobrar."
      />

      <div className="mt-6">
        <NavDoConsumo />
      </div>

      {resultado.success ? (
        <ParametrosDeCobranca inicial={resultado.data} />
      ) : (
        <AvisoDeErro mensagem={resultado.error} />
      )}
    </div>
  );
}
