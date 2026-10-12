"use client"

import { useSearchParams } from "next/navigation"
import { ultimoContato } from "@/utils/ultimo-contato"

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
import { Iniciais } from "./iniciais"

import { Spinner } from "../ui/sppiner"
import { EmptySearch } from "../empty-search"
import Link from "next/link"
import { ArrowUpRight, Pencil, UserCheck } from "lucide-react"
import { formatPhone } from "@/utils/formatters"

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
      <div className="mt-5 w-full">
        <TableCard>
          <Table>
            <TableHeader className="max-md:hidden">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead className="hidden md:table-cell">
                  Último contato
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {leads?.map((lead) => (
                <TableRow key={lead?._id}>
                  <TableCell className="max-md:pr-2">
                    <Link
                      href={`/lead/${lead._id}`}
                      className="flex items-center gap-3"
                    >
                      <Iniciais nome={lead.name} />

                      <div className="flex min-w-0 flex-col">
                        <span className="max-w-[260px] truncate text-[13.5px] font-medium text-tinta max-md:max-w-[150px]">
                          {lead.name || "Atualizando..."}
                        </span>

                        <span className="tabular text-xs text-tinta-3 md:hidden">
                          {formatPhone(lead?.remotejid)}
                        </span>
                      </div>
                    </Link>
                  </TableCell>

                  <TableCell className="tabular hidden md:table-cell">
                    {formatPhone(lead?.remotejid)}
                  </TableCell>

                  <TableCell className="tabular hidden text-tinta-3 md:table-cell">
                    {/* A API manda `lastActivityAt` (o adaptador entrega em
                        snake_case); `updated_at` nem vem na listagem. */}
                    {lead?.last_activity_at ? (
                      <time
                        dateTime={lead.last_activity_at}
                        suppressHydrationWarning
                        title={new Date(lead.last_activity_at).toLocaleString(
                          "pt-BR"
                        )}
                      >
                        {ultimoContato(lead.last_activity_at)}
                      </time>
                    ) : (
                      "—"
                    )}
                  </TableCell>

                  <TableCell className="max-md:px-2">
                    <LeadBadge variant={lead.status} />
                  </TableCell>

                  <TableCell className="text-right max-md:pl-0">
                    <RowActions
                      actions={[
                        {
                          // A ficha é onde ficam etapa, etiquetas, valor,
                          // responsável e histórico — nada disso cabe na linha
                          // da tabela.
                          label: "Abrir ficha",
                          href: `/lead/${lead._id}`,
                          icon: <ArrowUpRight strokeWidth={1.7} />,
                        },
                        {
                          label: "Editar",
                          href: `/lead?editLeadId=${lead._id}`,
                          icon: <Pencil strokeWidth={1.7} />,
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
                          icon: <UserCheck strokeWidth={1.7} />,
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
