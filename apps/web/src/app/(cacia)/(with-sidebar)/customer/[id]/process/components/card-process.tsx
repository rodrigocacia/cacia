import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronRight, Scale } from "lucide-react"

import { ProcessBadge } from "@/components/ui/badge/proccess.badge"
import { ProcessStatus } from "@/types/process"
import { formatProcess } from "@/utils/formatters"

interface CardProcessProps {
  process: {
    _id: string
    unit: string
    number: string
    status: ProcessStatus
    updated_at: string
  }
}

/** Linha de processo dentro da ficha do cliente. */
export function CardProcess({ process }: CardProcessProps) {
  const formattedDate = process?.updated_at
    ? format(new Date(process.updated_at), "dd MMM yyyy", {
        locale: ptBR,
      })
    : null

  return (
    <li className="border-b border-[#F1EEE8] last:border-b-0">
      <Link
        href={`/process/${process?._id}/information`}
        className="flex min-h-14 items-center gap-3 px-5 py-2.5 transition-colors hover:bg-papel"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-nevoa text-turquesa-profundo">
          <Scale size={15} strokeWidth={1.7} />
        </span>

        <div className="flex min-w-0 flex-grow flex-col">
          <span className="tabular truncate text-[13.5px] font-medium text-tinta">
            {formatProcess(process?.number)}
          </span>
          <span className="truncate text-xs text-tinta-3">
            {[process?.unit, formattedDate && `atualizado em ${formattedDate}`]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>

        <ProcessBadge variant={process?.status} />
        <ChevronRight
          size={16}
          className="shrink-0 text-tinta-3 max-sm:hidden"
        />
      </Link>
    </li>
  )
}
