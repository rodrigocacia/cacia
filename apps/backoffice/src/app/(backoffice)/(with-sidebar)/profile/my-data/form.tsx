"use client";

import { useState } from "react";
import { Icon } from "@/components/icone";

import { Button } from "@/components/ui/custom-button";
import { Input } from "@/components/ui/custom-input";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputPhone } from "@/components/ui/custom-input-phone";
import { formatDocument } from "@/utils/formatters";
import { updateMe } from "@/http/user/update-me";
import { Toast } from "@/components/ui/toast";
import { useMe } from "@/http/hooks/user";
import { revalidateProfile } from "../actions";

function formatPhoneToE164(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("55")) {
    return `+${cleaned}`;
  }
  return `+55${cleaned}`;
}

interface FormProps {
  name: string;
  document: string;
  phone: string;
}

const formSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  document: z.string().refine(
    (val) => {
      const cleanVal = val.replace(/\D/g, "");
      return cleanVal.length === 11 || cleanVal.length === 14;
    },
    { message: "Insira um CPF ou CNPJ válido" },
  ),
  phone: z.string().min(14, { message: "Telefone é obrigatório" }),
});

type FormData = z.infer<typeof formSchema>;

export function Form({ name, document, phone }: FormProps) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const { mutate } = useMe();

  const {
    handleSubmit,
    register,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name,
      document: document ? formatDocument(document) : "",
      phone: formatPhoneToE164(phone),
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      const result = await updateMe({
        name: data.name,
        document: data.document,
        phone: data.phone,
      });

      if (!result.success) {
        setHasError(true);
        setErrorMessage(result.error);
        return;
      }

      setIsSuccess(true);
      await mutate();
      await revalidateProfile();
    } catch {
      setHasError(true);
      setErrorMessage("Erro interno no servidor");
    }
  };

  return (
    <div className="h-full w-full p-8 max-md:p-0 pb-6 md:rounded-2xl md:shadow-sm md:pb-0">
      <div className="flex items-center gap-3">
        <Icon
          icon="mdi:person-circle-outline"
          className="w-8 h-8 text-[#BDBDBD]"
        />

        <h3 className="text-[20px] text-[#707070] font-bold">Meus dados</h3>
      </div>

      <hr className="w-full my-4 max-md:my-2 h-px border-t-0 bg-gray-200" />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full mt-6 flex flex-col justify-between gap-8 pb-10"
      >
        <div className="w-full flex flex-col gap-4">
          <Input
            iconName="person"
            label="Nome Completo"
            aria-label="Nome"
            autoComplete="name"
            {...register("name")}
            error={errors?.name}
          />

          <div className="w-full flex gap-6 items-center justify-between max-md:flex-col max-md:gap-4">
            <div className="w-full">
              <Input
                iconName="contact"
                label="CPF / CNPJ"
                mask="cpfCnpj"
                aria-label="Nome"
                {...register("document")}
                error={errors?.document}
              />
            </div>

            <div className="w-full">
              <InputPhone
                control={control}
                name="phone"
                label="Telefone"
                error={errors?.phone}
              />
            </div>
          </div>
        </div>

        <div className="w-full flex items-center justify-end max-md:flex-col max-md:gap-4 mt-8 max-md:pb-10">
          <Button
            type="submit"
            disabled={isSubmitting}
            iconLeft={
              <Icon icon="mdi:content-save" className="w-6 h-6 text-white" />
            }
            isLoading={isSubmitting}
            className="px-10 cursor-pointer max-md:w-full"
            variant="primary"
          >
            Salvar
          </Button>
        </div>
      </form>

      {isSuccess && (
        <Toast
          onClose={() => setIsSuccess(false)}
          variant="successSolid"
          title="Dados atualizados com sucesso!"
          description="Os dados foram atualizados com sucesso!"
        />
      )}

      {hasError && (
        <Toast
          onClose={() => setHasError(false)}
          variant="errorSolid"
          title="Erro ao atualizar os dados!"
          description={errorMessage}
        />
      )}
    </div>
  );
}
