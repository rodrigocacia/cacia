"use server";

import { revalidateTag } from "next/cache";
import { updateUser } from "@/http/user/update-user";
import { deleteUser } from "@/http/user/delete-user";
import { createUser } from "@/http/user/create-user";

export async function updateUserAction(data: {
  id: string;
  name: string;
  email: string;
  document: string;
  birthday: string;
  phone: string;
}) {
  try {
    const result = await updateUser({
      id: data.id,
      name: data.name,
      email: data.email,
      document: data.document,
      birthday: data.birthday,
      phone: data.phone,
    });

    revalidateTag("users");

    return result;
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return { success: false };
  }
}

export async function createUserAction(data: {
  name: string;
  email: string;
  document: string;
  birthday: string;
  phone: string;
  password: string;
}) {
  try {
    const result = await createUser({
      name: data.name,
      email: data.email,
      document: data.document,
      birthday: data.birthday,
      phone: data.phone,
      password: data.password,
    });

    revalidateTag("users");

    return result;
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return { success: false };
  }
}

export async function deleteUserAction(userId: string) {
  try {
    const result = await deleteUser({ id: userId });

    if (!result.success) {
      throw new Error(result.error);
    }

    revalidateTag("users");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    return { success: false };
  }
}
