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
    <nav className="flex items-center gap-2 text-sm mt-7 max-md:hidden">
      {crumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center gap-2">
          <Link
            href={crumb.href}
            className={clsx(
              "flex items-center gap-1 rounded-full px-3 py-1 transition",
              crumb.isActive
                ? "bg-cyan-50 text-cyan-700 font-semibold"
                : "text-gray-500"
            )}
          >
            {crumb.icon}
            {crumb.label}
          </Link>
          {index < crumbs.length - 1 && (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      ))}
    </nav>
  )
}
