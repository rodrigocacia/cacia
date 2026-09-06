"use client"

import { useOnboardingStore } from "@/stores/use-onboard-store"

import { Button } from "@/components/ui/custom-button"

import { HeaderSteps } from "../components/header-steps"
import { Form } from "@/app/(cacia)/(with-sidebar)/setting/(custom-sidebar)/service/new/form"
import { ServiceTable } from "@/components/tables/service-table"
import { Icon } from "@/components/icone"

export function FormService() {
  const { nextStep, prevStep } = useOnboardingStore()

  return (
    <div className="bg-white relative z-10 w-full h-full max-lg:h-fit flex flex-col justify-center shadow-md rounded-r-4xl px-8 pt-[28px] max-lg:pb-4">
      <HeaderSteps />
      <div className="w-full flex items-center justify-between max-md:mt-4 mt-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Icon icon="octicon:law-16" className="text-[#BDBDBD] w-8 h-8" />
            <h3 className="text-[20px] text-[#348C98] font-bold">
              Serviços oferecidos
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-sm font-normal text-[#3D3D3D]">
              Cadastre os serviços mais comuns. Uso como base para orçamentos e
              aprovação.
            </p>
          </div>
        </div>

        <div className="max-md:hidden">
          <Form />
        </div>
      </div>

      <div className="md:hidden flex justify-between mt-8">
        <div />
        <Form />
      </div>

      <hr className="w-full mt-4 max-md:my-2 h-px border-t-0 bg-gray-200 max-md:hidden" />

      <ServiceTable />

      <div className="flex items-center justify-between mt-8 mb-7">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-[251px] max-lg:w-full cursor-pointer"
            onClick={() => prevStep()}
            iconLeft={
              <Icon icon="mdi:arrow-left" className="w-6 h-6 text-[#707070]" />
            }
          >
            Voltar
          </Button>
        </div>

        <Button
          type="button"
          className="w-[251px] max-lg:w-fit cursor-pointer"
          variant="primary"
          onClick={() => {
            nextStep()
          }}
          iconRight={
            <Icon icon="mdi:arrow-right" className="w-6 h-6 text-white" />
          }
        >
          Prosseguir
        </Button>
      </div>
    </div>
  )
}
