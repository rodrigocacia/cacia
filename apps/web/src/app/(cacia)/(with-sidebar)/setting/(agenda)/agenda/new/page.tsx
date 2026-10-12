import { me } from "@/http/user/me"

import { FormComponent } from "./form"

export default async function Agenda() {
  const user = await me()

  // Uma instância só: com duas (uma por largura de tela), as duas
  // reescreviam o `?name=` da URL a cada tecla.
  return <FormComponent user={user} />
}
