"use client"

import { FormService } from "./form"
import { DialogDeleteService } from "@/app/(cacia)/(with-sidebar)/setting/(custom-sidebar)/service/components/dialog-delete-service"

export function Service() {
  return (
    <>
      <FormService />
      <DialogDeleteService />
    </>
  )
}
