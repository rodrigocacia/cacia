import { PropsWithChildren } from "react"

import { getProcessById } from "@/http/process/get-process-by-id"

import { processDetailsCrumbs } from "@/constants/breadcrumbs"

import { Header } from "@/components/header"
import { Breadcrumbs } from "@/components/ui/custom-breadcrumb"
import { HeaderToGoBack } from "@/components/header-to-go-back"

import { Sidebar } from "./sidebar"

export default async function ProfileLayout({
  children,
  params,
}: PropsWithChildren<{ params: Promise<{ id: string }> }>) {
  const { id: processId } = await params

  let process
  try {
    process = await getProcessById(processId)
  } catch {
    return (
      <div className="w-full h-fit flex flex-col">
        <div className="max-md:hidden">
          <Header title="Processos" />
        </div>

        <div className="md:hidden">
          <HeaderToGoBack link="/process" />
        </div>

        <div className="w-full md:grid md:grid-cols-app mt-8 max-md:mt-0">
          <main className="px-4 pb-12 max-md:px-0 lg:col-start-2 max-md:pb-0">
            {children}
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-fit flex flex-col">
      <div className="max-md:hidden">
        <Header title="Processos" />

        <Breadcrumbs
          crumbs={processDetailsCrumbs(process?._id, process?.number)}
        />
      </div>

      <div className="md:hidden">
        <HeaderToGoBack link="/process" />
      </div>

      <div className=" md:grid md:grid-cols-app mt-8 max-md:mt-0">
        <Sidebar process={process} />

        <main className="px-4 pb-12 max-md:px-0 lg:col-start-2 max-md:pb-0">
          {children}
        </main>
      </div>
    </div>
  )
}
