"use client";

import Image from "next/image";
import { Controller, useFormContext } from "react-hook-form";

import { Button as CustomButton } from "@/components/ui/custom-button";
import { Input } from "@/components/ui/custom-input";
import { Textarea } from "@/components/ui/custom-textarea";

import { updateOfficeAction, createOfficeAction } from "../../actions";
import { OfficeFormData } from "@/schemas/office";
import { mutate } from "swr";
import { Toast } from "@/components/ui/toast";
import { useState } from "react";
import { InputPhone } from "@/components/ui/custom-input-phone";
import { CustomSelect } from "@/components/ui/custom-select";
import { ufs } from "@/constants/ufs";
import { getCepInformations } from "@/http/get-cep-informations";
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
    control,
    setValue,
  } = useFormContext<OfficeFormData>();

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

  const onSubmit = async (data: OfficeFormData) => {
    // Endereço vai como lista (`addresses`), no formato da API
    const enderecos = data.street
      ? [
          {
            street: data.street,
            number: data.number || "",
            neighborhood: data.neighborhood || "",
            city: data.city || "",
            state: data.state || "",
            cep: data.cep || "",
          },
        ]
      : [];

    try {
      const result = isEditing
        ? await updateOfficeAction({
            id: editId,
            name: data.name,
            legal_name: data.legal_name ?? "",
            trade_name: data.trade_name ?? "",
            remotejid: data.remotejid,
            description: data.description ?? "",
            oab_number: data.oab_number,
            oab_uf: data.oab_uf,
            addresses: enderecos,
          })
        : await createOfficeAction({
            name: data.name,
            document: data.document,
            legal_name: data.legal_name ?? "",
            trade_name: data.trade_name ?? "",
            remotejid: data.remotejid,
            description: data.description ?? "",
            oab_number: data.oab_number,
            oab_uf: data.oab_uf,
            owner_name: data.owner_name ?? "",
            owner_email: data.owner_email ?? "",
            owner_password: data.owner_password ?? "",
            addresses: enderecos,
          });

      if (result.success) {
        await mutate((key) => Array.isArray(key) && key[0] === "office");
        handleOpenSuccess();
        onClose();
        return;
      }

      setToastConfig({
        title: "Erro!",
        description: mensagemDeErro(
          "error" in result ? result.error : null,
          isEditing
            ? "Erro ao atualizar escritório"
            : "Erro ao criar escritório",
        ),
        variant: "errorSolid",
      });
      setShowToast(true);
    } catch (error) {
      console.error("Erro inesperado ao processar escritório:", error);
      setToastConfig({
        title: "Erro!",
        description: "Erro inesperado ao processar escritório",
        variant: "errorSolid",
      });
      setShowToast(true);
    }
  };

  const handleCepSearch = async (cep: string) => {
    if (cep.length === 9) {
      try {
        const cepData = await getCepInformations(cep.replace("-", ""));
        if (cepData && !cepData.erro) {
          setValue("street", cepData.logradouro);
          setValue("neighborhood", cepData.bairro);
          setValue("city", cepData.localidade);
          setValue("state", cepData.uf);
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="pb-6 w-full h-screen">
      <div className="flex flex-col gap-5 mt-10">
        <Input
          {...register("name")}
          label="Nome"
          iconName="person"
          placeholder="Insira o nome do cliente..."
          error={errors?.name}
        />

        {/*
          O documento é a identidade do escritório: a edição pelo painel não o
          altera (a API recusa o campo), então aparece só para leitura.
        */}
        <Input
          {...register("document")}
          label="CPF / CNPJ"
          mask="cpfCnpj"
          placeholder="000.000.000-00 ou 00.000.000/0000-00"
          iconName="person"
          readOnly={isEditing}
          error={errors?.document}
        />

        <Input
          {...register("legal_name")}
          label="Nome legal"
          iconName="person"
          placeholder="Insira o nome legal do cliente..."
          error={errors?.legal_name}
        />

        <Input
          {...register("trade_name")}
          label="Nome comercial"
          iconName="person"
          placeholder="Insira o nome comercial do cliente..."
          error={errors?.trade_name}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="sm:col-span-2">
            <Input
              {...register("oab_number")}
              label="Número da OAB"
              iconName="balance"
              placeholder="Insira o número da OAB..."
              error={errors?.oab_number}
            />
          </div>

          <Input
            {...register("oab_uf")}
            label="UF da OAB"
            iconName="balance"
            placeholder="SP"
            maxLength={2}
            error={errors?.oab_uf}
          />
        </div>

        {/*
          O responsável nasce junto com o escritório: um escritório sem membro
          é inacessível, porque o acesso passa por office_members — nem quem o
          cadastrou conseguiria entrar. Na edição não aparece: o dono muda
          pelos membros, não por este formulário.
        */}
        {!isEditing && (
          <>
            <Input
              {...register("owner_name")}
              label="Nome do responsável"
              iconName="person"
              placeholder="Quem vai administrar o escritório..."
              error={errors?.owner_name}
            />

            <Input
              {...register("owner_email")}
              label="E-mail do responsável"
              iconName="mail"
              placeholder="Ele entra no sistema com este e-mail..."
              error={errors?.owner_email}
            />

            <Input
              {...register("owner_password")}
              label="Senha provisória"
              type="password"
              iconName="lock"
              placeholder="Ao menos 8 caracteres..."
              error={errors?.owner_password}
            />
          </>
        )}

        <InputPhone
          control={control}
          label="Telefone (WhatsApp)"
          name="remotejid"
          placeholder="Insira o número de telefone..."
          error={errors?.remotejid}
        />

        <Textarea
          {...register("description")}
          label="Biografia"
          iconName="edit"
          placeholder="Insira a biografia do escritório..."
          error={errors?.description}
        />

        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-[#3D3D3D]">Endereço</h3>
        </div>

        <Input
          {...register("cep")}
          label="CEP"
          mask="cep"
          placeholder="00000-000"
          iconName="place"
          error={errors?.cep}
          onBlur={(e) => handleCepSearch(e.target.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            {...register("street")}
            label="Rua"
            iconName="place"
            placeholder="Insira a rua..."
            error={errors?.street}
          />

          <Input
            {...register("number")}
            label="Número"
            iconName="place"
            placeholder="Insira o número..."
            error={errors?.number}
          />
        </div>

        <Input
          {...register("neighborhood")}
          label="Bairro"
          iconName="place"
          placeholder="Insira o bairro..."
          error={errors?.neighborhood}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            {...register("city")}
            label="Cidade"
            iconName="place"
            placeholder="Insira a cidade..."
            error={errors?.city}
          />

          <Controller
            name="state"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <CustomSelect
                label="Estado"
                options={ufs.map((uf) => ({ value: uf.sigla, label: uf.nome }))}
                value={field.value}
                onChange={field.onChange}
                iconName="place"
                placeholder="Selecione o estado"
              />
            )}
          />
        </div>

        {errors?.state && (
          <span className="text-red-500 text-sm">{errors?.state?.message}</span>
        )}

        <div className="flex items-center justify-between mb-6">
          <CustomButton
            type="button"
            className="w-[251px] cursor-pointer"
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </CustomButton>

          <CustomButton
            type="submit"
            className="px-10 cursor-pointer"
            variant="primary"
            iconRight={
              <Image
                src="/icons/arrow-right.svg"
                alt=""
                width={24}
                height={24}
              />
            }
          >
            {isEditing ? "Salvar" : "Criar escritório"}
          </CustomButton>
        </div>
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
