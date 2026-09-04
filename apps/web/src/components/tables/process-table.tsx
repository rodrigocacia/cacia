"use client"

import { MoreVertical } from "lucide-react"
import { ProcessStatus } from "@/types/process"

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
import { Icon } from "@iconify/react/dist/iconify.js"
import Link from "next/link"
import { ProcessBadge } from "../ui/badge/proccess.badge"
import { useProcess } from "@/http/hooks/process"
import { Spinner } from "../ui/sppiner"
import { useSearchParams } from "next/navigation"
import { EmptySearch } from "../empty-search"
import { formatProcess } from "@/utils/formatters"

export function ProcessTable() {
  const searchParams = useSearchParams()
  const page = Number(searchParams.get("page")) || 1
  const search = searchParams.get("search") || ""
  const status = searchParams.get("status") || ""

  const { processs, isLoading, currentPage, totalItems, totalPages, perPage } =
    useProcess(page, search, status)

  if (isLoading) return <Spinner />

  if (totalItems === 0) {
    return (
      <EmptySearch
        title="Nenhum resultado encontrado!"
        subtitle="Não há processos que correspondam à pesquisa."
      />
    )
  }

  return (
    <>
      <div className="w-full h-full mt-8 max-lg:mt-6 flex flex-col gap-[22px]">
        <Table className="border-spacing-y-1 border-separate">
          <TableHeader className="max-lg:hidden bg-white shadow-sm rounded-2xl">
            <TableRow>
              <TableHead>Identificação</TableHead>
              <TableHead className="hidden lg:table-cell">Ação</TableHead>
              <TableHead className="hidden lg:table-cell">
                Última atualização
              </TableHead>
              <TableHead className="">Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="mt-2">
            {processs?.map((process) => (
              <TableRow
                className="bg-transparent shadow rounded-[12px] border-0"
                key={process?._id}
              >
                <TableCell className="font-medium">
                  <Link href={`/process/${process?._id}/information`}>
                    <div className="flex gap-2.5 items-center">
                      <div className="w-11 h-11 flex items-center justify-center rounded-[12px] bg-[#ECF7F8]">
                        <Icon
                          icon="mdi:folder-text"
                          className="w-6 h-6 text-[#348C98]"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-[#707070] font-medium">
                            Processo
                          </span>
                          <span className="text-sm text-[#707070] font-medium">
                            {formatProcess(process?.number)}
                          </span>
                        </div>

                        <p className="text-[10px] text-[#707070] lg:hidden">
                          {process?.name
                            ? `${process?.name.substring(0, 25)}...`
                            : "Atualizando..."}
                        </p>
                      </div>
                    </div>
                  </Link>
                </TableCell>

                <TableCell className="hidden lg:table-cell">
                  {process?.name
                    ? `${process?.name.substring(0, 50)}${
                        process?.name.length > 50 ? "..." : ""
                      }`
                    : "Atualizando..."}
                </TableCell>

                <TableCell className="hidden lg:table-cell">
                  {process?.updated_at}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <ProcessBadge variant={process?.status as ProcessStatus} />
                </TableCell>

                <TableCell className="text-right max-lg:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <Link href={`/process/${process?._id}/information`}>
                        <DropdownMenuItem>Ver</DropdownMenuItem>
                      </Link>

                      <Link href={`/process?editId=${process?._id}`}>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                      </Link>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>

                <TableCell className="lg:hidden">
                  <div className="w-fit flex flex-1 items-end flex-col gap-2.5">
                    <ProcessBadge variant={process?.status as ProcessStatus} />

                    <h3 className="text-[10px] text-[#707070] font-semibold">
                      <span className="">{process?.updated_at}</span>
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
    </>
  )
}
