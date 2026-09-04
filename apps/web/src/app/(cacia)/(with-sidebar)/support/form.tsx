"use client"

import {
  Controller,
  //  SubmitHandler,
  useForm,
} from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

// import { Button } from "@/components/ui/button"
import { Button as CustomButton } from "@/components/ui/custom-button"
import { Input } from "@/components/ui/custom-input"
import { CustomSelect } from "@/components/ui/custom-select"
import { CustomTextarea } from "@/components/ui/custom-textarea"

import {
  Drawer,
  //   DrawerClose,
  DrawerContent,
  //   DrawerDescription,
  //   DrawerFooter,
  //   DrawerHeader,
  //   DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { BiLeftArrowAlt } from "react-icons/bi"
import { Check } from "lucide-react"

const areasDeAtuacao = [
  { value: "tecnologia", label: "Tecnologia" },
  { value: "saude", label: "Saúde" },
  { value: "educacao", label: "Educação" },
  { value: "financas", label: "Finanças" },
  { value: "marketing", label: "Marketing" },
  { value: "design", label: "Design" },
  { value: "juridico", label: "Jurídico" },
  { value: "rh", label: "Recursos Humanos" },
]

const createProfessionalDataFormSchema = z.object({
  document: z.string().min(9, { message: "Insira um documento válido" }),
  fantasy_name: z.string().min(6, { message: "Insira pelo menos 6 letras" }),
  social_reason: z.string().min(6, { message: "Insira pelo menos 6 letras" }),
  biography: z.string().min(6, { message: "Insira pelo menos 6 letras" }),
  areaDeAtuacao: z.string().min(6, { message: "Insira pelo menos 6 letras" }),
  cep: z.string().min(4, { message: "Insira pelo menos 4 números" }),
  lougradouro: z.string().min(4, { message: "Insira pelo menos 4 letras" }),
  bairro: z.string().min(4, { message: "Insira pelo menos 4 letras" }),
  cidade: z.string().min(6, { message: "Insira pelo menos 6 letras" }),
  estado: z.string().min(6, { message: "Insira pelo menos 6 letras" }),
})

export type CreateProfessionalDataFormData = z.infer<
  typeof createProfessionalDataFormSchema
>

function FormComponent() {
  const {
    control,
    // register,
    // handleSubmit,
    // setValue,
    // watch,
    // formState: { errors },
  } = useForm<CreateProfessionalDataFormData>({
    resolver: zodResolver(createProfessionalDataFormSchema),
  })

  return (
    <form className="px-4 pb-6 w-full h-screen max-md:overflow-y-scroll">
      <div className="mt-10 flex flex-col gap-3">
        <div className="">
          <h3 className="text-xl text-[#3D3D3D] font-bold">
            Falar com o suporte
          </h3>
        </div>

        <p className="text-base text-[#BDBDBD]">
          Ficou alguma dúvida ou surgiu algum problema? Nosso time de suporte
          ficará feliz em te ajudar
        </p>
      </div>

      <div className="flex flex-col gap-5 mt-10">
        <Input label="Assunto" />

        <Controller
          name="areaDeAtuacao"
          control={control}
          render={({ field }) => (
            <CustomSelect
              label="Categoria"
              options={areasDeAtuacao}
              value={field.value}
              onChange={field.onChange}
              iconName="work"
            />
          )}
        />

        <CustomTextarea label="Mensagem" />

        <div className="flex items-center justify-between">
          <CustomButton
            type="button"
            //   onClick={lastStep}
            className="w-[251px] cursor-pointer"
            variant="outline"
            iconLeft={<BiLeftArrowAlt size={24} />}
          >
            Cancelar
          </CustomButton>
          <CustomButton
            type="button"
            onClick={() => {}}
            className="px-10 cursor-pointer"
            variant="primary"
            iconLeft={<Check />}
          >
            Enviar
          </CustomButton>
        </div>
      </div>
    </form>
  )
}

export function Form() {
  return (
    <div>
      <div className="max-md:hidden">
        <FormComponent />
      </div>

      <div className="md:hidden">
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>

          <DrawerContent className="h-full">
            <FormComponent />
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  )
}
