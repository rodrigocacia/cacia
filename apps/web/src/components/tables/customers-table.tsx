"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { Eye, Pencil, Trash2 } from "lucide-react"

import { useCustomers } from "@/http/hooks/customer"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"

import { CustomPagination } from "../ui/custom-pagination"
import { RowActions } from "../ui/row-actions"
import { TableCard, TableCardFooter } from "../ui/table-card"
import { Spinner } from "../ui/sppiner"

import { EmptySearch } from "../empty-search"
import { formatDocument, formatPhone } from "@/utils/formatters"
import { Iniciais } from "./iniciais"

function quantosProcessos(lista: unknown[] | undefined): string {
  const total = lista?.length ?? 0
  return `${total} ${total === 1 ? "processo" : "processos"}`
}

export function CustomersTable() {
  const searchParams = useSearchParams()
  const page = Number(searchParams.get("page")) || 1
  const search = searchParams.get("search")

  const { customers, isLoading, currentPage, perPage, totalItems, totalPages } =
    useCustomers({ page, search: search ?? "" })

  if (isLoading) return <Spinner />

  if (totalItems === 0) {
    return (
      <EmptySearch
        title="Nenhum resultado encontrado!"
        subtitle="Não há clientes que correspondam à pesquisa."
      />
    )
  }

  return (
    <div className="mt-5 w-full">
      <TableCard>
        <Table>
          <TableHeader className="max-md:hidden">
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden lg:table-cell">CPF/CNPJ</TableHead>
              <TableHead className="hidden md:table-cell">Telefone</TableHead>
              <TableHead className="hidden xl:table-cell">E-mail</TableHead>
              <TableHead className="hidden md:table-cell">Processos</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {customers?.map((customer) => (
              <TableRow key={customer._id}>
                <TableCell className="max-md:pr-2">
                  <Link
                    href={`/customer/${customer?._id}/personal-information`}
                    className="flex items-center gap-3"
                  >
                    <Iniciais nome={customer?.name} />

                    <div className="flex min-w-0 flex-col">
                      <span className="max-w-[260px] truncate text-[13.5px] font-medium text-tinta max-md:max-w-[180px]">
                        {customer.name || "Atualizando..."}
                      </span>

                      <span className="tabular text-xs text-tinta-3 md:hidden">
                        {formatPhone(customer.remotejid)}
                        {" · "}
                        {quantosProcessos(customer?.process)}
                      </span>
                    </div>
                  </Link>
                </TableCell>

                <TableCell className="tabular hidden lg:table-cell">
                  {formatDocument(customer.document)}
                </TableCell>
                <TableCell className="tabular hidden md:table-cell">
                  {formatPhone(customer?.remotejid)}
                </TableCell>
                <TableCell className="hidden max-w-[240px] truncate xl:table-cell">
                  {customer.email || "—"}
                </TableCell>
                <TableCell className="tabular hidden md:table-cell">
                  {customer?.process?.length ?? 0}
                </TableCell>

                <TableCell className="text-right max-md:pl-0">
                  <RowActions
                    actions={[
                      {
                        label: "Ver",
                        href: `/customer/${customer?._id}/personal-information`,
                        icon: <Eye strokeWidth={1.7} />,
                      },
                      {
                        label: "Editar",
                        href: `/customer?editId=${customer?._id}`,
                        icon: <Pencil strokeWidth={1.7} />,
                      },
                      {
                        label: "Excluir",
                        href: `/customer?deleteCustomerId=${customer?._id}`,
                        icon: <Trash2 strokeWidth={1.7} />,
                        danger: true,
                      },
                    ]}
                  />
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
  )
}
