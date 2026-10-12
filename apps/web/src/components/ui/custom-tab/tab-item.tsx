"use client"

import * as Tabs from "@radix-ui/react-tabs"
import { motion } from "framer-motion"

export interface TabItemProps {
  value: string
  title: string
  isSelected?: boolean
  icon?: React.ReactNode
}

/**
 * Aba sublinhada: a ativa ganha tinta e um traço escuro de 2 px; as demais
 * ficam no tom apagado. Turquesa fica reservado à ação principal.
 */
export function TabItem({
  value,
  title,
  isSelected = false,
  icon,
}: TabItemProps) {
  return (
    <Tabs.Trigger
      value={value}
      className={`relative flex cursor-pointer items-center pb-2.5 text-[13.5px] whitespace-nowrap transition-colors ${
        isSelected
          ? "font-semibold text-tinta"
          : "text-tinta-3 hover:text-tinta"
      }`}
    >
      <div className="flex items-center gap-1.5">
        {icon && (
          <span className={isSelected ? "text-tinta" : "text-tinta-3"}>
            {icon}
          </span>
        )}

        <span>{title}</span>
      </div>

      {isSelected && (
        <motion.div
          layoutId="activeTab"
          className="absolute right-0 -bottom-px left-0 h-0.5 bg-tinta"
        />
      )}
    </Tabs.Trigger>
  )
}
