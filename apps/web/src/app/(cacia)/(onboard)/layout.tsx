import { redirect } from "next/navigation"

import { isAuthenticated } from "@/auth/auth"

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const autheticated = await isAuthenticated()

  if (!autheticated) {
    redirect("/dashboard")
  }

  return <>{children}</>
}
