"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Eye, MoreHorizontal, Pencil } from "lucide-react";

import { useUsers } from "@/http/hooks/user";
import { nomeParaExibir } from "@/utils/formatters";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import { DialogDeleteUserTable } from "./dialog-delete-user-table";

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

export function UsersTable() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search");
  const role = searchParams.get("role");

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
    users,
    isLoading,
    currentPage,
    perPage,
    totalItems,
    totalPages,
    mutate,
  } = useUsers({
    page,
    search: search ?? "",
    role: role ?? "-",
  });

  const handleDeleteSuccess = async () => {
    setToastConfig({
      title: "Sucesso!",
      description: "Usuário excluído com sucesso!",
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
        subtitle="Não há usuários que correspondam à pesquisa."
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
                <TableHead className="hidden md:table-cell">E-mail</TableHead>
                <TableHead className="hidden md:table-cell">Tipo</TableHead>
                <TableHead className="hidden md:table-cell">
                  Escritórios
                </TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {users?.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="max-md:pr-2">
                    <Link
                      href={`/user/${user?._id}/personal-information`}
                      className="flex items-center gap-3"
                    >
                      <CustomAvatar name={user?.name} size="sm" />

                      <div className="flex min-w-0 flex-col">
                        <span className="max-w-[260px] truncate text-[13.5px] font-medium text-tinta max-md:max-w-[200px]">
                          {nomeParaExibir(user.name)}
                        </span>

                        <span className="max-w-[200px] truncate text-xs text-tinta-3 md:hidden">
                          {user.email}
                        </span>
                      </div>
                    </Link>
                  </TableCell>

                  <TableCell className="hidden max-w-[280px] truncate md:table-cell">
                    {user.email}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {user.role === "ADMIN" ? (
                      <StatusChip ponto="bg-acao">Administrador</StatusChip>
                    ) : (
                      "Usuário"
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell tabular">
                    {user.offices?.length ?? 0}
                  </TableCell>

                  <TableCell className="text-right max-md:pl-0">
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
                        <Link href={`/user/${user?._id}/personal-information`}>
                          <DropdownMenuItem>
                            <Eye strokeWidth={1.7} />
                            Ver
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/user?editId=${user?._id}`}>
                          <DropdownMenuItem>
                            <Pencil strokeWidth={1.7} />
                            Editar
                          </DropdownMenuItem>
                        </Link>
                        <DialogDeleteUserTable
                          userId={user._id}
                          userName={nomeParaExibir(user.name)}
                          onSuccess={handleDeleteSuccess}
                          onError={handleDeleteError}
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
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
