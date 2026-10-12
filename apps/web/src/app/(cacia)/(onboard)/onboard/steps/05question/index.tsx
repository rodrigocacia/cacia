"use client"

import { FormQuestion } from "./form"
import { DialogDeleteQuestion } from "@/app/(cacia)/(with-sidebar)/setting/(custom-sidebar)/question/components/dialog-delete-question"

export function Question() {
  return (
    <>
      <FormQuestion />
      <DialogDeleteQuestion />
    </>
  )
}
