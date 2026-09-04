/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { SubmitHandler, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from "next/navigation"

import { Icon } from "@iconify/react/dist/iconify.js"

import { Button, Button as CustomButton } from "@/components/ui/custom-button"
import { Input } from "@/components/ui/custom-input"

import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import { DialogTitle } from "@radix-ui/react-dialog"
import Image from "next/image"
import { AiOutlinePlus } from "react-icons/ai"
import { createFolder } from "@/http/folder/create-folder"
import { useState } from "react"
import { Toast } from "@/components/ui/toast"

const createFolderFormSchema = z.object({
  title: z.string().min(2, { message: "Insira um nome válido" }),
})

export type CreateFolderFormData = z.infer<typeof createFolderFormSchema>

interface FormComponentProps {
  setOpen(value: boolean): void
  handleOpenSuccess(): void
}

function FormComponent({ setOpen, handleOpenSuccess }: FormComponentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get("returnTo")

  const {
    handleSubmit,
    register,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateFolderFormData>({
    resolver: zodResolver(createFolderFormSchema),
  })

  const onSubmit: SubmitHandler<CreateFolderFormData> = async (data) => {
    try {
      const { title } = data

      await createFolder({ title })

      setOpen(false)

      handleOpenSuccess()
    } catch (err: any) {
      if (err.message === "Customer with this email already exists") {
        const message = await err.response.json()

        if (message === "Customer with this email already exists") {
          setError("title", {
            type: "manual",
            message: "Já existe uma pasta com este nome.",
          })
        }

        return
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="px-4 pb-6 w-full h-screen flex flex-col max-md:overflow-y-scroll"
    >
      <div className="mt-10 flex flex-col gap-3">
        <div className="flex gap-2">
          <Icon
            icon="mdi:add-circle-outline"
            className="text-[#BBE2E7] w-[30px] h-[30px]"
          />

          <h3 className="text-xl text-[#3D3D3D] font-bold">Nova pasta</h3>
        </div>
      </div>

      <div className="flex h-full flex-col justify-between  gap-5 mt-10">
        <Input
          {...register("title")}
          label="Nome"
          iconName="edit"
          placeholder="Insira o nome da pasta..."
          error={errors?.title}
        />

        <div className="flex items-center justify-between">
          <CustomButton
            type="button"
            className="w-[251px] cursor-pointer"
            variant="outline"
            onClick={() => {
              if (returnTo) {
                router.push(decodeURIComponent(returnTo))
              } else {
                setOpen(false)
              }
            }}
          >
            Cancelar
          </CustomButton>

          <CustomButton
            type="submit"
            className="px-10 cursor-pointer"
            variant="primary"
            isLoading={isSubmitting}
            iconRight={
              !isSubmitting ? (
                <Image
                  src="/icons/arrow-right.svg"
                  alt=""
                  width={24}
                  height={24}
                />
              ) : null
            }
          >
            Criar pasta
          </CustomButton>
        </div>
      </div>
    </form>
  )
}

export function Form() {
  const [openSheet, setOpenSheet] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [openSuccess, setOpenSuccess] = useState(false)

  const handleOpenSuccess = () => {
    setOpenSuccess(true)
  }

  return (
    <div>
      <div className="h-full max-md:hidden">
        <Sheet open={openSheet} onOpenChange={setOpenSheet}>
          <SheetTrigger asChild>
            <Button
              className="cursor-pointer"
              iconLeft={<AiOutlinePlus size={20} />}
            >
              Nova pasta
            </Button>
          </SheetTrigger>

          <SheetContent className="min-w-[707px] rounded-tl-[24px] rounded-bl-[24px]">
            <SheetTitle className="sr-only">Nova pasta</SheetTitle>

            <FormComponent
              setOpen={setOpenSheet}
              handleOpenSuccess={handleOpenSuccess}
            />
          </SheetContent>
        </Sheet>
      </div>

      <div className="md:hidden">
        <Drawer
          open={openDrawer}
          onOpenChange={(value) => setOpenDrawer(value)}
        >
          <DrawerTrigger className="md:hidden fixed w-[56px] h-[56px] bottom-6 right-6 bg-teal-500 hover:bg-teal-600 text-white rounded-full shadow-lg text-xl">
            +
          </DrawerTrigger>

          <DrawerContent className="h-full">
            <DialogTitle className="sr-only">Nova pasta</DialogTitle>

            <FormComponent
              setOpen={setOpenDrawer}
              handleOpenSuccess={handleOpenSuccess}
            />
          </DrawerContent>
        </Drawer>
      </div>

      {openSuccess && (
        <Toast
          onClose={() => setOpenSuccess(false)}
          variant="successSolid"
          title="Pasta adicionada!"
          description="A nova pasta foi adicionada com sucesso."
        />
      )}
    </div>
  )
}
