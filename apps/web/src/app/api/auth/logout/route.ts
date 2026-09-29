import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url))

  // Os três, como em /api/auth/reset: expirar só o token deixava o escritório
  // e os dados do usuário anterior para quem entrasse em seguida no mesmo
  // navegador.
  response.cookies.delete("token")
  response.cookies.delete("office_id")
  response.cookies.delete("userData")

  return response
}
