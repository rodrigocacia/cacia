import ky from "ky"

interface SignInRequest {
  email: string
  password: string
}

interface Office {
  _id: string
  name: string
  onboarding: boolean
}

interface SignInResponse {
  token: string
  user: {
    _id: string
    email: string
    name: string
    verified: boolean
    role: string
    offices: Office[]
    favorites: []
    createdAt: string
    updatedAt: string
    signature: boolean
  }
}

export async function signIn({ email, password }: SignInRequest) {
  const result = await ky
    .post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      json: {
        email,
        password,
      },
    })
    .json<SignInResponse>()

  return result
}
