"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, MoreHorizontal } from "lucide-react";
import { formatDate } from "date-fns";
import { mutate } from "swr";

import { useRecurrences } from "@/http/hooks/recurrence";
import { formatName, nomeParaExibir } from "@/utils/formatters";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

import { CustomPagination } from "../ui/custom-pagination";
import { TableCard, TableCardFooter } from "../ui/table-card";
import { StatusChip } from "../ui/status-chip";
import { Spinner } from "../ui/sppiner";
import { EmptySearch } from "../empty-search";
import { CustomAvatar } from "../ui/custom-avatar";
import { Toast } from "../ui/toast";
import { DialogActivateBetaFree } from "./dialog-activate-beta-free";
import { RecurrenceStatus } from "@/types/recurrence";

function StatusBadge({ status }: { status: string }) {
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case RecurrenceStatus.ACTIVE:
        return { text: "Pago", ponto: "bg-[#4FB3C0]" };
      case RecurrenceStatus.PENDING:
        return { text: "Pendente", ponto: "bg-ambar-ponto" };
      case RecurrenceStatus.CANCELLED:
        return { text: "Cancelado", ponto: "bg-[#E2725F]" };
      default:
        return { text: status, ponto: "bg-gray-400" };
    }
  };

  const { text, ponto } = getStatusDisplay(status);
  return <StatusChip ponto={ponto}>{text}</StatusChip>;
}

export function FinancialTable() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search");
  const status = searchParams.get("status");

  const [showToast, setShowToast] = useState(false);
  const [toastConfig, setToastConfig] = useState<{
    title: string;
    description: string;
    variant: "success" | "error" | "alert" | "successSolid" | "errorSolid";
  }>({
    title: "",
    description: "",
    variant: "success",
  });

  const {
    recurrences,
    isLoading,
    totalItems,
    totalPages,
    currentPage,
    perPage,
    mutate: mutateRecurrences,
  } = useRecurrences({
    page,
    search: search || "",
    status: status === "-" || !status ? undefined : status,
  });

  const handleActivateSuccess = async (message: string) => {
    setToastConfig({
      title: "Sucesso!",
      description: message,
      variant: "successSolid",
    });
    setShowToast(true);

    await mutateRecurrences();
    await mutate("recurrence");
  };

  const handleActivateError = (message: string) => {
    setToastConfig({
      title: "Erro!",
      description: message,
      variant: "errorSolid",
    });
    setShowToast(true);
  };

  if (isLoading) return <Spinner />;

  if (totalItems === 0) {
    return (
      <EmptySearch
        title="Nenhum resultado encontrado!"
        subtitle="Não há recorrências que correspondam à pesquisa."
      />
    );
  }

  const formatCurrency = (valor: number | string) =>
    `R$${(Number(valor) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <>
      <div className="mt-5 w-full">
        <TableCard>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plano e valor</TableHead>
                  <TableHead>Data de criação</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {recurrences.map((recurrence) => (
                  <TableRow key={recurrence._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <CustomAvatar
                          name={recurrence.office?.name || "N/A"}
                          size="sm"
                        />
                        <div className="flex min-w-0 flex-col">
                          <span className="max-w-[240px] truncate text-[13.5px] font-medium text-tinta">
                            {nomeParaExibir(recurrence.office?.name || "N/A")}
                          </span>
                          <span className="max-w-[240px] truncate text-xs text-tinta-3">
                            {recurrence.user?.name || "N/A"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[13.5px] text-tinta">
                          {recurrence.plan?.title || "N/A"}
                        </span>
                        <span className="text-xs text-tinta-3 tabular">
                          {recurrence.plan?.price
                            ? formatCurrency(recurrence.plan.price)
                            : "N/A"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="tabular">
                      {formatDate(
                        new Date(recurrence.created_at),
                        "dd/MM/yyyy",
                      )}
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={recurrence.status} />
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label="Ações"
                            className="ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-tinta-3 transition-colors hover:bg-gray-100 hover:text-tinta"
                          >
                            <MoreHorizontal size={16} strokeWidth={1.7} />
                          </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          {recurrence.status === RecurrenceStatus.PENDING && (
                            <DialogActivateBetaFree
                              officeId={recurrence.office?._id || ""}
                              officeName={formatName(
                                recurrence.office?.name || "N/A",
                              )}
                              onSuccess={handleActivateSuccess}
                              onError={handleActivateError}
                              trigger={
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Check strokeWidth={1.7} />
                                  Ativar Beta FREE
                                </DropdownMenuItem>
                              }
                            />
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <TableCardFooter>
            <CustomPagination
              totalItems={totalItems}
              totalPages={totalPages}
              currentPage={currentPage}
              perPage={perPage}
            />
          </TableCardFooter>
        </TableCard>
      </div>

      {showToast && (
        <Toast
          title={toastConfig.title}
          description={toastConfig.description}
          variant={toastConfig.variant}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}
