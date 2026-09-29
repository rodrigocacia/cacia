import { Suspense } from "react";

import { Icon } from "@/components/icone";
import { CustomTab } from "@/components/ui/custom-tab";
import { LoadingText } from "@/components/ui/sppiner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CartaoDeValor } from "@/components/consumo-ia/cartao-de-valor";
import { SeletorDePeriodo } from "@/components/consumo-ia/seletor-de-periodo";
import { SeloSemPreco } from "@/components/consumo-ia/selo-sem-preco";

import {
  getOfficeAiUsage,
  type GetOfficeAiUsageResponse,
} from "@/http/ai-usage/get-office-ai-usage";
import {
  formatarInteiro,
  formatarPercentual,
  formatarReais,
  hojeEmBrasilia,
  intervaloDoPeriodo,
  tipoDePeriodo,
} from "@/utils/consumo-ia";

import { tabs } from "../components/tabs";
import { GraficoPorDia } from "./grafico-por-dia";

export default async function ConsumoDeIaDoEscritorio({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ periodo?: string; de?: string; ate?: string }>;
}) {
  const { id: officeId } = await params;
  const { periodo, de, ate } = await searchParams;

  const resultado = await getOfficeAiUsage(
    officeId,
    intervaloDoPeriodo(tipoDePeriodo(periodo), hojeEmBrasilia(), { de, ate }),
  );

  return (
    <div className="w-full h-full">
      <div className="md:hidden px-4 pt-4">
        <CustomTab tabs={tabs(officeId)} />
      </div>

      <div className="w-full bg-white rounded-2xl shadow p-4 mb-8 max-md:shadow-none">
        <div className="w-full flex items-center gap-3">
          <Icon icon="mdi:robot-outline" className="text-[#BDBDBD] w-8 h-8" />
          <h3 className="text-[20px] text-[#707070] font-bold">
            Consumo de IA
          </h3>
        </div>

        <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200" />

        {resultado.success ? (
          <Relatorio dados={resultado.data} />
        ) : (
          <p className="text-sm text-[#707070] py-8 text-center">
            {resultado.error}
          </p>
        )}
      </div>
    </div>
  );
}

function Variacao({ dados }: { dados: GetOfficeAiUsageResponse }) {
  const variacao = dados.variacao_percentual;

  if (variacao === null) {
    return <>Sem consumo no período anterior para comparar</>;
  }

  return (
    <span className="inline-flex items-center gap-0.5">
      {variacao > 0 ? (
        <Icon icon="mdi:arrow-up" className="w-3.5 h-3.5 text-[#348C98]" />
      ) : variacao < 0 ? (
        <Icon icon="mdi:arrow-down" className="w-3.5 h-3.5 text-[#707070]" />
      ) : null}
      {variacao > 0 ? "+" : ""}
      {formatarPercentual(variacao)} vs. período anterior (
      {formatarReais(dados.total_anterior.cobrado)})
    </span>
  );
}

function Relatorio({ dados }: { dados: GetOfficeAiUsageResponse }) {
  return (
    <div className="w-full flex flex-col gap-6">
      <Suspense fallback={<LoadingText />}>
        <SeletorDePeriodo
          key={`${dados.periodo.de}-${dados.periodo.ate}`}
          periodo={dados.periodo}
        />
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <CartaoDeValor
          icon="mdi:cash-plus"
          rotulo="Valor a cobrar"
          valor={formatarReais(dados.total.cobrado)}
          detalhe={<Variacao dados={dados} />}
        />
        <CartaoDeValor
          icon="mdi:cash-minus"
          rotulo="Custo"
          valor={formatarReais(dados.total.custo)}
          detalhe={`Margem de ${formatarPercentual(dados.margem_percentual)}`}
        />
        <CartaoDeValor
          icon="mdi:forum-outline"
          rotulo="Conversas atendidas"
          valor={formatarInteiro(dados.conversas_atendidas)}
        />
        <CartaoDeValor
          icon="mdi:message-reply-text-outline"
          rotulo="Respostas da IA"
          valor={formatarInteiro(dados.respostas_da_ia)}
        />
        <CartaoDeValor
          icon="mdi:calculator-variant-outline"
          rotulo="Valor médio por resposta"
          valor={formatarReais(dados.valor_medio_por_resposta.cobrado)}
          detalhe={`Custo médio: ${formatarReais(dados.valor_medio_por_resposta.custo)}`}
        />
        <CartaoDeValor
          icon="mdi:backup-restore"
          rotulo="Chamadas atendidas pela reserva"
          valor={formatarInteiro(dados.chamadas_na_reserva)}
          detalhe="Pedidos que a IA reserva respondeu porque a principal falhou"
        />
      </div>

      <section className="flex flex-col gap-3">
        <h4 className="text-base text-[#3D3D3D] font-bold">
          Onde o consumo acontece
        </h4>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {dados.categorias.map((categoria) => (
            <div
              key={categoria.chave}
              className="bg-white rounded-xl p-5 shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#3D3D3D]">
                    {categoria.rotulo}
                  </span>
                  <span className="text-xs text-[#707070]">
                    {categoria.descricao}
                  </span>
                </div>
                <span className="text-sm font-bold text-[#348C98] tabular-nums">
                  {formatarPercentual(categoria.percentual)}
                </span>
              </div>

              <div
                className="w-full h-2 rounded-full bg-[#F0F0F0] overflow-hidden"
                role="presentation"
              >
                <div
                  className="h-full rounded-full bg-[#348C98]"
                  style={{
                    width: `${Math.min(100, Math.max(0, categoria.percentual))}%`,
                  }}
                />
              </div>

              <dl className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex flex-col">
                  <dt className="text-[#BDBDBD]">Cobrado</dt>
                  <dd className="text-[#3D3D3D] font-semibold tabular-nums">
                    {formatarReais(categoria.cobrado)}
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-[#BDBDBD]">Custo</dt>
                  <dd className="text-[#707070] tabular-nums">
                    {formatarReais(categoria.custo)}
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-[#BDBDBD]">Chamadas</dt>
                  <dd className="text-[#707070] tabular-nums">
                    {formatarInteiro(categoria.chamadas)}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h4 className="text-base text-[#3D3D3D] font-bold">
          Valor a cobrar por dia
        </h4>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <GraficoPorDia dias={dados.por_dia} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h4 className="text-base text-[#3D3D3D] font-bold">Por modelo</h4>

        {dados.por_modelo.length === 0 ? (
          <p className="text-sm text-[#BDBDBD] py-4">
            Nenhuma chamada de IA no período.
          </p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm font-medium text-[#707070]">
                    Provedor
                  </TableHead>
                  <TableHead className="text-sm font-medium text-[#707070]">
                    Modelo
                  </TableHead>
                  <TableHead className="text-sm font-medium text-[#707070] text-right">
                    Chamadas
                  </TableHead>
                  <TableHead className="text-sm font-medium text-[#707070] text-right">
                    Tokens de entrada
                  </TableHead>
                  <TableHead className="text-sm font-medium text-[#707070] text-right">
                    Em cache
                  </TableHead>
                  <TableHead className="text-sm font-medium text-[#707070] text-right">
                    Tokens de saída
                  </TableHead>
                  <TableHead className="text-sm font-medium text-[#707070] text-right">
                    Custo
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dados.por_modelo.map((modelo) => (
                  <TableRow key={`${modelo.provedor}:${modelo.modelo}`}>
                    <TableCell className="text-sm text-[#707070]">
                      {modelo.provedor}
                    </TableCell>
                    <TableCell className="text-sm text-[#3D3D3D] font-medium">
                      <div className="flex flex-wrap items-center gap-2">
                        {modelo.modelo}
                        {modelo.sem_preco && <SeloSemPreco />}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[#707070] text-right tabular-nums">
                      {formatarInteiro(modelo.chamadas)}
                    </TableCell>
                    <TableCell className="text-sm text-[#707070] text-right tabular-nums">
                      {formatarInteiro(modelo.tokens_entrada)}
                    </TableCell>
                    <TableCell className="text-sm text-[#707070] text-right tabular-nums">
                      {formatarInteiro(modelo.tokens_em_cache)}
                    </TableCell>
                    <TableCell className="text-sm text-[#707070] text-right tabular-nums">
                      {formatarInteiro(modelo.tokens_saida)}
                    </TableCell>
                    <TableCell className="text-sm text-[#3D3D3D] font-semibold text-right tabular-nums">
                      {formatarReais(modelo.custo)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
