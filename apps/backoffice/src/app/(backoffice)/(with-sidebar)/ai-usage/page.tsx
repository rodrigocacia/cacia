import { Suspense } from "react";
import Link from "next/link";

import { Header } from "@/components/header";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingText } from "@/components/ui/sppiner";
import { AvisoDeErro } from "@/components/consumo-ia/aviso-de-erro";
import {
  CartaoDeValor,
  FaixaDeIndicadores,
} from "@/components/consumo-ia/cartao-de-valor";
import { NavDoConsumo } from "@/components/consumo-ia/nav-do-consumo";
import { SeletorDePeriodo } from "@/components/consumo-ia/seletor-de-periodo";

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
    <div className="flex w-full flex-col pb-10">
      <Header title="Consumo de IA" />

      <PageHeader
        title="Consumo de IA"
        description="Quanto a IA custou no período e quanto cobrar de cada escritório."
      />

      <div className="mt-6">
        <NavDoConsumo />
      </div>

      {!resultado.success ? (
        <AvisoDeErro mensagem={resultado.error} />
      ) : (
        <div className="mt-6 flex w-full flex-col gap-6">
          <Suspense fallback={<LoadingText />}>
            <SeletorDePeriodo
              key={`${resultado.data.periodo.de}-${resultado.data.periodo.ate}`}
              periodo={resultado.data.periodo}
            />
          </Suspense>

          <FaixaDeIndicadores
            rotulo="Totais do período"
            className="grid-cols-1 md:grid-cols-3"
          >
            <CartaoDeValor
              rotulo="Custo total"
              valor={formatarReais(resultado.data.total.custo)}
              detalhe="Pago aos provedores de IA"
            />
            <CartaoDeValor
              rotulo="Valor a cobrar"
              valor={formatarReais(resultado.data.total.cobrado)}
              detalhe="Custo + margem, somando todos os escritórios"
            />
            <CartaoDeValor
              rotulo="Margem"
              valor={formatarPercentual(resultado.data.margem_percentual)}
              detalhe={
                <Link
                  href="/ai-usage/billing"
                  className="font-medium text-turquesa-profundo hover:underline"
                >
                  Alterar em Parâmetros de cobrança
                </Link>
              }
            />
          </FaixaDeIndicadores>

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
