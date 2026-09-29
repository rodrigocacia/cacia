"use server";

import { HTTPError } from "ky";
import { z } from "zod";
import { cookies } from "next/headers";

import { buscarPapel, signIn } from "@/http/auth/login";

const signInSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido" }),
  password: z.string().min(6, { message: "Por favor insira sua senha" }),
});

export async function signInAction(data: FormData) {
  const result = signInSchema.safeParse(Object.fromEntries(data));
  const cookieStore = await cookies();

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;

    return { success: false, message: null, errors };
  }

  const { email, password } = result.data;

  try {
    const {
      token,
      user: { _id, name },
    } = await signIn({
      email,
      password,
    });

    // As rotas /admin já recusam quem não é ADMIN, mas sem esta verificação
    // o usuário comum entrava num painel em que tudo falhava com 403.
    if ((await buscarPapel(token)) !== "ADMIN") {
      return {
        success: false,
        message: "Acesso restrito à administração da plataforma",
        errors: null,
      };
    }

    cookieStore.set("token:backoffice", token, {
      maxAge: 60 * 60 * 24,
      httpOnly: true,
      path: "/",
    });

    const data = { _id, name, email: email };

    cookieStore.set("userData", JSON.stringify(data), {
      maxAge: 60 * 60 * 24,
      httpOnly: true,
      path: "/",
    });
  } catch (err) {
    if (err instanceof HTTPError) {
      const errorBody = await err.response.json();

      return {
        success: false,
        message: errorBody.message || "Erro de autenticação",
        errors: null,
      };
    }

    console.error(err);

    return {
      success: false,
      message: "Erro inesperado, tente novamente em alguns segundos",
      errors: null,
    };
  }

  return { success: true, message: null, errors: null };
}
