"use client"

import Link from "next/link"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

import { MoreVertical } from "lucide-react"
import { Icon } from "@iconify/react/dist/iconify.js"

import { useCustomers } from "@/http/hooks/customer"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"

import { CustomPagination } from "../ui/custom-pagination"
import { Button } from "../ui/button"
import { CustomAvatar } from "../ui/custom-avatar"
import { Spinner } from "../ui/sppiner"

import { EmptySearch } from "../empty-search"
import { formatDocument, formatPhone, formatName } from "@/utils/formatters"

export function CustomersTable() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const page = Number(searchParams.get("page")) || 1
  const search = searchParams.get("search")
  const status = searchParams.get("status")

  const { customers, isLoading, currentPage, perPage, totalItems, totalPages } =
    useCustomers({ page, search: search ?? "", status: status ?? "" })

  const handleEditCustomer = (customerId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("editId", customerId)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleAddDeleteCustomerId = (customerId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("deleteCustomerId", customerId)
    router.push(`${pathname}?${params.toString()}`)
  }

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
    <>
      <div className="w-full flex items-start justify-between mt-6 md:hidden">
        <div className="flex gap-2">
          <Icon
            icon="mdi:account-group-outline"
            className="text-[#BDBDBD] max-md:w-5 max-md:h-5"
          />

          <h3 className="text-sm text-[#3D3D3D] font-bold">
            Todos os clientes ({customers?.length})
          </h3>
        </div>
      </div>

      <div className="w-full h-full mt-6 flex flex-col gap-[22px]">
        <Table className="border-spacing-y-1 border-separate">
          <TableHeader className="max-md:hidden bg-white shadow-sm rounded-2xl">
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">CPF</TableHead>
              <TableHead className="">Telefone</TableHead>
              <TableHead className="">E-mail</TableHead>
              <TableHead className="">Processos</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="mt-2">
            {customers?.map((customer) => (
              <TableRow
                key={customer._id}
                className="shadow border-0 rounded-2xl bg-white"
              >
                <TableCell className="font-medium">
                  <Link
                    href={`/customer/${customer?._id}/personal-information`}
                  >
                    <div className="flex gap-2.5 items-center">
                      <CustomAvatar name={customer?.name} size="md" />

                      <div className="flex flex-col gap-2">
                        <span className="text-sm text-[#707070] inline-flex items-center gap-2 font-medium">
                          {customer.name
                            ? `${formatName(customer.name).substring(0, 20)}${
                                formatName(customer.name).length > 20
                                  ? "..."
                                  : ""
                              }`
                            : "Atualizando..."}
                        </span>

                        <p className="text-[10px] text-[#707070] md:hidden">
                          {formatPhone(customer.remotejid)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  {formatDocument(customer.document)}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatPhone(customer?.remotejid)}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {customer.email}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {customer?.process?.length}
                </TableCell>

                <TableCell className="text-right max-md:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <Link
                        href={`/customer/${customer?._id}/personal-information`}
                      >
                        <DropdownMenuItem>
                          <div className="flex items-center gap-2">
                            <Icon
                              icon="mdi:eye"
                              className="text-[#348C98] w-5 h-5"
                            />
                            <p className="text-base text-[#3D3D3D]">Ver</p>
                          </div>
                        </DropdownMenuItem>
                      </Link>
                      <Link href={`/customer?editId=${customer?._id}`}>
                        <DropdownMenuItem>
                          <div className="flex items-center gap-2">
                            <Icon
                              icon="mdi:edit"
                              className="text-[#348C98] w-5 h-5"
                            />
                            <p className="text-base text-[#3D3D3D]">Editar</p>
                          </div>
                        </DropdownMenuItem>
                      </Link>
                      <Link
                        href={`/customer?deleteCustomerId=${customer?._id}`}
                      >
                        <DropdownMenuItem>
                          <div className="flex items-center gap-2">
                            <Icon
                              icon="mdi:delete"
                              className="text-[#DC2626] w-5 h-5"
                            />
                            <p className="text-base text-[#3D3D3D]">Excluir</p>
                          </div>
                        </DropdownMenuItem>
                      </Link>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>

                <TableCell className="md:hidden">
                  <div className="w-full flex items-center justify-between">
                    <div className="flex flex-col gap-2.5">
                      <div className="w-fit px-2 py-1 bg-[#ECF7F8] rounded-full flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-[#348C98]"></div>

                        <span className="text-[#348C98] text-[10px] font-semibold">
                          Novo
                        </span>
                      </div>

                      <h3 className="text-[10px] text-[#707070] font-semibold">
                        Processos:{" "}
                        <span className="">{customer?.process?.length}</span>
                      </h3>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <Link
                          href={`/customer/${customer?._id}/personal-information`}
                        >
                          <DropdownMenuItem>
                            <div className="flex items-center gap-2">
                              <Icon
                                icon="mdi:eye"
                                className="text-[#348C98] w-5 h-5"
                              />
                              <p className="text-base text-[#3D3D3D]">Ver</p>
                            </div>
                          </DropdownMenuItem>
                        </Link>

                        <DropdownMenuItem
                          onClick={() => handleEditCustomer(customer._id)}
                        >
                          <div className="flex items-center gap-2">
                            <Icon
                              icon="mdi:edit"
                              className="text-[#348C98] w-5 h-5"
                            />
                            <p className="text-base text-[#3D3D3D]">Editar</p>
                          </div>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() =>
                            handleAddDeleteCustomerId(customer._id)
                          }
                        >
                          <div className="flex items-center gap-2">
                            <Icon
                              icon="mdi:delete"
                              className="text-[#DC2626] w-5 h-5"
                            />
                            <p className="text-base text-[#3D3D3D]">Excluir</p>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
    </>
  )
}
