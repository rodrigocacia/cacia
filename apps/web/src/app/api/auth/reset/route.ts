import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const cookieStore = await cookies()

  cookieStore.delete("token")
  cookieStore.delete("office_id")
  cookieStore.delete("userData")

  return new NextResponse(null, { status: 200 })
}
