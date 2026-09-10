"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import clsx from "clsx"

export type Crumb = {
  label: string
  href: string
  icon: React.ReactNode
  isActive?: boolean
}

interface BreadcrumbsProps {
  crumbs: Crumb[]
}

export function Breadcrumbs({ crumbs }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1 text-[13px] max-md:hidden">
      {crumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center gap-2">
          <Link
            href={crumb.href}
            className={clsx(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors",
              crumb.isActive
                ? "bg-[#ECF7F8] text-[#348C98] font-semibold"
                : "text-[#9A9AA5] hover:text-[#707070]"
            )}
          >
            {crumb.icon}
            {crumb.label}
          </Link>
          {index < crumbs.length - 1 && (
            <ChevronRight className="w-3.5 h-3.5 text-[#C9C9D1]" />
          )}
        </div>
      ))}
    </nav>
  )
}
