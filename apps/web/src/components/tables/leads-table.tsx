"use client"

import { useSearchParams } from "next/navigation"

import { MoreVertical } from "lucide-react"

import { useLeads } from "@/http/hooks/lead"

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
import { LeadBadge } from "../ui/badge/lead-badge"
import { CustomAvatar } from "../ui/custom-avatar"

import { Spinner } from "../ui/sppiner"
import { EmptySearch } from "../empty-search"
import { formatPhone, formatName } from "@/utils/formatters"
import Link from "next/link"
import { Icon } from "@/components/icone"

export function LeadsTable() {
  const searchParams = useSearchParams()
  const page = Number(searchParams.get("page")) || 1
  const search = searchParams.get("search") || ""
  const status = searchParams.get("status") || ""

  const { leads, isLoading, currentPage, totalItems, totalPages, perPage } =
    useLeads(page, search, status)

  if (isLoading) return <Spinner />

  if (totalItems === 0) {
    return (
      <>
        <EmptySearch
          title="Nenhum resultado encontrado!"
          subtitle="Não há leads que correspondam à pesquisa."
        />
      </>
    )
  }

  return (
    <>
      <div className="w-full h-full mt-8 flex flex-col gap-[22px]">
        <Table className="border-spacing-y-1 border-separate">
          <TableHeader className="max-md:hidden bg-white shadow-sm rounded-2xl">
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Telefone</TableHead>
              <TableHead className="">Último contato</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="mt-2">
            {leads?.map((lead) => (
              <TableRow
                className="bg-transparent shadow rounded-[12px] border-0"
                key={lead?._id}
              >
                <TableCell className="font-medium">
                  <div className="flex gap-2.5 items-center">
                    <CustomAvatar name={lead.name} size="md" />

                    <div className="flex flex-col gap-2">
                      <span className="text-sm text-[#707070] inline-flex items-center gap-2 font-medium">
                        {lead.name
                          ? `${formatName(lead.name).substring(0, 20)}${
                              formatName(lead.name).length > 20 ? "..." : ""
                            }`
                          : "Atualizando..."}
                      </span>

                      <p className="text-[10px] text-[#707070] md:hidden">
                        {formatPhone(lead?.remotejid)}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  {formatPhone(lead?.remotejid)}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {lead?.updated_at}
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  <LeadBadge variant={lead.status} />
                </TableCell>

                <TableCell className="md:hidden">
                  <div className="w-fit flex flex-1 items-end flex-col gap-2.5">
                    <LeadBadge variant={lead.status} />

                    <h3 className="text-[10px] text-[#707070] font-semibold">
                      {lead?.updated_at}
                    </h3>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <Link href={`/lead?editLeadId=${lead._id}`}>
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
                        href={`${lead.status === "CONVERTED" ? `/customer/${lead.customer}/personal-information` : `/lead?action=customer&leadId=${lead._id}`}`}
                      >
                        <DropdownMenuItem>
                          <div className="flex items-center gap-2">
                            <Icon
                              icon="mdi:account-check"
                              className="text-[#348C98] w-5 h-5"
                            />

                            <p className="text-base text-[#3D3D3D]">
                              {lead.status === "CONVERTED"
                                ? "Mostrar cliente"
                                : "Tornar cliente"}
                            </p>
                          </div>
                        </DropdownMenuItem>
                      </Link>
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
    </>
  )
}
