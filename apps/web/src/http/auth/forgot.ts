import ky from "ky"

interface ForgotRequest {
  email: string
}

interface ForgotResponse {
  message: string
}

export async function forgot({ email }: ForgotRequest) {
  const result = await ky
    .post(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot`, {
      json: {
        email,
      },
    })
    .json<ForgotResponse>()

  return result
}
