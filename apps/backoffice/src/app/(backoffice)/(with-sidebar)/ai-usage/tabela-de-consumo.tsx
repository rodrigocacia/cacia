"use client";

import Link from "next/link";

import { ChevronRight, Download } from "lucide-react";

import { EmptySearch } from "@/components/empty-search";
import { CustomAvatar } from "@/components/ui/custom-avatar";
import { SeloSemPreco } from "@/components/consumo-ia/selo-sem-preco";
import { StatusChip } from "@/components/ui/status-chip";
import { TableCard } from "@/components/ui/table-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { GetAiUsageResponse } from "@/http/ai-usage/get-ai-usage";
import {
  formatarInteiro,
  formatarReais,
  gerarCsvDeConsumo,
} from "@/utils/consumo-ia";
import { nomeParaExibir } from "@/utils/formatters";

interface TabelaDeConsumoProps {
  periodo: GetAiUsageResponse["periodo"];
  escritorios: GetAiUsageResponse["escritorios"];
  /** Query do período, repassada ao detalhe para abrir no mesmo recorte. */
  query: string;
}

export function TabelaDeConsumo({
  periodo,
  escritorios,
  query,
}: TabelaDeConsumoProps) {
  function exportar() {
    const csv = gerarCsvDeConsumo(
      escritorios.map((escritorio) => ({
        nome: escritorio.nome,
        removido: escritorio.removido,
        chamadas: escritorio.chamadas,
        tokens: escritorio.tokens,
        custo: escritorio.custo,
        cobrado: escritorio.cobrado,
        semPreco: escritorio.sem_preco,
      })),
    );

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `consumo-ia_${periodo.de}_a_${periodo.ate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <TableCard>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 border-b border-filete px-5 py-3.5">
        <h2 className="text-[14.5px] font-semibold tracking-[-0.01em] text-tinta">
          Escritórios no período
        </h2>
        <span className="font-mono text-[11px] text-tinta-3 tabular">
          {escritorios.length}
        </span>
        <span className="flex-grow" />
        <button
          type="button"
          onClick={exportar}
          disabled={escritorios.length === 0}
          className="flex h-9 cursor-pointer items-center gap-2 rounded-[9px] border border-filete-forte bg-white px-3 text-[13px] font-medium text-tinta transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={15} strokeWidth={1.7} aria-hidden />
          Exportar CSV
        </button>
      </div>

      {escritorios.length === 0 ? (
        <div className="px-5 pt-2 pb-12">
          <EmptySearch
            title="Nenhum consumo no período"
            subtitle="Nenhum escritório usou a IA entre as datas escolhidas."
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Escritório</TableHead>
              <TableHead className="text-right">Chamadas</TableHead>
              <TableHead className="text-right">Tokens</TableHead>
              <TableHead className="text-right">Custo</TableHead>
              <TableHead className="text-right">Valor a cobrar</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {escritorios.map((escritorio) => (
              <TableRow key={escritorio.office_id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <CustomAvatar name={escritorio.nome} size="sm" />
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span className="font-medium text-tinta">
                        {nomeParaExibir(escritorio.nome)}
                      </span>
                      {escritorio.removido && (
                        <StatusChip ponto="bg-gray-400">removido</StatusChip>
                      )}
                      {escritorio.sem_preco && <SeloSemPreco />}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="tabular text-right">
                  {formatarInteiro(escritorio.chamadas)}
                </TableCell>
                <TableCell className="tabular text-right">
                  {formatarInteiro(escritorio.tokens)}
                </TableCell>
                <TableCell className="tabular text-right">
                  {formatarReais(escritorio.custo)}
                </TableCell>
                <TableCell className="tabular text-right font-semibold text-tinta">
                  {formatarReais(escritorio.cobrado)}
                </TableCell>
                <TableCell className="text-right">
                  {/* Escritório removido não tem mais página de detalhe */}
                  {!escritorio.removido && (
                    <Link
                      href={`/office/${escritorio.office_id}/ai-usage${query}`}
                      aria-label={`Detalhes do consumo de ${nomeParaExibir(escritorio.nome)}`}
                      className="inline-flex items-center gap-1 text-[13px] font-medium text-turquesa-profundo hover:underline"
                    >
                      Detalhes
                      <ChevronRight size={15} strokeWidth={1.7} aria-hidden />
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </TableCard>
  );
}
