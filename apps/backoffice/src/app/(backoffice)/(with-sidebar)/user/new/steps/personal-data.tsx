"use client";

import { mutate } from "swr";
import { ArrowRight } from "lucide-react";
import { RodapeDoFormulario } from "@/components/drawer-or-sheet/partes";
import { useFormContext, type FieldError } from "react-hook-form";

import { Button as CustomButton } from "@/components/ui/custom-button";
import { Input } from "@/components/ui/custom-input";

import { UserUpdateFormData, UserFormData } from "@/schemas/user";

import { updateUserAction, createUserAction } from "../../actions";
import { Toast } from "@/components/ui/toast";
import { useState } from "react";
import { InputPhone } from "@/components/ui/custom-input-phone";
import { mensagemDeErro } from "@/http/mensagem-de-erro";

export function PersonalData({
  editId,
  handleOpenSuccess,
  onClose,
}: {
  editId: string;
  handleOpenSuccess: () => void;
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    control,
  } = useFormContext<UserUpdateFormData | UserFormData>();

  const [showToast, setShowToast] = useState(false);
  const [toastConfig, setToastConfig] = useState<{
    title: string;
    description: string;
    variant: "success" | "error" | "alert" | "successSolid" | "errorSolid";
  }>({
    title: "",
    description: "",
    variant: "success",
  });

  const isEditing = !!editId;

  const onSubmit = async (data: UserUpdateFormData | UserFormData) => {
    const fieldsToValidate = isEditing
      ? (["name", "email", "phone", "birthday", "document"] as const)
      : ([
          "name",
          "email",
          "phone",
          "birthday",
          "document",
          "password",
          "confirmPassword",
        ] as const);

    const isValid = await trigger(fieldsToValidate);

    if (isValid) {
      try {
        let result;

        if (isEditing) {
          const userData = data as UserUpdateFormData;
          result = await updateUserAction({
            id: editId,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            birthday: userData.birthday,
            document: userData.document,
          });

          if (result.success) {
            setToastConfig({
              title: "Sucesso!",
              description: "Usuário atualizado com sucesso!",
              variant: "successSolid",
            });
            await mutate((key) => Array.isArray(key) && key[0] === "user");
            handleOpenSuccess();
            onClose();
          } else {
            setToastConfig({
              title: "Erro!",
              description: mensagemDeErro(
                "error" in result ? result.error : null,
                "Erro ao atualizar usuário",
              ),
              variant: "errorSolid",
            });
          }
        } else {
          const userData = data as UserFormData;
          result = await createUserAction({
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            birthday: userData.birthday,
            document: userData.document,
            password: userData.password,
          });

          if (result.success) {
            setToastConfig({
              title: "Sucesso!",
              description: "Usuário criado com sucesso!",
              variant: "successSolid",
            });
            await mutate((key) => Array.isArray(key) && key[0] === "user");
            handleOpenSuccess();
            onClose();
          } else {
            setToastConfig({
              title: "Erro!",
              description: mensagemDeErro(
                "error" in result ? result.error : null,
                "Erro ao criar usuário",
              ),
              variant: "errorSolid",
            });
          }
        }

        setShowToast(true);
      } catch (error) {
        console.error("Erro inesperado ao processar usuário:", error);
        setToastConfig({
          title: "Erro!",
          description: "Erro inesperado ao processar usuário",
          variant: "errorSolid",
        });
        setShowToast(true);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-grow flex-col"
    >
      <div className="flex flex-grow flex-col gap-5">
        <Input
          {...register("name")}
          label="Nome"
          iconName="person"
          placeholder="Insira o nome do usuário..."
          error={errors?.name}
        />

        <InputPhone
          control={control}
          label="Telefone (WhatsApp)"
          placeholder="Insira o número de telefone..."
          name="phone"
          error={errors?.phone}
        />

        <Input
          {...register("email")}
          label="E-mail"
          iconName="mail"
          placeholder="Insira o e-mail do usuário..."
          error={errors?.email}
        />

        <Input
          {...register("birthday")}
          label="Data de nascimento"
          type="date"
          placeholder="Insira a data de nascimento do usuário..."
          error={errors?.birthday}
        />

        <Input
          {...register("document")}
          label="CPF / CNPJ"
          mask="cpfCnpj"
          placeholder="000.000.000-00 ou 00.000.000/0000-00"
          iconName="person"
          error={errors?.document}
        />

        {!isEditing && (
          <>
            <Input
              {...register("password")}
              label="Senha"
              type="password"
              placeholder="Insira a senha..."
              error={(errors as Record<string, FieldError>)?.password}
            />

            <Input
              {...register("confirmPassword")}
              label="Confirmar senha"
              type="password"
              placeholder="Confirme a senha..."
              error={(errors as Record<string, FieldError>)?.confirmPassword}
            />
          </>
        )}

        <RodapeDoFormulario>
          <CustomButton
            type="button"

            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </CustomButton>

          <CustomButton
            type="submit"
            className="px-6"
            variant="primary"
            iconRight={<ArrowRight size={16} strokeWidth={1.8} />}
          >
            {isEditing ? "Salvar" : "Criar usuário"}
          </CustomButton>
        </RodapeDoFormulario>
      </div>

      {showToast && (
        <Toast
          title={toastConfig.title}
          description={toastConfig.description}
          variant={toastConfig.variant}
          onClose={() => setShowToast(false)}
        />
      )}
    </form>
  );
}
