"use client"

import { useState } from "react"
import Link from "next/link"

import { ArrowLeft, FolderOpen } from "lucide-react"

import { Toast } from "@/components/ui/toast"

import { DialogDeleteFolder } from "./components/dialog-delete-folder"

/** Cabeçalho da pasta: nome em serifa, contagem e a ação de excluir. */
export function CabecalhoDaPasta({
  name,
  id,
  total,
  sistema,
}: {
  name?: string
  id?: string
  total?: number
  sistema?: boolean
}) {
  const [isSuccess, setIsSuccess] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/document"
        className="inline-flex w-fit items-center gap-1.5 text-[13px] text-tinta-3 transition hover:text-tinta"
      >
        <ArrowLeft size={14} />
        Documentos
      </Link>

      {name && id && (
        <div className="flex flex-wrap items-end gap-5 border-b border-filete pb-6">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] bg-nevoa text-turquesa-profundo max-md:h-12 max-md:w-12">
            <FolderOpen size={26} strokeWidth={1.5} />
          </span>

          <div className="flex min-w-0 flex-grow flex-col gap-2">
            <span className="rotulo">Pasta</span>
            <h1 className="font-display text-[40px] leading-none break-words text-tinta max-md:text-[30px]">
              {name}
            </h1>
            {total !== undefined && (
              <p className="tabular text-[13.5px] text-tinta-2">
                {total} {total === 1 ? "arquivo" : "arquivos"}
                {sistema && " · pasta do sistema"}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <DialogDeleteFolder
              id={id}
              name={name}
              setIsSuccess={setIsSuccess}
              setHasError={setHasError}
              setErrorMessage={setErrorMessage}
            />
          </div>
        </div>
      )}

      {isSuccess && (
        <Toast
          onClose={() => setIsSuccess(false)}
          variant="successSolid"
          title="Pasta excluída com sucesso!"
          description="A pasta foi excluída com sucesso."
        />
      )}

      {hasError && (
        <Toast
          onClose={() => setHasError(false)}
          variant="errorSolid"
          title={errorMessage}
          description={errorMessage}
        />
      )}
    </div>
  )
}
