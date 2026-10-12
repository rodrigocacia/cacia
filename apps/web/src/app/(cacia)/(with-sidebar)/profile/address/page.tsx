import { getOfficeById } from "@/http/office/get-office-by-id"

import { Form } from "./form"

export default async function Address() {
  const office = await getOfficeById()

  return <Form address={office?.address[0]} />
}
