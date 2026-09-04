"use client"

import Link from "next/link"
import { Icon } from "@iconify/react"

interface ProfileMenuCardProps {
  title: string
  description: string
  icon: string
  href: string
}

export function ProfileMenuCard({
  title,
  description,
  icon,
  href,
}: ProfileMenuCardProps) {
  return (
    <Link href={href}>
      <div className="bg-white shadow rounded-2xl min-h-[120px] w-full flex flex-col p-6 gap-4 hover:shadow-lg transition-shadow duration-200 cursor-pointer">
        <div className="flex items-center justify-center bg-[#ECF7F8] rounded-full w-12 h-12">
          <Icon icon={icon} className="text-[#348C98] w-7 h-7" />
        </div>
        <div className="flex flex-col justify-center flex-1">
          <span className="text-[#3D3D3D] text-lg font-bold leading-tight mb-2">
            {title}
          </span>
          <span className="text-[#707070] text-sm font-medium">
            {description}
          </span>
        </div>
      </div>
    </Link>
  )
}
