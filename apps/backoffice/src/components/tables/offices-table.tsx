"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Eye, MoreHorizontal, Pencil } from "lucide-react";

import { useOffices } from "@/http/hooks/office";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import { DialogDeleteOfficeTable } from "./dialog-delete-office-table";

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
import { CustomAvatar } from "../ui/custom-avatar";
import { Spinner } from "../ui/sppiner";
import { Toast } from "../ui/toast";

import { EmptySearch } from "../empty-search";
import { formatDate } from "date-fns";
import { formatPhone } from "@/utils/formatters";
import { nomeParaExibir } from "@/utils/formatters";
import {
  SITUACOES_DO_ESCRITORIO,
  situacaoValida,
} from "@/constants/office-status";

function StatusBadge({ status }: { status: string }) {
  const situacao = situacaoValida(status);
  const { rotulo, ponto } = situacao
    ? SITUACOES_DO_ESCRITORIO[situacao]
    : { rotulo: status, ponto: "bg-gray-400" };

  return <StatusChip ponto={ponto}>{rotulo}</StatusChip>;
}

export function OfficesTable() {
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
    offices,
    isLoading,
    currentPage,
    perPage,
    totalItems,
    totalPages,
    mutate,
  } = useOffices({
    page,
    search: search ?? "",
    status: status ?? undefined,
  });

  const handleDeleteSuccess = async () => {
    setToastConfig({
      title: "Sucesso!",
      description: "Escritório excluído com sucesso!",
      variant: "successSolid",
    });
    setShowToast(true);

    await mutate();
  };

  const handleDeleteError = (message: string) => {
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
        subtitle="Não há escritórios que correspondam à pesquisa."
      />
    );
  }

  return (
    <>
      <div className="mt-5 w-full">
        <TableCard>
          <Table>
            <TableHeader className="max-md:hidden">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead className="hidden md:table-cell">
                  Data de cadastro
                </TableHead>
                <TableHead className="hidden md:table-cell">Situação</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {offices?.map((office) => (
                <TableRow key={office._id}>
                  <TableCell className="max-md:pr-2">
                    <Link
                      href={`/office/${office?._id}/information`}
                      className="flex items-center gap-3"
                    >
                      <CustomAvatar name={office?.name} size="sm" />

                      <div className="flex min-w-0 flex-col">
                        <span className="max-w-[300px] truncate text-[13.5px] font-medium text-tinta max-md:max-w-[170px]">
                          {nomeParaExibir(office.name)}
                        </span>

                        <span className="text-xs text-tinta-3 tabular md:hidden">
                          {formatPhone(office.remotejid)}
                        </span>
                      </div>
                    </Link>
                  </TableCell>

                  <TableCell className="hidden md:table-cell tabular">
                    {formatPhone(office.remotejid)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell tabular">
                    {formatDate(new Date(office.created_at), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <StatusBadge status={office.status} />
                  </TableCell>

                  <TableCell className="text-right max-md:pl-0">
                    <div className="flex items-center justify-end gap-2">
                      <span className="md:hidden">
                        <StatusBadge status={office.status} />
                      </span>
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
                          <Link href={`/office/${office?._id}/information`}>
                            <DropdownMenuItem>
                              <Eye strokeWidth={1.7} />
                              Ver
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/office?editId=${office?._id}`}>
                            <DropdownMenuItem>
                              <Pencil strokeWidth={1.7} />
                              Editar
                            </DropdownMenuItem>
                          </Link>
                          <DialogDeleteOfficeTable
                            officeId={office._id}
                            officeName={nomeParaExibir(office.name)}
                            onSuccess={handleDeleteSuccess}
                            onError={handleDeleteError}
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

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
