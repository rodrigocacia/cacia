"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/custom-button"
import { Pencil } from "lucide-react"

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
      className="h-9! cursor-pointer rounded-[9px]! px-3.5 text-[13.5px] font-medium"
      variant="outline"
      type="button"
      onClick={handleEditCustomer}
      iconLeft={<Pencil size={15} strokeWidth={1.7} />}
    >
      Editar cliente
    </Button>
  )
}
