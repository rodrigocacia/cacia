import { SWRConfig } from "swr"

import { getOfficeById } from "@/http/office/get-office-by-id"

import { Form } from "./form"

export default function ProfessionalData() {
  const office = getOfficeById()

  return (
    <SWRConfig
      value={{
        fallback: {
          office: office,
        },
        revalidateOnFocus: false,
        revalidateIfStale: false,
        revalidateOnReconnect: false,
        refreshInterval: 0,
      }}
    >
      <Form />
    </SWRConfig>
  )
}
