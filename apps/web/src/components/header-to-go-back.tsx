"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

interface HeaderToGoBackProps {
  link: string
  bgColor?: string
  image?: string
}

export function HeaderToGoBack({ link, bgColor, image }: HeaderToGoBackProps) {
  const router = useRouter()

  return (
    <header
      className={`w-full ${
        image ? image : bgColor ? "bg-[#ECF7F8]" : "bg-[#BBE2E7]"
      } py-4 px-4 flex items-center justify-between`}
    >
      <button
        onClick={() => router.push(link)}
        className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md"
      >
        <ArrowLeft className="w-5 h-5 text-gray-600" />
      </button>
    </header>
  )
}
