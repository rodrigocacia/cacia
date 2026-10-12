import { me } from "@/http/user/me"

import { Form } from "./form"

export default async function MyData() {
  const user = await me()

  return (
    <Form
      name={user?.name || ""}
      document={user?.document || ""}
      phone={user?.phone || ""}
    />
  )
}
