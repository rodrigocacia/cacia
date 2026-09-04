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
        className="data-[state=checked]:bg-[#348C98] data-[state=checked]:border-[#348C98]"
      />
      <label
        className={`text-sm font-medium text-[#3D3D3D] ${
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
      <label className="text-sm font-medium text-[#3D3D3D]">{label}</label>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}
