"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { Icon } from "@/components/icone";
import { formatDate } from "date-fns";
import { mutate } from "swr";

import { useRecurrences } from "@/http/hooks/recurrence";
import { formatName } from "@/utils/formatters";

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
import { Button } from "../ui/button";
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
        return { text: "Pago", color: "bg-[#DBFADC] text-[#16A31B]" };
      case RecurrenceStatus.PENDING:
        return { text: "Pendente", color: "bg-[#FEF7D7] text-[#F7CB08]" };
      case RecurrenceStatus.CANCELLED:
        return { text: "Cancelado", color: "bg-[#F9DCDC] text-[#DC2626]" };
      default:
        return { text: status, color: "bg-gray-100 text-gray-800" };
    }
  };

  const { text, color } = getStatusDisplay(status);
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${color}`}>
      {text}
    </span>
  );
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
      <div className="w-full flex items-start justify-between mt-6 md:hidden">
        <div className="flex gap-2">
          <Icon
            icon="mdi:bank-outline"
            className="text-[#BDBDBD] max-md:w-5 max-md:h-5"
          />

          <h3 className="text-sm text-[#3D3D3D] font-bold">
            Histórico de recorrências ({totalItems})
          </h3>
        </div>
      </div>

      <div className="w-full h-full mt-6 flex flex-col gap-[22px]">
        <Table className="border-spacing-y-1 border-separate">
          <TableHeader className="max-md:hidden bg-white shadow-sm rounded-2xl">
            <TableRow>
              <TableHead className="text-sm font-medium text-[#707070]">
                Cliente
              </TableHead>
              <TableHead className="text-sm font-medium text-[#707070]">
                Plano e valor
              </TableHead>
              <TableHead className="text-sm font-medium text-[#707070]">
                Data de criação
              </TableHead>
              <TableHead className="text-sm font-medium text-[#707070]">
                Status
              </TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="mt-2">
            {recurrences.map((recurrence) => (
              <TableRow
                key={recurrence._id}
                className="shadow border-0 rounded-2xl bg-white"
              >
                <TableCell className="font-medium">
                  <div className="flex gap-2.5 items-center">
                    <CustomAvatar
                      name={recurrence.office?.name || "N/A"}
                      size="sm"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm text-[#707070] font-medium">
                        {formatName(recurrence.office?.name || "N/A")}
                      </span>
                      <span className="text-xs text-[#707070] font-light">
                        {recurrence.user?.name || "N/A"}
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-[#707070] font-medium">
                      {recurrence.plan?.title || "N/A"}
                    </span>
                    <span className="text-xs text-[#707070] font-light">
                      {recurrence.plan?.price
                        ? formatCurrency(recurrence.plan.price)
                        : "N/A"}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-sm text-[#707070] font-light">
                    {formatDate(new Date(recurrence.created_at), "dd/MM/yyyy")}
                  </span>
                </TableCell>

                <TableCell>
                  <StatusBadge status={recurrence.status} />
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreVertical />
                      </Button>
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
                              <Icon
                                icon="mdi:check"
                                className="w-4 h-4 mr-2 text-[#348C98]"
                              />
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

        <CustomPagination
          totalItems={totalItems}
          totalPages={totalPages}
          currentPage={currentPage}
          perPage={perPage}
        />
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
