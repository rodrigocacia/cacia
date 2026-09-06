"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { MoreVertical } from "lucide-react";
import { Icon } from "@iconify/react/dist/iconify.js";

import { useUsers } from "@/http/hooks/user";
import { formatName } from "@/utils/formatters";

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
import { Button } from "../ui/button";
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
      <div className="w-full flex items-start justify-between mt-6 md:hidden">
        <div className="flex gap-2">
          <Icon
            icon="mdi:account-group-outline"
            className="text-[#BDBDBD] max-md:w-5 max-md:h-5"
          />

          <h3 className="text-sm text-[#3D3D3D] font-bold">
            Todos os usuários ({totalItems})
          </h3>
        </div>
      </div>

      <div className="w-full h-full mt-6 flex flex-col gap-[22px]">
        <Table className="border-spacing-y-1 border-separate">
          <TableHeader className="max-md:hidden bg-white shadow-sm rounded-2xl">
            <TableRow>
              <TableHead className="text-sm font-medium text-[#707070]">
                Nome
              </TableHead>
              <TableHead className="hidden md:table-cell text-sm font-medium text-[#707070]">
                Email
              </TableHead>
              <TableHead className="text-sm font-medium text-[#707070]">
                Tipo
              </TableHead>
              <TableHead className="text-sm font-medium text-[#707070]">
                Escritórios
              </TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="mt-2">
            {users?.map((user) => (
              <TableRow
                key={user._id}
                className="shadow border-0 rounded-2xl bg-white"
              >
                <TableCell className="font-medium">
                  <Link href={`/user/${user?._id}/personal-information`}>
                    <div className="flex gap-2.5 items-center">
                      <CustomAvatar name={user?.name} size="md" />

                      <div className="flex flex-col gap-2">
                        <span className="text-sm text-[#707070] font-medium inline-flex items-center gap-2">
                          {formatName(user.name)}
                        </span>

                        <p className="text-[10px] text-[#707070] font-medium md:hidden">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </Link>
                </TableCell>

                <TableCell className="hidden md:table-cell text-sm font-medium text-[#707070]">
                  {user.email}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm font-medium text-[#707070]">
                  {user.role === "admin" ? "Administrador" : "Usuário"}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm font-medium text-[#707070]">
                  {user.offices?.length ?? 0}
                </TableCell>

                <TableCell className="text-right max-md:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreVertical />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <Link href={`/user/${user?._id}/personal-information`}>
                        <DropdownMenuItem>
                          <Icon
                            icon="mdi:eye"
                            className="w-4 h-4 mr-2 text-[#348C98]"
                          />
                          Ver
                        </DropdownMenuItem>
                      </Link>
                      <Link href={`/user?editId=${user?._id}`}>
                        <DropdownMenuItem>
                          <Icon
                            icon="mdi:pencil"
                            className="w-4 h-4 mr-2 text-[#348C98]"
                          />
                          Editar
                        </DropdownMenuItem>
                      </Link>
                      <DialogDeleteUserTable
                        userId={user._id}
                        userName={formatName(user.name)}
                        onSuccess={handleDeleteSuccess}
                        onError={handleDeleteError}
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>

                <TableCell className="md:hidden">
                  <div className="w-fit flex flex-1 items-end flex-col gap-2.5">
                    <div className="w-fit px-2 py-1 bg-[#ECF7F8] rounded-full flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-[#348C98]"></div>

                      <span className="text-[#348C98] text-[10px] font-semibold">
                        Novo
                      </span>
                    </div>

                    <h3 className="text-[10px] text-[#707070] font-semibold">
                      Último contato: <span className="">1h atrás</span>
                    </h3>
                  </div>
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
