"use client"

import { CardProgress } from "./components/card-process"
import { Painel, Vazio } from "@/components/tables/ficha"
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
    <Painel
      titulo="Andamentos do processo"
      contagem={totalItems ?? 0}
      semPreenchimento
    >
      {isLoading && <Spinner />}

      {!isLoading && progress?.length === 0 ? (
        <Vazio>Nenhum andamento registrado neste processo.</Vazio>
      ) : (
        <ol className="flex flex-col">
          {progress?.map((progres) => (
            <CardProgress key={progres._id} progress={progres} />
          ))}
        </ol>
      )}

      {totalPages > 1 && (
        <div className="border-t border-filete px-5 py-3">
          <CustomPagination
            totalItems={totalItems}
            totalPages={totalPages}
            currentPage={currentPage}
            perPage={perPage}
          />
        </div>
      )}
    </Painel>
  )
}
