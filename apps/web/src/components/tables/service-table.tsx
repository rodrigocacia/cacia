"use client"

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
import { Icon } from "@/components/icone"
import { Spinner } from "../ui/sppiner"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { EmptySearch } from "../empty-search"
import { useService } from "@/http/hooks/service"
import { translateServiceArea } from "@/utils/service-area"

interface ServiceTableProps {
  /** Sem a moldura própria — para quando a tabela já está num cartão. */
  semMoldura?: boolean
}

export function ServiceTable({ semMoldura = false }: ServiceTableProps = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const page = Number(searchParams.get("page")) || 1
  const search = searchParams.get("search") || ""

  const { services, isLoading, currentPage, totalItems, totalPages, perPage } =
    useService(page, search)

  if (isLoading) return <Spinner />

  if (totalItems === 0) {
    return <EmptySearch title="Nenhum serviço cadastrado." subtitle="" />
  }

  const handleAddDeleteServiceId = (serviceId: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("deleteServiceId", serviceId)

    router.push(`${pathname}?${params.toString()}`)
  }

  const handleAddEditServiceId = (serviceId: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("editId", serviceId)

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <>
      <div className={semMoldura ? "w-full" : "mt-5 w-full"}>
        <TableCard semMoldura={semMoldura}>
          <Table>
            <TableHeader className="max-lg:hidden">
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead className="hidden lg:table-cell">Área</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {services?.map((service) => (
                <TableRow key={service?._id}>
                  <TableCell className="font-medium">
                    <div className="flex gap-2.5 items-center">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-nevoa">
                        <Icon
                          icon="octicon:law-16"
                          className="h-4 w-4 text-turquesa-profundo"
                        />
                      </div>

                      <p className="text-[13.5px] font-medium text-tinta">
                        {(service?.title ?? "").length > 20
                          ? `${service?.title?.substring(0, 20)}...`
                          : service?.title}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="hidden lg:table-cell">
                    <p className="text-[13.5px] text-tinta-2">
                      {translateServiceArea(service?.area)}
                    </p>
                  </TableCell>

                  <TableCell className="text-right">
                    <RowActions
                      actions={[
                        {
                          label: "Editar",
                          onClick: () => handleAddEditServiceId(service?._id),
                          icon: <Icon icon="mdi:edit" className="h-4 w-4" />,
                        },
                        {
                          label: "Excluir",
                          onClick: () => handleAddDeleteServiceId(service?._id),
                          icon: <Icon icon="mdi:delete" className="h-4 w-4" />,
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
    </>
  )
}
