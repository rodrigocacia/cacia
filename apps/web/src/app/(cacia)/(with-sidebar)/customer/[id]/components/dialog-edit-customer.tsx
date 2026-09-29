"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Icon } from "@/components/icone"
import { FormProvider, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Steps } from "@/components/ui/steps"
import { Address } from "../../new/steps/address"
import { PersonalData } from "../../new/steps/personal-data"
import { CustomerFormData, customerFormSchema } from "@/schemas/customer"
import { useCustomerById } from "@/http/hooks/customer"
import { Customer } from "@/types/customer"
import { formatDocument } from "@/utils/formatters"
import { DrawerOrSheet } from "@/components/drawer-or-sheet"

const stepsAccount = [
  { id: 0, title: "Dados Pessoais" },
  { id: 1, title: "Endereço" },
]

interface EditCustomerFormProps {
  handleOpenSuccess: () => void
  customer?: Customer | null
}

function EditCustomerForm({
  handleOpenSuccess,
  customer,
}: EditCustomerFormProps) {
  const [step, setStep] = useState(0)

  const methods = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      type_document: "CPF",
    },
  })

  useEffect(() => {
    if (customer) {
      const address = customer.address?.[0]

      methods.reset({
        ...customer,
        document: formatDocument(customer.document),
        type_document: customer?.document.length === 11 ? "CPF" : "CNPJ",
        cep: address?.cep ?? "",
        street: address?.street ?? "",
        number: address?.number ?? "",
        neighborhood: address?.neighborhood ?? "",
        city: address?.city ?? "",
        state: address?.state ?? "",
      })
    }
  }, [customer, methods])

  function nextStep() {
    setStep(step + 1)
  }

  function lastStep() {
    setStep(step - 1)
  }

  function close() {
    setStep(0)
    handleOpenSuccess()
  }

  const steps = [
    <PersonalData key="personal" nextStep={nextStep} close={close} editando />,
    <Address
      key="address"
      lastStep={lastStep}
      close={close}
      openSuccess={handleOpenSuccess}
      customer={customer}
    />,
  ]

  return (
    <FormProvider {...methods}>
      <div className="px-4 pb-6 w-full h-screen overflow-y-scroll">
        <div className="mt-10 flex flex-col gap-3 mb-10">
          <div className="flex gap-2">
            <Icon
              icon="mdi:add-circle-outline"
              className="text-[#BBE2E7] w-[30px] h-[30px]"
            />

            <h3 className="text-xl text-[#3D3D3D] font-bold">Editar cliente</h3>
          </div>

          <p className="text-base text-[#BDBDBD]">
            Edite os campos abaixo para atualizar o cliente
          </p>
        </div>

        <Steps steps={stepsAccount} currentStep={step} />

        {steps[step]}
      </div>
    </FormProvider>
  )
}

export function DialogEditCustomer() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const customerEditId = searchParams.get("editCustomerId")

  const { customer, isLoading } = useCustomerById(customerEditId ?? "")

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("editCustomerId")
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleNewCustomer() {
    router.push("/customer?createCustomer=true")
  }

  return (
    <DrawerOrSheet
      open={!!customerEditId}
      close={handleClose}
      hasTrigger={false}
      triggerLabel="Editar cliente"
      onTriggerClick={handleNewCustomer}
    >
      <div className="w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#348C98]"></div>
          </div>
        ) : (
          <EditCustomerForm
            customer={customer}
            handleOpenSuccess={handleClose}
          />
        )}
      </div>
    </DrawerOrSheet>
  )
}
