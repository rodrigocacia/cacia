/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import * as Tabs from "@radix-ui/react-tabs"
import { TabItem } from "./tab-item"

type Tab = {
  id: number
  name: string
  path: string
  icon?: React.ReactNode
}

interface CustomTabProps {
  tabs: Tab[]
}

export function CustomTab({ tabs }: CustomTabProps) {
  const pathname = usePathname()

  const handleChangeLink = (value: string) => {}

  const isActive = (path: string) => !!pathname.includes(path)

  return (
    <div className="overflow-x-auto [scrollbar-width:none]">
      <Tabs.Root onValueChange={handleChangeLink}>
        <Tabs.List className="flex w-full items-center gap-[22px] border-b border-filete whitespace-nowrap">
          {tabs.map((tab) => (
            <Link key={tab.id} href={tab.path}>
              <TabItem
                key={tab.id}
                value={tab.path}
                title={tab.name}
                icon={tab.icon}
                isSelected={isActive(String(tab.path))}
              />
            </Link>
          ))}
        </Tabs.List>
      </Tabs.Root>
    </div>
  )
}
