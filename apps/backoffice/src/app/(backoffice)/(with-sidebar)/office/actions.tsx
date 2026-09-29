"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  updateOffice,
  type UpdateOfficeRequest,
} from "@/http/office/update-office";
import { updateOfficeStatus } from "@/http/office/update-office-status";
import type { OfficeStatus } from "@/types/office";
import { deleteOffice } from "@/http/office/delete-office";
import { createOffice } from "@/http/office/create-office";

interface Endereco {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
}

export async function updateOfficeAction(data: UpdateOfficeRequest) {
  try {
    const result = await updateOffice(data);

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
  addresses: Endereco[];
}) {
  try {
    const result = await createOffice(data);

    revalidateTag("offices");

    return result;
  } catch (error) {
    console.error("Erro ao criar escritório:", error);
    return { success: false };
  }
}

export async function alterarSituacaoDoEscritorioAction(
  officeId: string,
  status: OfficeStatus,
) {
  const result = await updateOfficeStatus({ id: officeId, status });

  if (result.success) {
    revalidateTag("offices");
    revalidatePath(`/office/${officeId}`, "layout");
  }

  return result;
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
