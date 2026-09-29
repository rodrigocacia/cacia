/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import "react-phone-number-input/style.css"
import { useState } from "react"
import {
  Control,
  Controller,
  FieldError,
  FieldValues,
  Path,
} from "react-hook-form"
import { MdOutlineSmartphone } from "react-icons/md"
import PhoneInput from "react-phone-number-input"

/**
 * O Control do react-hook-form é invariante: Control<MeuForm> não é atribuível
 * a Control<any>. Por isso o componente é genérico sobre o formato do
 * formulário, em vez de tentar aceitar qualquer um.
 */
interface InputPhoneProps<T extends FieldValues> {
  label?: string
  name: Path<T>
  control: Control<T>
  error?: string | FieldError | null
  placeholder?: string
  disabled?: boolean
  /** Texto de apoio abaixo do campo — ex.: por que ele não pode ser editado */
  hint?: string
}

export function InputPhone<T extends FieldValues>({
  label,
  name,
  control,
  error,
  placeholder,
  disabled = false,
  hint,
}: InputPhoneProps<T>) {
  const [isFocused, setIsFocused] = useState(false)
  return (
    <div className="w-full space-y-1">
      <div className="w-full">
        {label && (
          <label className="block text-gray-600 text-base mb-2 font-semibold">
            {label}
          </label>
        )}
        <Controller
          name={name}
          control={control}
          render={({ field }) => {
            const normalizePhoneValue = (value: any): string => {
              if (!value || typeof value !== "string") return ""

              let cleanValue = value.trim()

              if (cleanValue === "") return ""

              cleanValue = cleanValue.replace(/\s+/g, "")

              if (cleanValue.startsWith("+55")) {
                return cleanValue
              }

              if (cleanValue.startsWith("55") && cleanValue.length >= 12) {
                return `+${cleanValue}`
              }

              if (cleanValue.startsWith("+")) {
                return cleanValue
              }

              if (cleanValue.match(/^[1-9]\d{10}$/)) {
                return `+55${cleanValue}`
              }

              if (cleanValue.match(/^[1-9]\d{8,9}$/)) {
                return `+5511${cleanValue}`
              }

              return cleanValue.startsWith("+") ? cleanValue : `+${cleanValue}`
            }

            const safeValue = normalizePhoneValue(field.value)

            return (
              <div
                className={`flex items-center outline-0 gap-3 w-full rounded-2xl px-4 py-3 transition-all duration-200
                border ${
                  isFocused
                    ? "border-[#348C98] ring-1 ring-[#348C98]"
                    : "border-gray-200"
                } ${disabled ? "bg-gray-50 opacity-70" : "bg-white"}`}
              >
                <MdOutlineSmartphone
                  className={`h-5 w-5 shrink-0 transition-colors ${
                    isFocused ? "text-[#348C98]" : "text-gray-400"
                  }`}
                />
                <PhoneInput
                  {...field}
                  value={safeValue}
                  defaultCountry="BR"
                  international
                  placeholder={placeholder}
                  disabled={disabled}
                  maxLength={20}
                  limitMaxLength={true}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => {
                    setIsFocused(false)
                    field.onBlur()
                  }}
                  countryCallingCodeEditable={false}
                  onChange={(value) => field.onChange(value)}
                  className="phone-input-wrapper text-[16px] border-0 w-full text-gray-700 bg-transparent outline-none border-white"
                />
              </div>
            )
          }}
        />
      </div>
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && (
        <p className="text-xs font-medium text-red-500 dark:text-red-400">
          {typeof error === "string" ? error : error.message}
        </p>
      )}
    </div>
  )
}
