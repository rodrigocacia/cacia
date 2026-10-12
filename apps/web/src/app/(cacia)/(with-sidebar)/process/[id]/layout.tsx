import { PropsWithChildren } from "react"

import { getProcessById } from "@/http/process/get-process-by-id"

import { Header } from "@/components/header"

import { CabecalhoDoProcesso } from "./cabecalho"

export default async function ProfileLayout({
  children,
  params,
}: PropsWithChildren<{ params: Promise<{ id: string }> }>) {
  const { id: processId } = await params

  let process = null
  try {
    process = await getProcessById(processId)
  } catch {
    process = null
  }

  return (
    <div className="flex h-fit w-full flex-col max-lg:px-4">
      <Header title="Processos" />

      <CabecalhoDoProcesso process={process} />

      <main className="w-full pt-5 pb-12">{children}</main>
    </div>
  )
}
