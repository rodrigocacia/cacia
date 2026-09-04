"use client"

import { MoreVertical } from "lucide-react"

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
      <div className="w-full h-full mt-8 max-lg:mt-6 flex flex-col gap-[22px]">
        <Table className="border-spacing-y-1 border-separate">
          <TableHeader className="max-lg:hidden bg-white shadow-sm rounded-2xl">
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead className="hidden lg:table-cell">Área</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="mt-2">
            {services?.map((service) => (
              <TableRow
                className="bg-transparent shadow rounded-[12px] border-0"
                key={service?._id}
              >
                <TableCell className="font-medium">
                  <div className="flex gap-2.5 items-center">
                    <div className="w-11 h-11 flex items-center justify-center rounded-[12px] bg-[#ECF7F8]">
                      <Icon
                        icon="octicon:law-16"
                        className="w-6 h-6 text-[#348C98]"
                      />
                    </div>

                    <p className="text-sm text-[#707070]">
                      {`${service?.title?.substring(0, 20)}...`}
                    </p>
                  </div>
                </TableCell>

                <TableCell className="hidden lg:table-cell">
                  <p className="text-base text-[#707070]">
                    {translateServiceArea(service?.area)}
                  </p>
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
                      <DropdownMenuItem
                        onClick={() => handleAddEditServiceId(service?._id)}
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
                        onClick={() => handleAddDeleteServiceId(service?._id)}
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
