"use client"

import { ProcessStatus } from "@/types/process"

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
import { Eye, Pencil, Scale } from "lucide-react"
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
      <div className="mt-5 w-full">
        <TableCard>
          <Table>
            <TableHeader className="max-md:hidden">
              <TableRow>
                <TableHead>Processo</TableHead>
                <TableHead className="hidden lg:table-cell">Ação</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Última atualização
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {processs?.map((process) => (
                <TableRow key={process?._id}>
                  <TableCell className="max-md:pr-2">
                    <Link
                      href={`/process/${process?._id}/information`}
                      className="flex items-center gap-3"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-nevoa text-turquesa-profundo">
                        <Scale size={15} strokeWidth={1.7} />
                      </span>

                      <div className="flex min-w-0 flex-col">
                        <span className="tabular text-[13.5px] font-medium text-tinta">
                          {formatProcess(process?.number)}
                        </span>

                        <span className="max-w-[200px] truncate text-xs text-tinta-3 lg:hidden">
                          {process?.name || "Atualizando..."}
                        </span>
                      </div>
                    </Link>
                  </TableCell>

                  <TableCell className="hidden max-w-[360px] truncate lg:table-cell">
                    {process?.name || "Atualizando..."}
                  </TableCell>

                  <TableCell className="tabular hidden text-tinta-3 lg:table-cell">
                    {process?.updated_at || "—"}
                  </TableCell>

                  <TableCell className="max-md:px-2">
                    <ProcessBadge variant={process?.status as ProcessStatus} />
                  </TableCell>

                  <TableCell className="text-right max-md:pl-0">
                    <RowActions
                      actions={[
                        {
                          label: "Ver",
                          href: `/process/${process?._id}/information`,
                          icon: <Eye strokeWidth={1.7} />,
                        },
                        {
                          label: "Editar",
                          href: `/process?editId=${process?._id}`,
                          icon: <Pencil strokeWidth={1.7} />,
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
    </>
  )
}
