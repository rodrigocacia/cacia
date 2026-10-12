"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";

import { CalendarDays } from "lucide-react";

import {
  ehData,
  formatarData,
  tipoDePeriodo,
  type TipoDePeriodo,
} from "@/utils/consumo-ia";

const OPCOES: { valor: TipoDePeriodo; rotulo: string }[] = [
  { valor: "mes-atual", rotulo: "Mês atual" },
  { valor: "mes-passado", rotulo: "Mês passado" },
  { valor: "personalizado", rotulo: "Personalizado" },
];

const CAMPO_DE_DATA =
  "h-9 rounded-[9px] border border-filete-forte bg-white px-3 text-[13px] text-tinta outline-none transition-[border-color,box-shadow] focus:border-acao focus:shadow-[0_0_0_3px_#D7EBEE]";

/**
 * Período do relatório, guardado na URL (`?periodo=&de=&ate=`): a página é
 * renderizada no servidor a partir dela, e o link copiado abre o mesmo
 * recorte — útil para conferir a cobrança de um mês depois.
 *
 * `periodo` é o intervalo que a API de fato usou, para mostrar as datas e
 * preencher o personalizado.
 */
export function SeletorDePeriodo({
  periodo,
}: {
  periodo: { de: string; ate: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendente, iniciar] = useTransition();

  const tipoNaUrl = tipoDePeriodo(searchParams.get("periodo") ?? undefined);
  const [tipo, setTipo] = useState<TipoDePeriodo>(tipoNaUrl);
  const [de, setDe] = useState(periodo.de);
  const [ate, setAte] = useState(periodo.ate);
  const [erro, setErro] = useState<string | null>(null);

  function navegar(params: Record<string, string>) {
    iniciar(() => {
      router.push(`${pathname}?${new URLSearchParams(params).toString()}`);
    });
  }

  function escolher(novo: TipoDePeriodo) {
    setTipo(novo);
    setErro(null);

    // O personalizado só consulta ao aplicar, com as duas datas escolhidas
    if (novo !== "personalizado") navegar({ periodo: novo });
  }

  function aplicar() {
    if (!ehData(de) || !ehData(ate)) {
      setErro("Informe as duas datas.");
      return;
    }

    if (de > ate) {
      setErro("A data inicial precisa ser anterior à final.");
      return;
    }

    setErro(null);
    navegar({ periodo: "personalizado", de, ate });
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
        <div
          role="group"
          aria-label="Período do relatório"
          className="flex gap-0.5 rounded-[9px] border border-filete bg-[#F1EEE8] p-[3px]"
        >
          {OPCOES.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              aria-pressed={tipo === opcao.valor}
              onClick={() => escolher(opcao.valor)}
              className={clsx(
                "h-7 cursor-pointer rounded-[7px] px-3 text-[12.5px] whitespace-nowrap transition-colors",
                tipo === opcao.valor
                  ? "bg-white font-semibold text-tinta shadow-[0_1px_2px_rgba(21,19,17,0.08)]"
                  : "font-medium text-tinta-3 hover:text-tinta",
              )}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>

        {tipo === "personalizado" && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              aria-label="Data inicial"
              value={de}
              max={ate || undefined}
              onChange={(e) => setDe(e.target.value)}
              className={CAMPO_DE_DATA}
            />
            <span className="text-[13px] text-tinta-3">até</span>
            <input
              type="date"
              aria-label="Data final"
              value={ate}
              min={de || undefined}
              onChange={(e) => setAte(e.target.value)}
              className={CAMPO_DE_DATA}
            />
            <button
              type="button"
              onClick={aplicar}
              className="h-9 cursor-pointer rounded-[9px] bg-acao px-3.5 text-[13px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-colors hover:bg-acao-escura"
            >
              Aplicar
            </button>
          </div>
        )}

        <span className="flex items-center gap-1.5 font-mono text-[12px] text-tinta-3 tabular">
          <CalendarDays size={14} strokeWidth={1.7} aria-hidden />
          {formatarData(periodo.de)} a {formatarData(periodo.ate)}
          {pendente && (
            <span
              role="status"
              aria-label="Carregando"
              className="ml-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-acao border-t-transparent"
            />
          )}
        </span>
      </div>

      {erro && (
        <p role="alert" className="text-[12.5px] font-medium text-[#A23B2A]">
          {erro}
        </p>
      )}
    </div>
  );
}
