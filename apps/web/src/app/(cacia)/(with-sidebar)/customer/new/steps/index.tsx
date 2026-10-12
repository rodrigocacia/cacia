"use client"

import { useEffect, useState } from "react"
import { Steps } from "@/components/ui/steps"

import { Address } from "./address"
import { PersonalData } from "./personal-data"
import { FormProvider, useForm } from "react-hook-form"
import { CustomerFormData, customerFormSchema } from "@/schemas/customer"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from "next/navigation"
import { Customer } from "@/types/customer"
import { Lead } from "@/types/lead"

import { useIsMobile } from "@/hooks/use-mobile"
import { DrawerOrSheet } from "@/components/drawer-or-sheet"
import { CabecalhoDoFormulario } from "@/components/drawer-or-sheet/partes"

//
const stepsAccount = [
  { id: 0, title: "Dados Pessoais" },
  { id: 1, title: "Endereço" },
]

interface FormComponentProps {
  setOpen(value: boolean): void
  handleOpenSuccess(): void
  customer?: Customer | null
  lead?: Lead | null
  hasTrigger?: boolean
}

function FormComponent({
  setOpen,
  handleOpenSuccess,
  customer,
  lead,
}: FormComponentProps) {
  const [step, setStep] = useState(0)
  const router = useRouter()
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
        document:
          customer.document.length === 11
            ? customer.document.replace(
                /(\d{3})(\d{3})(\d{3})(\d{2})/,
                "$1.$2.$3-$4"
              )
            : customer.document.replace(
                /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
                "$1.$2.$3/$4-$5"
              ),
        type_document: customer?.document.length === 11 ? "CPF" : "CNPJ",
        cep: address?.cep ?? "",
        street: address?.street ?? "",
        number: address?.number ?? "",
        neighborhood: address?.neighborhood ?? "",
        city: address?.city ?? "",
        state: address?.state ?? "",
      })
    }

    if (lead) {
      methods.reset({
        name: lead.name,
        remotejid: lead.remotejid,
      })
    }
  }, [customer, lead, methods])

  function nextStep() {
    setStep(step + 1)
  }

  function lastStep() {
    setStep(step - 1)
  }

  function close() {
    setStep(0)
    setOpen(false)

    methods.reset()
    router.refresh()
    router.push("/customer")
  }

  const steps = [
    <PersonalData key="personal" nextStep={nextStep} close={close} />,
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
      <div className="flex h-screen w-full flex-col gap-7 overflow-y-auto pb-6 max-md:h-[85vh]">
        <CabecalhoDoFormulario
          rotulo="Clientes"
          titulo={customer ? "Editar cliente" : "Novo cliente"}
          descricao={
            customer
              ? "Atualize os dados do cliente em duas etapas."
              : "Preencha os campos abaixo para cadastrar o novo cliente."
          }
        />

        <Steps steps={stepsAccount} currentStep={step} />

        {steps[step]}
      </div>
    </FormProvider>
  )
}

interface FormProps {
  customer?: Customer | null
  hasTrigger?: boolean
  lead?: Lead | null
}

export function Form({ customer, hasTrigger = true, lead }: FormProps) {
  const [openSheet, setOpenSheet] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()

  const createCustomer = searchParams.get("createCustomer")
  const editId = searchParams.get("editId")
  const action = searchParams.get("action")
  const leadId = searchParams.get("leadId")

  const isMobile = useIsMobile()

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("editId")
    params.delete("action")
    params.delete("leadId")
    params.delete("createCustomer")
    router.push(`/customer?${params.toString()}`)

    setOpenSheet(false)
    setOpenDrawer(false)
  }

  useEffect(() => {
    const shouldOpen =
      editId || createCustomer || (action === "customer" && leadId)
    if (shouldOpen && isMobile) {
      setOpenDrawer(true)
    } else if (shouldOpen && !isMobile) {
      setOpenSheet(true)
    } else {
      setOpenSheet(false)
      setOpenDrawer(false)
    }

    return () => {
      setOpenDrawer(false)
      setOpenSheet(false)
    }
  }, [editId, createCustomer, isMobile, action, leadId])

  const handleOpenSuccess = () => {
    // função mantida para compatibilidade, mas não faz nada
  }

  function handleNewCustomer() {
    router.push("/customer?createCustomer=true")
  }

  return (
    <DrawerOrSheet
      open={openDrawer || openSheet}
      close={handleClose}
      hasTrigger={hasTrigger}
      triggerLabel="Novo cliente"
      onTriggerClick={handleNewCustomer}
    >
      <FormComponent
        setOpen={setOpenDrawer}
        handleOpenSuccess={handleOpenSuccess}
        customer={customer}
        lead={lead}
      />
    </DrawerOrSheet>
  )
}
