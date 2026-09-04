"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/custom-button"
import { Icon } from "@iconify/react/dist/iconify.js"

export function ButtonEditCustomer({ customerId }: { customerId: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleEditCustomer = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("editCustomerId", customerId)

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Button
      className="cursor-pointer bg-transparent border border-[#348C98] w-full"
      type="button"
      onClick={handleEditCustomer}
      iconLeft={
        <Icon
          icon="mdi:pencil"
          className="text-[#348C98]"
          width={20}
          height={20}
        />
      }
    >
      <span className="text-sm text-[#348C98]">Editar cliente</span>
    </Button>
  )
}
