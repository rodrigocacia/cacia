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
          <label className="mb-[7px] block text-[13px] font-medium text-tinta-2">
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
                className={`flex h-11 w-full items-center gap-2 rounded-[10px] border px-3.5 outline-0 transition-[border-color,box-shadow] duration-150 ${
                  isFocused
                    ? "border-acao shadow-[0_0_0_3px_#D7EBEE]"
                    : "border-filete-forte"
                } ${disabled ? "bg-gray-100 opacity-70" : "bg-white"}`}
              >
                <MdOutlineSmartphone
                  className={`h-[17px] w-[17px] shrink-0 transition-colors ${
                    isFocused ? "text-acao" : "text-gray-400"
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
                  className="phone-input-wrapper w-full border-0 border-white bg-transparent text-[15px] text-tinta outline-none"
                />
              </div>
            )
          }}
        />
      </div>
      {hint && !error && <p className="text-xs text-tinta-3">{hint}</p>}
      {error && (
        <p className="text-xs font-medium text-red-500 dark:text-red-400">
          {typeof error === "string" ? error : error.message}
        </p>
      )}
    </div>
  )
}
