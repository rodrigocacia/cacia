"use client"

import { Icon } from "@/components/icone"

import { ServiceTable } from "@/components/tables/service-table"

import { Form } from "./new/form"
import { DialogDeleteService } from "./components/dialog-delete-service"

export default function ServiceDetail() {
  return (
    <div className="p-8 max-md:p-0 pb-4 md:rounded-2xl md:shadow-sm">
      <div className="w-full flex items-center justify-between  max-md:hidden">
        <div className="flex items--center gap-3">
          <Icon icon="octicon:law-16" className="text-[#BDBDBD] w-8 h-8" />

          <h3 className="text-[20px] text-[#707070] font-bold">
            Serviços oferecidos
          </h3>
        </div>

        <Form setting={true} />
      </div>

      <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200 max-md:hidden" />

      <div>
        <ServiceTable />
      </div>

      <div className="md:hidden">
        <Form setting={true} />
      </div>

      <DialogDeleteService />
    </div>
  )
}
