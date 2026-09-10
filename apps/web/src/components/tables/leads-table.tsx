"use client"

import { useSearchParams } from "next/navigation"

import { useLeads } from "@/http/hooks/lead"

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
import { LeadBadge } from "../ui/badge/lead-badge"
import { CustomAvatar } from "../ui/custom-avatar"

import { Spinner } from "../ui/sppiner"
import { EmptySearch } from "../empty-search"
import { formatPhone, formatName } from "@/utils/formatters"
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
      <div className="mt-6 w-full">
        <TableCard>
          <Table>
            <TableHeader className="max-md:hidden">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead className="">Último contato</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {leads?.map((lead) => (
                <TableRow key={lead?._id}>
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
                    <RowActions
                      actions={[
                        {
                          label: "Editar",
                          href: `/lead?editLeadId=${lead._id}`,
                          icon: (
                            <Icon
                              icon="mdi:edit"
                              className="h-[18px] w-[18px]"
                            />
                          ),
                        },
                        {
                          label:
                            lead.status === "CONVERTED"
                              ? "Mostrar cliente"
                              : "Tornar cliente",
                          href:
                            lead.status === "CONVERTED"
                              ? `/customer/${lead.customer}/personal-information`
                              : `/lead?action=customer&leadId=${lead._id}`,
                          icon: (
                            <Icon
                              icon="mdi:account-check"
                              className="h-[18px] w-[18px]"
                            />
                          ),
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
