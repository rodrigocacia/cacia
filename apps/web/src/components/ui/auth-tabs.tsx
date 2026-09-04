"use client"

import { useCallback, useState } from "react"
import { LogIn } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { MdPersonAddAlt1 } from "react-icons/md"

export function AuthTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const current = searchParams.get("signin")
  const [activeTab, setActiveTab] = useState<"login" | "register">(
    current === "signup" ? "register" : "login"
  )

  const handleTabChange = useCallback(
    (tab: "login" | "register") => {
      setActiveTab(tab)

      const newParams = new URLSearchParams(searchParams.toString())
      newParams.set("signin", tab === "register" ? "signup" : "signin")

      router.replace(`?${newParams.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="w-fit inline-flex p-1.5 bg-gray-50 rounded-full shadow-sm">
      <button
        type="button"
        onClick={() => handleTabChange("login")}
        className={`flex items-center px-6 py-3 rounded-full transition-all ${
          activeTab === "login"
            ? "bg-white text-gray-800 shadow-sm"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <LogIn
          className={`w-5 h-5 mr-2 ${
            activeTab === "login" ? "text-[#348C98]" : "text-gray-400"
          }`}
        />
        <span className="font-plus-jakarta font-medium">Login</span>
      </button>
      <button
        type="button"
        onClick={() => handleTabChange("register")}
        className={`flex items-center px-6 py-3 rounded-full transition-all ${
          activeTab === "register"
            ? "bg-white text-gray-800 shadow-sm"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <MdPersonAddAlt1
          className={`w-5 h-5 mr-2 ${
            activeTab === "register" ? "text-[#348C98]" : "text-gray-400"
          }`}
        />
        <span className="font-plus-jakarta ont-medium">Cadastre-se</span>
      </button>
    </div>
  )
}
