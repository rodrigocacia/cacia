import { Suspense } from "react";
import Link from "next/link";

import { Icon } from "@/components/icone";
import { Header } from "@/components/header";
import { Breadcrumbs } from "@/components/ui/custom-breadcrumb";
import { LoadingText } from "@/components/ui/sppiner";
import { CartaoDeValor } from "@/components/consumo-ia/cartao-de-valor";
import { NavDoConsumo } from "@/components/consumo-ia/nav-do-consumo";
import { SeletorDePeriodo } from "@/components/consumo-ia/seletor-de-periodo";

import { aiUsageCrumbs } from "@/constants/breadcrumbs";
import { getAiUsage } from "@/http/ai-usage/get-ai-usage";
import {
  formatarPercentual,
  formatarReais,
  hojeEmBrasilia,
  intervaloDoPeriodo,
  tipoDePeriodo,
} from "@/utils/consumo-ia";

import { TabelaDeConsumo } from "./tabela-de-consumo";

function queryDaPagina(params: Record<string, string | undefined>) {
  const definidos = Object.entries(params).filter(
    (par): par is [string, string] => !!par[1],
  );

  return definidos.length > 0
    ? `?${new URLSearchParams(definidos).toString()}`
    : "";
}

export default async function ConsumoDeIa({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; de?: string; ate?: string }>;
}) {
  const { periodo, de, ate } = await searchParams;

  const resultado = await getAiUsage(
    intervaloDoPeriodo(tipoDePeriodo(periodo), hojeEmBrasilia(), { de, ate }),
  );

  return (
    <div className="w-full h-full max-lg:px-4">
      <Header title="Consumo de IA" />

      <Breadcrumbs crumbs={aiUsageCrumbs} />

      <NavDoConsumo />

      {!resultado.success ? (
        <div className="w-full mt-6 p-8 bg-white rounded-2xl shadow-sm flex items-center gap-3">
          <Icon icon="mdi:alert-outline" className="text-[#BDBDBD] w-8 h-8" />
          <p className="text-base text-[#707070] font-medium">
            {resultado.error}
          </p>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-6 mt-6 pb-8">
          <Suspense fallback={<LoadingText />}>
            <SeletorDePeriodo
              key={`${resultado.data.periodo.de}-${resultado.data.periodo.ate}`}
              periodo={resultado.data.periodo}
            />
          </Suspense>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CartaoDeValor
              icon="mdi:cash-minus"
              rotulo="Custo total"
              valor={formatarReais(resultado.data.total.custo)}
              detalhe="Pago aos provedores de IA"
            />
            <CartaoDeValor
              icon="mdi:cash-plus"
              rotulo="Valor a cobrar"
              valor={formatarReais(resultado.data.total.cobrado)}
              detalhe="Custo + margem, somando todos os escritórios"
            />
            <CartaoDeValor
              icon="mdi:percent-outline"
              rotulo="Margem"
              valor={formatarPercentual(resultado.data.margem_percentual)}
              detalhe={
                <Link
                  href="/ai-usage/billing"
                  className="text-[#348C98] hover:underline"
                >
                  Alterar em Parâmetros de cobrança
                </Link>
              }
            />
          </div>

          <TabelaDeConsumo
            periodo={resultado.data.periodo}
            escritorios={resultado.data.escritorios}
            query={queryDaPagina({ periodo, de, ate })}
          />
        </div>
      )}
    </div>
  );
}
