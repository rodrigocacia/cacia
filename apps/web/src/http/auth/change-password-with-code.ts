import ky from "ky"

interface ChangePasswordWithCodeRequest {
  email: string
  code: string
  password: string
  confirmPassword: string
}

interface ChangePasswordWithCodeResponse {
  message: string
}

export async function changePasswordWithCode({
  email,
  code,
  password,
  confirmPassword,
}: ChangePasswordWithCodeRequest) {
  try {
    const result = await ky
      .post(`${process.env.NEXT_PUBLIC_API_URL}/auth/change`, {
        json: {
          email,
          code,
          password,
          confirmPassword,
        },
      })
      .json<ChangePasswordWithCodeResponse>()

    return { success: true, data: result }
  } catch (err: unknown) {
    const httpError = err as {
      response?: { json(): Promise<{ message?: string }> }
    }
    if (httpError.response) {
      const errorBody = await httpError.response.json()
      return {
        success: false,
        error: errorBody.message ?? "Erro na requisição",
      }
    }

    console.error("Erro inesperado:", err)
    return { success: false, error: "Erro interno no servidor" }
  }
}
