"use client"

import { Icon } from "@/components/icone"
import { CardProgress } from "./components/card-process"
import { EmptySearch } from "@/components/empty-search"
import { Process } from "@/types/process"
import { useProgress } from "@/http/hooks/progress"
import { CustomPagination } from "@/components/ui/custom-pagination"
import { Spinner } from "@/components/ui/sppiner"
import { useSearchParams } from "next/navigation"

interface ProgressDetailProps {
  process: Process
}

export function ProgressDetail({ process }: ProgressDetailProps) {
  const searchParams = useSearchParams()
  const page = Number(searchParams.get("page")) || 1

  const { progress, totalItems, totalPages, currentPage, perPage, isLoading } =
    useProgress(page, process._id)

  return (
    <div className="w-full h-fit p-8 max-md:p-0 pb-4 md:rounded-2xl md:shadow-sm">
      <div className="w-full flex items-center gap-3 max-md:hidden">
        <Icon
          icon="mdi:folder-file-outline"
          className="text-[#BDBDBD] w-8 h-8"
        />

        <h3 className="text-[20px] text-[#707070] font-bold">Andamentos</h3>
      </div>

      <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200 max-md:hidden" />

      <div className="w-full flex items-center gap-1 mt-[22px]">
        <Icon icon="mdi:folder-file" className="text-[#BDBDBD] w-5 h-5" />

        <h2 className="text-sm text-[#3D3D3D] font-bold">
          Andamento do processo ({totalItems})
        </h2>
      </div>

      <div className="w-full mt-6 flex flex-col justify-between gap-8">
        <div className="w-full flex flex-col gap-4">
          {isLoading && <Spinner />}

          {progress?.length === 0 ? (
            <EmptySearch title="Sem andamentos deste processo" subtitle="" />
          ) : null}

          <div className="grid grid-cols-2 gap-3 max-[1300px]:grid-cols-1">
            {progress?.map((progres) => (
              <CardProgress key={progres._id} progress={progres} />
            ))}
          </div>

          <CustomPagination
            totalItems={totalItems}
            totalPages={totalPages}
            currentPage={currentPage}
            perPage={perPage}
          />
        </div>
      </div>
    </div>
  )
}
