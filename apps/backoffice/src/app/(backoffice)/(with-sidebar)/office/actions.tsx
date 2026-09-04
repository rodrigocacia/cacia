"use server";

import { revalidateTag } from "next/cache";
import { updateOffice } from "@/http/office/update-office";
import { deleteOffice } from "@/http/office/delete-office";
import { createOffice } from "@/http/office/create-office";

export async function updateOfficeAction(data: {
  id: string;
  name: string;
  document: string;
  legal_name: string;
  trade_name: string;
  remotejid: string;
  description: string;
  address?: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
  };
}) {
  try {
    const result = await updateOffice({
      id: data.id,
      name: data.name,
      document: data.document,
      legal_name: data.legal_name,
      trade_name: data.trade_name,
      remotejid: data.remotejid,
      description: data.description,
      address: data.address ? [data.address] : [],
    });

    revalidateTag("offices");

    return result;
  } catch (error) {
    console.error("Erro ao atualizar escritório:", error);
    return { success: false };
  }
}

export async function createOfficeAction(data: {
  name: string;
  document: string;
  legal_name: string;
  trade_name: string;
  remotejid: string;
  description: string;
  oab_number: string;
  oab_uf: string;
  owner_name: string;
  owner_email: string;
  owner_password: string;
  owner_phone?: string;
  address?: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
  };
}) {
  try {
    const result = await createOffice({
      name: data.name,
      document: data.document,
      legal_name: data.legal_name,
      trade_name: data.trade_name,
      remotejid: data.remotejid,
      description: data.description,
      oab_number: data.oab_number,
      oab_uf: data.oab_uf,
      owner_name: data.owner_name,
      owner_email: data.owner_email,
      owner_password: data.owner_password,
      owner_phone: data.owner_phone,
      address: data.address ? [data.address] : [],
    });

    revalidateTag("offices");

    return result;
  } catch (error) {
    console.error("Erro ao criar escritório:", error);
    return { success: false };
  }
}

export async function deleteOfficeAction(officeId: string) {
  try {
    const result = await deleteOffice({ id: officeId });

    if (!result.success) {
      throw new Error(result.error);
    }

    revalidateTag("offices");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar escritório:", error);
    return { success: false };
  }
}
