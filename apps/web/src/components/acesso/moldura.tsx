import { ReactNode } from "react"
import { Check, Lock } from "lucide-react"

import { SimboloCacia } from "@/components/app-sidebar"

/**
 * Moldura das telas de acesso (entrar, criar conta, recuperar a senha).
 *
 * À esquerda, a marca: a promessa do produto e uma prévia do que ele faz —
 * uma conversa atendida e a consulta que saiu dela. À direita, o painel de
 * papel com o formulário. No celular a prévia some e a manchete encolhe
 * para o topo, para o formulário aparecer sem rolar.
 */
export function MolduraDeAcesso({
  children,
  topo,
}: {
  children: ReactNode
  /** Linha do canto superior direito do painel (ex.: "Novo por aqui?"). */
  topo?: ReactNode
}) {
  return (
    <div className="min-h-svh bg-ink p-2.5 max-lg:p-0">
      <div className="grid min-h-[calc(100svh-20px)] gap-2.5 max-lg:min-h-svh lg:grid-cols-[minmax(0,1fr)_600px]">
        {/* Presa ao topo no computador: o cadastro é longo, e o painel da
            marca não pode esticar junto e empurrar a prévia para fora. */}
        <section className="relative flex flex-col justify-between overflow-hidden rounded-2xl px-14 pt-11 pb-12 text-[#F5F2ED] max-lg:gap-7 max-lg:rounded-none max-lg:px-6 max-lg:pt-12 max-lg:pb-8 lg:sticky lg:top-2.5 lg:h-[calc(100svh-20px)]">
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full max-lg:hidden"
            aria-hidden
          >
            <line
              x1="0"
              y1="72%"
              x2="100%"
              y2="72%"
              stroke="#FFFFFF"
              strokeOpacity="0.05"
            />
            <line
              x1="0"
              y1="81%"
              x2="100%"
              y2="81%"
              stroke="#FFFFFF"
              strokeOpacity="0.05"
            />
            <line
              x1="0"
              y1="90%"
              x2="100%"
              y2="90%"
              stroke="#FFFFFF"
              strokeOpacity="0.05"
            />
            <line
              x1="68%"
              y1="0"
              x2="68%"
              y2="100%"
              stroke="#FFFFFF"
              strokeOpacity="0.04"
            />
          </svg>

          <div className="relative flex items-center gap-2.5">
            <SimboloCacia tamanho={30} />
            <span className="text-[15px] font-semibold tracking-[-0.01em]">
              CacIA
            </span>
          </div>

          <div className="relative flex max-w-[640px] flex-col gap-[22px]">
            <span className="font-mono text-[11px] tracking-[0.1em] text-gray-500 max-lg:hidden">
              PARA ESCRITÓRIOS DE ADVOCACIA
            </span>
            <h1 className="font-display text-[78px] leading-[0.96] tracking-[-0.035em] max-xl:text-[60px] max-lg:text-[42px]">
              A advocacia que responde no{" "}
              <em className="text-turquesa-claro">primeiro minuto.</em>
            </h1>
            <p className="max-w-[480px] text-base leading-relaxed text-gray-400 max-lg:hidden">
              A assistente atende pelo WhatsApp, entende o caso, agenda a
              consulta e entrega o lead pronto no seu funil.
            </p>
          </div>

          <div className="relative h-[250px] max-lg:hidden" aria-hidden>
            <div className="absolute top-0 left-0 flex w-[380px] flex-col gap-2.5 rounded-[14px] border border-ink-line bg-ink-2 p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2E2A26] text-[10px] font-semibold text-[#E8E3DB]">
                  MO
                </span>
                <span className="text-[12.5px] font-semibold">
                  Maria Oliveira
                </span>
                <span className="ml-auto font-mono text-[10.5px] text-gray-600">
                  02:14
                </span>
              </div>
              <span className="max-w-[300px] self-start rounded-[12px_12px_12px_4px] bg-ink-line px-3 py-2 text-[13px] leading-[1.45] text-[#E8E3DB]">
                Fui demitida e não recebi a rescisão. Vocês atendem hoje?
              </span>
              <span className="max-w-[300px] self-end rounded-[12px_12px_4px_12px] bg-[#173E43] px-3 py-2 text-[13px] leading-[1.45] text-[#E4F3F5]">
                Atendemos, sim. Tenho um horário amanhã às 9h30. Posso reservar?
              </span>
            </div>
            <div className="absolute top-[138px] left-[330px] flex w-[300px] items-center gap-3 rounded-[14px] bg-papel px-4 py-3.5 text-tinta shadow-[0_24px_48px_rgba(0,0,0,0.35)]">
              <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-nevoa text-turquesa-profundo">
                <Check size={17} strokeWidth={2} />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold">
                  Consulta agendada
                </span>
                <span className="tabular text-xs text-tinta-3">
                  Qua · 09:30 · Trabalhista
                </span>
              </span>
            </div>
          </div>
        </section>

        <section className="flex flex-col rounded-2xl bg-papel px-[72px] py-11 max-xl:px-12 max-lg:-mt-5 max-lg:rounded-b-none max-lg:rounded-t-[22px] max-lg:px-6 max-lg:py-8">
          {topo && (
            <div className="flex justify-end text-[13.5px] text-tinta-2">
              {topo}
            </div>
          )}

          <div className="flex flex-grow flex-col justify-center py-8">
            {children}
          </div>

          <div className="flex items-center gap-2.5 border-t border-filete pt-5 text-[12.5px] text-tinta-3">
            <Lock size={15} strokeWidth={1.7} className="shrink-0" />
            <span className="flex-grow">
              Dados isolados por escritório. Documentos só abrem por link
              temporário.
            </span>
            <a href="/termos" className="text-tinta-3 hover:text-tinta">
              Termos
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
