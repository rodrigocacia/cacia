"use client"

import { Icon } from "@iconify/react/dist/iconify.js"
import { DialogDeleteFolder } from "./components/dialog-delete-folder"
import { Toast } from "@/components/ui/toast"
import { useState } from "react"

export function Sidebar({ name, id }: { name: string; id: string }) {
  const [isSuccess, setIsSuccess] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  return (
    <aside className="w-full h-fit shadow-md rounded-2xl py-4 px-5 space-y-6 md:space-y-0 max-md:hidden">
      <div className="w-full flex flex-col items-center gap-3">
        <div className="flex w-[86px] h-[86px] items-center justify-center bg-[#ECF7F8] rounded-[30px]">
          <Icon
            icon="mdi:folder-open"
            className="w-[46px] h-[46px] text-[#348C98]"
          />
        </div>

        <div className="flex flex-col items-center gap-2">
          <h2 className="text-[18px] text-[#3D3D3D] font-semibold">{name}</h2>
        </div>
      </div>

      <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200" />

      <DialogDeleteFolder
        id={id}
        name={name}
        setIsSuccess={setIsSuccess}
        setHasError={setHasError}
        setErrorMessage={setErrorMessage}
      />

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
    </aside>
  )
}
