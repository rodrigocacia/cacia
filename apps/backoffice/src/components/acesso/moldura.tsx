import { ReactNode } from "react";
import { Building2, Lock } from "lucide-react";

import { SimboloCacia } from "@/components/app-sidebar";

/** Barras da prévia: só desenho, sem número inventado. */
const BARRAS = [38, 52, 44, 63, 58, 71, 66, 80, 74, 88, 82, 94];

/**
 * Moldura da tela de acesso do backoffice — a mesma das telas de acesso do
 * app do escritório: à esquerda, a marca e uma prévia do que se administra
 * aqui; à direita, o painel de papel com o formulário. No celular a prévia
 * some e a manchete encolhe para o topo.
 */
export function MolduraDeAcesso({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-ink p-2.5 max-lg:p-0">
      <div className="grid min-h-[calc(100svh-20px)] gap-2.5 max-lg:min-h-svh lg:grid-cols-[minmax(0,1fr)_560px]">
        <section className="relative flex flex-col justify-between overflow-hidden rounded-2xl px-14 pt-11 pb-12 text-[#F5F2ED] max-lg:gap-7 max-lg:rounded-none max-lg:px-6 max-lg:pt-12 max-lg:pb-10 lg:sticky lg:top-2.5 lg:h-[calc(100svh-20px)]">
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
            <span className="ml-1 rounded-md border border-ink-line px-2 py-0.5 font-mono text-[10.5px] tracking-[0.08em] text-gray-400">
              BACKOFFICE
            </span>
          </div>

          <div className="relative flex max-w-[640px] flex-col gap-[22px]">
            <span className="font-mono text-[11px] tracking-[0.1em] text-gray-500 max-lg:hidden">
              ADMINISTRAÇÃO DA PLATAFORMA
            </span>
            <h1 className="font-display text-[78px] leading-[0.96] tracking-[-0.035em] max-xl:text-[60px] max-lg:text-[42px]">
              Backoffice da <em className="text-turquesa-claro">CacIA.</em>
            </h1>
            <p className="max-w-[480px] text-base leading-relaxed text-gray-400 max-lg:hidden">
              Escritórios, usuários, consumo da assistente e cobrança — tudo o
              que mantém a plataforma de pé, num lugar só.
            </p>
          </div>

          <div className="relative h-[230px] max-lg:hidden" aria-hidden>
            <div className="absolute top-0 left-0 flex w-[380px] flex-col gap-3 rounded-[14px] border border-ink-line bg-ink-2 p-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10.5px] tracking-[0.08em] text-gray-500">
                  CONSUMO DA ASSISTENTE
                </span>
                <span className="ml-auto font-mono text-[10.5px] text-gray-600">
                  30 DIAS
                </span>
              </div>
              <div className="flex h-[92px] items-end gap-1.5">
                {BARRAS.map((altura, i) => (
                  <span
                    key={i}
                    className={
                      i === BARRAS.length - 1
                        ? "flex-1 rounded-[3px] bg-turquesa-claro"
                        : "flex-1 rounded-[3px] bg-ink-line"
                    }
                    style={{ height: `${altura}%` }}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-ink-line pt-2.5 text-[12px] text-gray-400">
                <span>Tokens por dia</span>
                <span className="font-mono text-[11px] text-gray-500">
                  por escritório
                </span>
              </div>
            </div>
            <div className="absolute top-[128px] left-[330px] flex w-[280px] items-center gap-3 rounded-[14px] bg-papel px-4 py-3.5 text-tinta shadow-[0_24px_48px_rgba(0,0,0,0.35)]">
              <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-nevoa text-turquesa-profundo">
                <Building2 size={17} strokeWidth={1.8} />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold">
                  Escritório ativado
                </span>
                <span className="tabular text-xs text-tinta-3">
                  Plano Beta · acesso liberado
                </span>
              </span>
            </div>
          </div>
        </section>

        <section className="flex flex-col rounded-2xl bg-papel px-[72px] py-11 max-xl:px-12 max-lg:-mt-5 max-lg:rounded-t-[22px] max-lg:rounded-b-none max-lg:px-6 max-lg:py-8">
          <div className="flex flex-grow flex-col justify-center py-8">
            {children}
          </div>

          <div className="flex items-center gap-2.5 border-t border-filete pt-5 text-[12.5px] text-tinta-3">
            <Lock size={15} strokeWidth={1.7} className="shrink-0" />
            <span className="flex-grow">
              Acesso restrito à administração da plataforma.
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
