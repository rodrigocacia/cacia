"use client"

import { Suspense } from "react"

import { Icon } from "@/components/icone"

import { Form } from "./new/form"
import { QuestionsTable } from "@/components/tables/questions-table"
import { DialogDeleteQuestion } from "./components/dialog-delete-question"

import { CustomSearchFilter } from "@/components/ui/custom-search-filter"

export function QuestionDetail() {
  return (
    <div className="p-8 max-md:p-0 md:rounded-2xl md:shadow-sm">
      <div className="w-full flex items-center justify-between  max-md:hidden">
        <div className="flex items--center gap-3">
          <Icon
            icon="mingcute:question-fill"
            className="text-[#BDBDBD] w-8 h-8"
          />

          <h3 className="text-[20px] text-[#707070] font-bold">
            Dúvidas frequentes
          </h3>
        </div>

        <Form setting={true} />
      </div>

      <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200 max-md:hidden" />

      <div className="flex flex-col gap-5 max-md:mt-5">
        <Suspense fallback="Carregando...">
          <CustomSearchFilter placeholder="Buscar por nome" />
        </Suspense>

        <QuestionsTable />
      </div>

      <div className="md:hidden">
        <Form setting={true} />
      </div>

      <DialogDeleteQuestion />
    </div>
  )
}
