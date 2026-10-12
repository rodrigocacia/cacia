"use client"

import { forwardRef } from "react"
import { Checkbox } from "./checkbox"

interface CustomCheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export const CustomCheckbox = forwardRef<
  HTMLButtonElement,
  CustomCheckboxProps
>(({ label, checked, onChange, disabled = false, className }, ref) => {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Checkbox
        ref={ref}
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
        disabled={disabled}
        className="rounded-[5px] border-filete-forte data-[state=checked]:border-acao data-[state=checked]:bg-acao data-[state=checked]:text-white"
      />
      <label
        className={`text-[14px] text-tinta ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
        onClick={() => !disabled && onChange(!checked)}
      >
        {label}
      </label>
    </div>
  )
})

CustomCheckbox.displayName = "CustomCheckbox"

interface CustomCheckboxGroupProps {
  label: string
  children: React.ReactNode
  className?: string
}

export const CustomCheckboxGroup = ({
  label,
  children,
  className,
}: CustomCheckboxGroupProps) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-[13px] font-medium text-tinta-2">{label}</label>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}
