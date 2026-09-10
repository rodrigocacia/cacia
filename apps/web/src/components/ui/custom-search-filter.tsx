"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState, InputHTMLAttributes } from "react"
import { IoMdSearch } from "react-icons/io"

type CustomSearchFilterProps = InputHTMLAttributes<HTMLInputElement>

export function CustomSearchFilter(props: CustomSearchFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get("search") || ""
  const [value, setValue] = useState(initialSearch)

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(window.location.search)
      if (value) {
        params.set("search", value)
      } else {
        params.delete("search")
      }
      router.push(`?${params.toString()}`)
    }, 500)

    return () => clearTimeout(timeout)
  }, [value, router])

  return (
    <div className="flex h-11 w-full max-w-[360px] items-center gap-2.5 rounded-full border border-[#E7E7EE] bg-white px-4 transition-colors focus-within:border-[#348C98] focus-within:ring-2 focus-within:ring-[#348C98]/15 max-md:h-[52px] max-md:max-w-none">
      <IoMdSearch size={20} className="text-[#BDBDBD]" />
      <input
        {...props}
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          props.onChange?.(e)
        }}
        className={`w-full bg-transparent text-sm text-[#333] placeholder-[#BDBDBD] outline-none ${
          props.className || ""
        }`}
      />
    </div>
  )
}
