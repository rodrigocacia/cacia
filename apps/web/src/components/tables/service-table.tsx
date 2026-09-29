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

export function ServiceTable() {
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
      <div className="mt-6 w-full">
        <TableCard>
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
                      <div className="w-11 h-11 flex items-center justify-center rounded-[12px] bg-[#ECF7F8]">
                        <Icon
                          icon="octicon:law-16"
                          className="w-6 h-6 text-[#348C98]"
                        />
                      </div>

                      <p className="text-sm text-[#707070]">
                        {(service?.title ?? "").length > 20
                          ? `${service?.title?.substring(0, 20)}...`
                          : service?.title}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="hidden lg:table-cell">
                    <p className="text-base text-[#707070]">
                      {translateServiceArea(service?.area)}
                    </p>
                  </TableCell>

                  <TableCell className="text-right">
                    <RowActions
                      actions={[
                        {
                          label: "Editar",
                          onClick: () => handleAddEditServiceId(service?._id),
                          icon: (
                            <Icon
                              icon="mdi:edit"
                              className="h-[18px] w-[18px]"
                            />
                          ),
                        },
                        {
                          label: "Excluir",
                          onClick: () => handleAddDeleteServiceId(service?._id),
                          icon: (
                            <Icon
                              icon="mdi:delete"
                              className="h-[18px] w-[18px]"
                            />
                          ),
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
