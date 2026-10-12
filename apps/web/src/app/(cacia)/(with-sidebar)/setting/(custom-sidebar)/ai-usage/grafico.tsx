"use client"

import type { ConsumoDoDia } from "@/http/crm/consumo-de-ia"
import {
  alturaDaBarra,
  escalaDoGrafico,
  formatarData,
  formatarReais,
  passoDosRotulos,
  rotuloDoDia,
} from "@/utils/consumo-de-ia"

/**
 * Barras verticais do consumo diário, em divs.
 *
 * A aplicação não tem biblioteca de gráficos, e uma série só de barras não
 * justifica trazer uma. O eixo Y fica fora da área rolável: no celular as
 * barras rolam de lado e a escala continua à vista.
 */
export function GraficoPorDia({ dias }: { dias: ConsumoDoDia[] }) {
  const maximo = Math.max(0, ...dias.map((d) => d.valor))
  const { topo, marcas } = escalaDoGrafico(maximo)
  const passo = passoDosRotulos(dias.length)

  // Largura mínima por dia: abaixo disso o rótulo do dia não cabe e a barra
  // vira um fio. Períodos longos aceitam barras finas, os rótulos já são
  // espaçados por semana ou mês.
  const larguraMinima = dias.length * (dias.length <= 31 ? 22 : 6)

  const maiorDia = dias.reduce<ConsumoDoDia | null>(
    (maior, dia) => (dia.valor > (maior?.valor ?? 0) ? dia : maior),
    null
  )

  return (
    <section className="flex flex-col">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="rotulo">Consumo por dia</h3>

        {maiorDia && (
          <p className="text-xs text-tinta-3">
            Maior dia: {formatarData(maiorDia.dia)} ·{" "}
            <span className="font-medium text-tinta">
              {formatarReais(maiorDia.valor)}
            </span>
          </p>
        )}
      </div>

      <div className="mt-4 flex">
        {/* Eixo Y — o pt-8 casa com o espaço reservado às dicas das barras */}
        <div className="relative w-16 shrink-0 pt-8">
          <div className="relative h-52">
            {marcas.map((marca) => (
              <span
                key={marca}
                className="absolute right-2 translate-y-1/2 text-[10px] text-tinta-3 whitespace-nowrap"
                style={{ bottom: `${topo > 0 ? (marca / topo) * 100 : 0}%` }}
              >
                {formatarReais(marca)}
              </span>
            ))}
          </div>
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto pt-8">
          <div style={{ minWidth: larguraMinima }}>
            <div className="relative h-52 border-b border-filete">
              {marcas.slice(1).map((marca) => (
                <div
                  key={marca}
                  className="absolute inset-x-0 border-t border-dashed border-filete"
                  style={{ bottom: `${(marca / topo) * 100}%` }}
                />
              ))}

              <div className="relative flex h-full items-end gap-[2px]">
                {dias.map((dia) => {
                  const altura = alturaDaBarra(dia.valor, topo)
                  const descricao = `${formatarData(dia.dia)}: ${formatarReais(dia.valor)}`

                  return (
                    <div
                      key={dia.dia}
                      aria-label={descricao}
                      className="group relative flex h-full flex-1 items-end justify-center"
                    >
                      <div
                        className="w-full max-w-[20px] rounded-t-md bg-acao transition-colors group-hover:bg-acao-escura"
                        style={{ height: `${altura}%` }}
                      />

                      <span
                        className="pointer-events-none absolute left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-grafite px-2 py-1 text-[11px] text-white shadow group-hover:block"
                        style={{ bottom: `calc(${altura}% + 6px)` }}
                      >
                        {descricao}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-1.5 flex gap-[2px]">
              {dias.map((dia, indice) => (
                <span
                  key={dia.dia}
                  className="flex-1 text-center text-[10px] text-tinta-3 whitespace-nowrap"
                >
                  {indice % passo === 0
                    ? rotuloDoDia(dia.dia, dias.length)
                    : ""}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
