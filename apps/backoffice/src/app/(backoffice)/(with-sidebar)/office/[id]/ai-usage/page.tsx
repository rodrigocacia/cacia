import { Suspense } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

import { CustomTab } from "@/components/ui/custom-tab";
import { LoadingText } from "@/components/ui/sppiner";
import { TableCard } from "@/components/ui/table-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CartaoDeValor,
  FaixaDeIndicadores,
} from "@/components/consumo-ia/cartao-de-valor";
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
    // `contain` impede que a tabela larga empurre a coluna da grade do
    // layout: ela rola dentro do próprio cartão
    <div className="w-full min-w-0 [contain:inline-size]">
      <div className="mb-6 md:hidden">
        <CustomTab tabs={tabs(officeId)} />
      </div>

      <section className="flex w-full flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-[14.5px] font-semibold text-tinta">
            Consumo de IA
          </h2>
          <p className="text-[13px] text-tinta-3">
            Custo da IA deste escritório, quanto cobrar e onde o consumo
            acontece.
          </p>
        </div>

        {resultado.success ? (
          <Relatorio dados={resultado.data} />
        ) : (
          <p
            role="alert"
            className="rounded-[14px] border border-filete bg-white px-5 py-10 text-center text-[13.5px] text-tinta-3"
          >
            {resultado.error}
          </p>
        )}
      </section>
    </div>
  );
}

function Variacao({ dados }: { dados: GetOfficeAiUsageResponse }) {
  const variacao = dados.variacao_percentual;

  if (variacao === null) {
    return <>Sem consumo no período anterior para comparar</>;
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-x-1">
      <span
        className={
          variacao > 0
            ? "inline-flex items-center gap-0.5 font-semibold text-turquesa-profundo"
            : "inline-flex items-center gap-0.5 font-semibold text-tinta-2"
        }
      >
        {variacao > 0 ? (
          <ArrowUp size={13} strokeWidth={2} aria-hidden />
        ) : variacao < 0 ? (
          <ArrowDown size={13} strokeWidth={2} aria-hidden />
        ) : null}
        {variacao > 0 ? "+" : ""}
        {formatarPercentual(variacao)}
      </span>
      vs. período anterior ({formatarReais(dados.total_anterior.cobrado)})
    </span>
  );
}

function Relatorio({ dados }: { dados: GetOfficeAiUsageResponse }) {
  // Sem resposta no período, a média não existe — não é "R$ 0,00"
  const temRespostas = dados.respostas_da_ia > 0;

  return (
    <div className="flex w-full flex-col gap-5">
      <Suspense fallback={<LoadingText />}>
        <SeletorDePeriodo
          key={`${dados.periodo.de}-${dados.periodo.ate}`}
          periodo={dados.periodo}
        />
      </Suspense>

      <FaixaDeIndicadores
        rotulo="Números do período"
        className="grid-cols-2 xl:grid-cols-3"
      >
        <CartaoDeValor
          rotulo="Valor a cobrar"
          valor={formatarReais(dados.total.cobrado)}
          detalhe={<Variacao dados={dados} />}
        />
        <CartaoDeValor
          rotulo="Custo"
          valor={formatarReais(dados.total.custo)}
          detalhe={`Margem de ${formatarPercentual(dados.margem_percentual)}`}
        />
        <CartaoDeValor
          rotulo="Conversas atendidas"
          valor={formatarInteiro(dados.conversas_atendidas)}
        />
        <CartaoDeValor
          rotulo="Respostas da IA"
          valor={formatarInteiro(dados.respostas_da_ia)}
        />
        <CartaoDeValor
          rotulo="Valor médio por resposta"
          valor={
            temRespostas
              ? formatarReais(dados.valor_medio_por_resposta.cobrado)
              : null
          }
          detalhe={
            temRespostas
              ? `Custo médio: ${formatarReais(dados.valor_medio_por_resposta.custo)}`
              : "Sem respostas no período"
          }
        />
        <CartaoDeValor
          rotulo="Atendidas pela reserva"
          valor={formatarInteiro(dados.chamadas_na_reserva)}
          detalhe="Chamadas que a IA reserva respondeu porque a principal falhou"
        />
      </FaixaDeIndicadores>

      <section className="overflow-hidden rounded-[14px] border border-filete bg-white">
        <div className="border-b border-filete px-5 py-3.5">
          <h3 className="text-[14.5px] font-semibold tracking-[-0.01em] text-tinta">
            Onde o consumo acontece
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3">
          {dados.categorias.map((categoria) => (
            <div
              key={categoria.chave}
              className="flex min-w-0 flex-col gap-3.5 border-filete px-5 py-5 not-last:border-b lg:not-last:border-r lg:not-last:border-b-0"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[13.5px] font-semibold text-tinta">
                    {categoria.rotulo}
                  </span>
                  <span className="text-[12.5px] leading-snug text-tinta-3">
                    {categoria.descricao}
                  </span>
                </div>
                <span className="tabular font-mono text-[13px] font-medium text-tinta">
                  {formatarPercentual(categoria.percentual)}
                </span>
              </div>

              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-[#F1EEE8]"
                role="presentation"
              >
                <div
                  className="h-full rounded-full bg-acao"
                  style={{
                    width: `${Math.min(100, Math.max(0, categoria.percentual))}%`,
                  }}
                />
              </div>

              <dl className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <dt className="rotulo">Cobrado</dt>
                  <dd className="tabular text-[13px] font-semibold text-tinta">
                    {formatarReais(categoria.cobrado)}
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="rotulo">Custo</dt>
                  <dd className="tabular text-[13px] text-tinta-2">
                    {formatarReais(categoria.custo)}
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="rotulo">Chamadas</dt>
                  <dd className="tabular text-[13px] text-tinta-2">
                    {formatarInteiro(categoria.chamadas)}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[14px] border border-filete bg-white">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-filete px-5 py-3.5">
          <h3 className="text-[14.5px] font-semibold tracking-[-0.01em] text-tinta">
            Valor a cobrar por dia
          </h3>
          <span className="text-[12.5px] text-tinta-3">
            Passe o mouse para ver o custo
          </span>
        </div>
        <div className="px-3 pt-4 pb-3">
          <GraficoPorDia dias={dados.por_dia} />
        </div>
      </section>

      <TableCard>
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 border-b border-filete px-5 py-3.5">
          <h3 className="text-[14.5px] font-semibold tracking-[-0.01em] text-tinta">
            Por modelo
          </h3>
          <span className="font-mono text-[11px] text-tinta-3 tabular">
            {dados.por_modelo.length}
          </span>
          <span className="flex-grow" />
          <span className="text-[12.5px] text-tinta-3">
            Entrada, em cache e saída em tokens
          </span>
        </div>

        {dados.por_modelo.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13.5px] text-tinta-3">
            Nenhuma chamada de IA no período.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provedor</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead className="text-right">Chamadas</TableHead>
                <TableHead className="text-right">Entrada</TableHead>
                <TableHead className="text-right">Em cache</TableHead>
                <TableHead className="text-right">Saída</TableHead>
                <TableHead className="text-right">Custo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dados.por_modelo.map((modelo) => (
                <TableRow
                  key={`${modelo.provedor}:${modelo.modelo}:${modelo.sem_preco}`}
                >
                  <TableCell className="text-tinta-3">
                    {modelo.provedor}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[13px] text-tinta">
                        {modelo.modelo}
                      </span>
                      {modelo.sem_preco && <SeloSemPreco />}
                    </div>
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {formatarInteiro(modelo.chamadas)}
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {formatarInteiro(modelo.tokens_entrada)}
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {formatarInteiro(modelo.tokens_em_cache)}
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {formatarInteiro(modelo.tokens_saida)}
                  </TableCell>
                  <TableCell className="tabular text-right font-semibold text-tinta">
                    {/* Sem preço cadastrado o custo entrou como zero: não
                        é o custo real, então não mostra "R$ 0,00" */}
                    {modelo.sem_preco ? (
                      <span className="inline-flex flex-col items-end leading-tight">
                        <span className="text-tinta-3">—</span>
                        <span className="text-[11.5px] font-normal text-tinta-3">
                          sem preço
                        </span>
                      </span>
                    ) : (
                      formatarReais(modelo.custo)
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableCard>
    </div>
  );
}
