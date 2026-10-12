import { Header } from "@/components/header"
import { PageHeader } from "@/components/ui/page-header"

import { Form } from "./form"

export default function Support() {
  return (
    <div className="flex w-full flex-col pb-12 max-lg:px-4">
      <Header title="Suporte" />

      <PageHeader
        title="Suporte"
        description="Dúvidas sobre a CacIA ou algo que não funcionou como deveria."
      />

      <div className="mt-8 w-full max-w-[720px] max-md:mt-6">
        <Form />
      </div>
    </div>
  )
}
