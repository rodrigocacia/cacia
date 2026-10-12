import { ReactNode } from "react"
import clsx from "clsx"
import { Check, Settings2 } from "lucide-react"

import { SimboloCacia } from "@/components/app-sidebar"

import { PASSOS_DO_ONBOARDING, TOTAL_DE_PASSOS, numeroDoPasso } from "./passos"

/**
 * Moldura do onboarding — a mesma linguagem das telas de acesso.
 *
 * À esquerda, o painel de tinta com a marca, a manchete da etapa e a lista
 * das etapas (a atual em destaque, as já feitas com um visto). À direita, o
 * painel de papel com o formulário. No celular a lista some: o painel escuro
 * encolhe para o topo com a manchete e uma barra de progresso.
 *
 * `passo` segue o useOnboardingStore: 0 é a boas-vindas, 1..8 são as etapas.
 */
export function MolduraDeOnboarding({
  passo,
  manchete,
  children,
}: {
  passo: number
  /** Substitui a manchete padrão da etapa (ex.: QR Code já gerado). */
  manchete?: { inicio: string; destaque: string }
  children: ReactNode
}) {
  const atual = passo - 1
  const etapa = PASSOS_DO_ONBOARDING[atual]
  const texto = manchete ??
    etapa?.manchete ?? {
      inicio: "Preparado para o que",
      destaque: "vem por aí?",
    }

  return (
    <div className="min-h-svh bg-ink p-2.5 max-lg:p-0">
      <div className="grid min-h-[calc(100svh-20px)] gap-2.5 max-lg:min-h-svh lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[460px_minmax(0,1fr)]">
        <section className="relative flex flex-col gap-10 overflow-hidden rounded-2xl px-11 pt-11 pb-10 text-[#F5F2ED] max-lg:gap-6 max-lg:rounded-none max-lg:px-6 max-lg:pt-10 max-lg:pb-11 lg:sticky lg:top-2.5 lg:h-[calc(100svh-20px)]">
          <div className="relative flex items-center gap-2.5">
            <SimboloCacia tamanho={30} />
            <span className="text-[15px] font-semibold tracking-[-0.01em]">
              CacIA
            </span>
            {passo > 0 && (
              <span className="ml-auto font-mono text-[11px] tracking-[0.1em] text-gray-500 tabular lg:hidden">
                {numeroDoPasso(atual)} /{" "}
                {String(TOTAL_DE_PASSOS).padStart(2, "0")}
              </span>
            )}
          </div>

          <div className="relative flex flex-col gap-4">
            <span className="font-mono text-[11px] tracking-[0.1em] text-gray-500 max-lg:hidden">
              PRIMEIROS PASSOS
            </span>
            <p className="font-display text-[46px] leading-[1] tracking-[-0.03em] max-xl:text-[40px] max-lg:text-[32px]">
              {texto.inicio}{" "}
              <em className="text-turquesa-claro">{texto.destaque}</em>
            </p>
          </div>

          {/* Celular: barra de progresso no lugar da lista */}
          {passo > 0 && (
            <div className="relative flex gap-1 lg:hidden" aria-hidden>
              {PASSOS_DO_ONBOARDING.map((p, i) => (
                <span
                  key={p.nome}
                  className={clsx(
                    "h-1 flex-1 rounded-full",
                    i <= atual ? "bg-turquesa-claro" : "bg-ink-line"
                  )}
                />
              ))}
            </div>
          )}

          <ol
            aria-label="Etapas da configuração"
            className="relative mt-auto flex flex-col max-lg:hidden"
          >
            {PASSOS_DO_ONBOARDING.map((p, i) => {
              const feito = i < atual
              const corrente = i === atual

              return (
                <li
                  key={p.nome}
                  aria-current={corrente ? "step" : undefined}
                  className={clsx(
                    "flex items-center gap-3.5 border-t border-ink-line py-[9px] text-[14px] transition-colors",
                    corrente
                      ? "text-[#F5F2ED]"
                      : feito
                        ? "text-gray-400"
                        : "text-gray-500"
                  )}
                >
                  <span
                    className={clsx(
                      "w-6 font-mono text-[11px] tabular",
                      corrente ? "text-turquesa-claro" : "text-gray-600"
                    )}
                  >
                    {numeroDoPasso(i)}
                  </span>
                  <span className={clsx("flex-1", corrente && "font-semibold")}>
                    {p.nome}
                  </span>
                  {feito && (
                    <Check
                      size={15}
                      strokeWidth={2}
                      className="text-turquesa-claro"
                      aria-label="concluída"
                    />
                  )}
                  {corrente && (
                    <span className="h-1.5 w-1.5 rounded-full bg-turquesa-claro" />
                  )}
                </li>
              )
            })}
          </ol>
        </section>

        <section className="flex min-w-0 flex-col rounded-2xl bg-papel px-14 py-11 max-xl:px-10 max-lg:-mt-5 max-lg:rounded-b-none max-lg:rounded-t-[22px] max-lg:px-5 max-lg:py-8">
          <div className="mx-auto flex w-full max-w-[760px] flex-grow flex-col">
            {children}
          </div>

          <div className="mx-auto mt-10 flex w-full max-w-[760px] items-center gap-2.5 border-t border-filete pt-5 text-[12.5px] text-tinta-3">
            <Settings2 size={15} strokeWidth={1.7} className="shrink-0" />
            <span className="flex-grow">
              Você pode mudar tudo isso depois, em Configurações.
            </span>
          </div>
        </section>
      </div>
    </div>
  )
}
