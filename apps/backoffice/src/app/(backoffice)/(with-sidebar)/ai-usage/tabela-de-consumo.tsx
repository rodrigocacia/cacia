"use client";

import Link from "next/link";

import { Icon } from "@/components/icone";
import { EmptySearch } from "@/components/empty-search";
import { CustomAvatar } from "@/components/ui/custom-avatar";
import { SeloSemPreco } from "@/components/consumo-ia/selo-sem-preco";
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
import { formatName } from "@/utils/formatters";

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
    <div className="w-full flex flex-col gap-3">
      <div className="w-full flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon
            icon="mdi:office-building-outline"
            className="text-[#BDBDBD] w-7 h-7"
          />
          <h3 className="text-[18px] text-[#3D3D3D] font-bold">
            Escritórios no período
          </h3>
          <div className="w-7 h-7 flex items-center justify-center bg-[#E0E6EB] rounded-full">
            <span className="text-base text-[#707070] font-bold">
              {escritorios.length}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={exportar}
          disabled={escritorios.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm text-sm font-medium text-[#348C98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon icon="mdi:file-excel" className="w-5 h-5" />
          Exportar CSV
        </button>
      </div>

      {escritorios.length === 0 ? (
        <EmptySearch
          title="Nenhum consumo no período"
          subtitle="Nenhum escritório usou a IA entre as datas escolhidas."
        />
      ) : (
        <Table className="border-spacing-y-1 border-separate">
          <TableHeader className="bg-white shadow-sm rounded-2xl">
            <TableRow>
              <TableHead className="text-sm font-medium text-[#707070]">
                Escritório
              </TableHead>
              <TableHead className="text-sm font-medium text-[#707070] text-right">
                Chamadas
              </TableHead>
              <TableHead className="text-sm font-medium text-[#707070] text-right">
                Tokens
              </TableHead>
              <TableHead className="text-sm font-medium text-[#707070] text-right">
                Custo
              </TableHead>
              <TableHead className="text-sm font-medium text-[#707070] text-right">
                Valor a cobrar
              </TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>

          <TableBody>
            {escritorios.map((escritorio) => (
              <TableRow
                key={escritorio.office_id}
                className="shadow border-0 rounded-2xl bg-white"
              >
                <TableCell>
                  <div className="flex gap-2.5 items-center">
                    <CustomAvatar name={escritorio.nome} size="md" />
                    <div className="flex flex-col gap-1 items-start">
                      <span className="text-sm text-[#707070] font-medium">
                        {formatName(escritorio.nome)}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {escritorio.removido && (
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-semibold">
                            removido
                          </span>
                        )}
                        {escritorio.sem_preco && <SeloSemPreco />}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium text-[#707070] text-right tabular-nums">
                  {formatarInteiro(escritorio.chamadas)}
                </TableCell>
                <TableCell className="text-sm font-medium text-[#707070] text-right tabular-nums">
                  {formatarInteiro(escritorio.tokens)}
                </TableCell>
                <TableCell className="text-sm font-medium text-[#707070] text-right tabular-nums">
                  {formatarReais(escritorio.custo)}
                </TableCell>
                <TableCell className="text-sm font-bold text-[#3D3D3D] text-right tabular-nums">
                  {formatarReais(escritorio.cobrado)}
                </TableCell>
                <TableCell className="text-right">
                  {/* Escritório removido não tem mais página de detalhe */}
                  {!escritorio.removido && (
                    <Link
                      href={`/office/${escritorio.office_id}/ai-usage${query}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-[#348C98] hover:underline whitespace-nowrap"
                    >
                      Detalhes
                      <Icon icon="mdi:chevron-right" className="w-4 h-4" />
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
