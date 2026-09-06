import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Icon } from "@/components/icone"
import { Progress } from "@/types/progress"

interface CardProgressProps {
  progress: Progress
}

export function CardProgress({ progress }: CardProgressProps) {
  const formattedDate = progress.release_at
    ? format(new Date(progress.release_at), "dd/MM/yyyy", { locale: ptBR })
    : ""

  return (
    <div className="px-2 py-3 flex gap-2.5 bg-white border border-[#F6F6F9] rounded-[12px]">
      <div className="w-full flex flex-col gap-2">
        <div className="w-full flex items-center justify-between">
          <h3 className="text-sm text-[#707070] font-semibold">
            {progress?.title}
          </h3>

          <div className="px-2 py-1 h-5 w-fit flex items-center justify-center gap-2">
            <Icon
              icon="mdi:calendar-month-outline"
              className="w-3.5 h-3.5 text-[#BDBDBD]"
            />

            <span className="text-[#BDBDBD] text-[10px] font-semibold">
              {formattedDate}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
