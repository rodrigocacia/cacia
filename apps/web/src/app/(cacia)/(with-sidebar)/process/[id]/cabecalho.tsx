"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { ArrowLeft, Scale } from "lucide-react"

import { Process } from "@/types/process"
import { formatProcess } from "@/utils/formatters"

import { CustomTab } from "@/components/ui/custom-tab"
import { ProcessBadge } from "@/components/ui/badge/proccess.badge"

import { navLinks } from "./navs"
import { DialogDeleteProcess } from "./components/dialog-delete-process"
import { Form } from "../new/form"

/**
 * Cabeçalho da ficha do processo: número em serifa, cliente e status na
 * linha de contexto, ações à direita e as seções em abas sublinhadas.
 */
export function CabecalhoDoProcesso({ process }: { process: Process | null }) {
  const params = useParams()
  const processId = String(params.id)

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/process"
        className="inline-flex w-fit items-center gap-1.5 text-[13px] text-tinta-3 transition hover:text-tinta"
      >
        <ArrowLeft size={14} />
        Processos
      </Link>

      {process && (
        <div className="flex flex-wrap items-end gap-5">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] bg-nevoa text-turquesa-profundo max-md:h-12 max-md:w-12">
            <Scale size={26} strokeWidth={1.5} />
          </span>

          <div className="flex min-w-0 flex-grow flex-col gap-2">
            <span className="rotulo">Processo</span>
            <h1 className="tabular font-display text-[40px] leading-none break-all text-tinta max-md:text-[26px]">
              {formatProcess(process?.number)}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5 text-[13.5px] text-tinta-2">
              <ProcessBadge variant={process?.status} />
              {process?.customer?.name && (
                <Link
                  href={`/customer/${process.customer._id}/personal-information`}
                  className="hover:text-tinta hover:underline"
                >
                  {process.customer.name}
                </Link>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Form process={process} />
            <DialogDeleteProcess number={process?.number ?? ""} />
          </div>
        </div>
      )}

      <CustomTab tabs={navLinks(processId)} />
    </div>
  )
}
