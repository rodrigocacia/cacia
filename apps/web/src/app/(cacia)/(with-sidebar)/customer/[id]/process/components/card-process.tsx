import { Icon } from "@/components/icone"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

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

export function CardProcess({ process }: CardProcessProps) {
  const formattedDate = process?.updated_at
    ? format(new Date(process.updated_at), "dd 'de' MMMM',' yyyy", {
        locale: ptBR,
      })
    : "Data não disponível"

  return (
    <Link
      href={`/process/${process?._id}/information`}
      className="px-2 py-3 flex gap-2.5 border border-[#F6F6F9] rounded-[12px]"
    >
      <div className="w-11 h-11 flex items-center justify-center rounded-[12px] bg-[#ECF7F8]">
        <Icon icon="mdi:folder-text" className="w-6 h-6 text-[#348C98]" />
      </div>

      <div className="w-full flex flex-col gap-2">
        <div className="w-full flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm text-[#707070] font-semibold">Processo</h3>
            <h3 className="text-sm text-[#707070] font-semibold">
              {formatProcess(process?.number)?.length > 15
                ? `${formatProcess(process?.number).slice(0, 15)}...`
                : formatProcess(process?.number)}
            </h3>
          </div>

          <ProcessBadge variant={process?.status} />
        </div>

        <p className="text-xs text-[#707070]">{process?.unit}</p>

        <strong className="text-[10px] text-[#707070] mt-1 ">
          Última atualização: <span>{formattedDate}</span>
        </strong>
      </div>
    </Link>
  )
}
