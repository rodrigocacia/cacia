"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";

import { Icon } from "@/components/icone";
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
    <div className="w-full flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center bg-white shadow-sm rounded-full p-1">
          {OPCOES.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              onClick={() => escolher(opcao.valor)}
              className={clsx(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer",
                tipo === opcao.valor
                  ? "bg-[#ECF7F8] text-[#348C98]"
                  : "text-[#707070] hover:text-[#348C98]",
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
              className="bg-white shadow-sm rounded-full px-4 py-2 text-sm text-[#707070] outline-[#348C98]"
            />
            <span className="text-sm text-[#BDBDBD]">até</span>
            <input
              type="date"
              aria-label="Data final"
              value={ate}
              min={de || undefined}
              onChange={(e) => setAte(e.target.value)}
              className="bg-white shadow-sm rounded-full px-4 py-2 text-sm text-[#707070] outline-[#348C98]"
            />
            <button
              type="button"
              onClick={aplicar}
              className="px-4 py-2 rounded-full text-sm font-medium bg-[#348C98] text-white cursor-pointer"
            >
              Aplicar
            </button>
          </div>
        )}

        <span className="flex items-center gap-1.5 text-sm text-[#707070]">
          <Icon icon="mdi:calendar-month-outline" className="w-4 h-4" />
          {formatarData(periodo.de)} a {formatarData(periodo.ate)}
          {pendente && (
            <span className="ml-2 w-4 h-4 border-2 border-t-transparent border-[#348C98] rounded-full animate-spin" />
          )}
        </span>
      </div>

      {erro && <p className="text-xs font-medium text-red-500">{erro}</p>}
    </div>
  );
}
