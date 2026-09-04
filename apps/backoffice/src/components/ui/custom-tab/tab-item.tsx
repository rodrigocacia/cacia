"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { motion } from "framer-motion";

export interface TabItemProps {
  value: string;
  title: string;
  isSelected?: boolean;
  icon?: React.ReactNode;
}

export function TabItem({
  value,
  title,
  isSelected = false,
  icon,
}: TabItemProps) {
  return (
    <Tabs.Trigger
      value={value}
      className="relative flex items-center px-1 pb-4 text-sm font-medium text-zinc-500 hover:text-[#348C98] data-[state=active]:text-[#348C98]"
    >
      <div className="flex items-center gap-1.5">
        {icon && (
          <span className={isSelected ? "text-[#348C98]" : "text-[#BDBDBD]"}>
            {icon}
          </span>
        )}

        <span>{title}</span>
      </div>

      {isSelected && (
        <motion.div
          layoutId="activeTab"
          className="absolute -bottom-px left-0 right-0 h-0.5 rounded-tl-full rounded-tr-full bg-[#348C98]"
        />
      )}
    </Tabs.Trigger>
  );
}
