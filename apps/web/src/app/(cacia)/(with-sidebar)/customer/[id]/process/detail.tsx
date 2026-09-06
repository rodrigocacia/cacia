"use client"

import { Icon } from "@/components/icone"
import { useMemo } from "react"
import { useSearchParams } from "next/navigation"

import { EmptySearch } from "@/components/empty-search"

import { CardProcess } from "./components/card-process"
import { Form } from "../../../process/new/form"
import { ProcessStatus } from "@/types/process"
import { FiltersTabResponsive } from "@/components/filters-tab-responsive"
import { processFilters } from "@/constants/filters/process"

interface ProcessesProps {
  processes: {
    _id: string
    unit: string
    number: string
    status: ProcessStatus
    updated_at: string
  }[]
  customerId?: string
}

export function Processes({ processes, customerId }: ProcessesProps) {
  const searchParams = useSearchParams()
  const status = searchParams.get("status") || ""

  const filteredProcesses = useMemo(() => {
    if (!status || status === "") return processes

    return processes.filter((process) => process.status == status)
  }, [processes, status])

  return (
    <div className="p-8 max-md:p-0 pb-4 md:rounded-2xl md:shadow-sm">
      <div className="w-full flex items-center gap-3 max-md:hidden">
        <Icon
          icon="mdi:folder-text-outline"
          className="text-[#BDBDBD] w-8 h-8"
        />

        <h3 className="text-[20px] text-[#707070] font-bold">Processos</h3>
      </div>

      <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200 max-md:hidden" />

      <FiltersTabResponsive showWeb filters={processFilters} />

      <div className="w-full flex items-center gap-1 mt-[22px]">
        <Icon icon="mdi:file-document" className="text-[#BDBDBD] w-5 h-5" />

        <h2 className="text-sm text-[#3D3D3D] font-bold">
          {status
            ? `Processos ${status} (${filteredProcesses?.length})`
            : `Todos os processos (${filteredProcesses?.length})`}
        </h2>
      </div>

      {filteredProcesses?.length === 0 && (
        <EmptySearch
          title={
            status ? "Nenhum processo encontrado" : "Nenhum processo encontrado"
          }
          subtitle={
            status
              ? `Nenhum processo com status "${status}"`
              : "Não foi encontrado nenhum processo"
          }
        />
      )}

      <div className="w-full mt-6 flex flex-col justify-between gap-8">
        {filteredProcesses?.length > 0 && (
          <div className="w-full flex flex-col gap-4">
            <div className="grid grid-cols-2 max-md:grid-cols-1 gap-3">
              {filteredProcesses?.map((process) => (
                <CardProcess key={process?._id} process={process} />
              ))}
            </div>
          </div>
        )}

        <div className="w-full flex items-center justify-end max-md:flex-col max-md:gap-4 max-md:hidden">
          <Form customerContext={true} customerId={customerId} />
        </div>
      </div>

      <div className="md:hidden">
        <Form customerContext={true} customerId={customerId} />
      </div>
    </div>
  )
}
