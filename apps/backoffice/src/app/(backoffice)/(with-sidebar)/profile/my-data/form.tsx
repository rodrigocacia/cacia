"use client";

import { useState } from "react";
import { Save } from "lucide-react";

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
    <section className="w-full rounded-[14px] border border-filete bg-white">
      <header className="flex flex-col gap-1 border-b border-filete px-6 py-4 max-sm:px-4">
        <h2 className="text-[14.5px] font-semibold text-tinta">Meus dados</h2>
        <p className="text-[13px] text-tinta-3">
          Nome, documento e telefone que aparecem no painel.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col">
        <div className="flex w-full flex-col gap-4 px-6 py-6 max-sm:px-4">
          <Input
            iconName="person"
            label="Nome completo"
            aria-label="Nome"
            autoComplete="name"
            {...register("name")}
            error={errors?.name}
          />

          <div className="flex w-full items-start justify-between gap-6 max-md:flex-col max-md:gap-4">
            <div className="w-full">
              <Input
                iconName="contact"
                label="CPF / CNPJ"
                mask="cpfCnpj"
                aria-label="CPF / CNPJ"
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

        <div className="flex w-full items-center justify-end border-t border-filete px-6 py-4 max-sm:px-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            iconLeft={<Save size={16} strokeWidth={1.7} aria-hidden />}
            isLoading={isSubmitting}
            className="px-6 max-sm:w-full"
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
    </section>
  );
}
