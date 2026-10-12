"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"

import { Painel, Vazio } from "@/components/tables/ficha"

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
    <div className="flex flex-col gap-4">
      <FiltersTabResponsive showWeb filters={processFilters} />

      <Painel
        titulo={status ? "Processos filtrados" : "Todos os processos"}
        contagem={filteredProcesses?.length ?? 0}
        acao={
          <div className="max-md:hidden">
            <Form customerContext={true} customerId={customerId} />
          </div>
        }
        semPreenchimento
      >
        {filteredProcesses?.length === 0 ? (
          <Vazio>
            {status
              ? "Nenhum processo com esse status."
              : "Este cliente ainda não tem processos."}
          </Vazio>
        ) : (
          <ul className="flex flex-col">
            {filteredProcesses?.map((process) => (
              <CardProcess key={process?._id} process={process} />
            ))}
          </ul>
        )}
      </Painel>

      <div className="md:hidden">
        <Form customerContext={true} customerId={customerId} />
      </div>
    </div>
  )
}
