"use client"

import { useRef } from "react"
import { format, parse } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MdCalendarToday } from "react-icons/md"

interface CustomDateSelectProps {
  label?: string
  placeholder?: string
  value?: string // esperado: "yyyy-MM-dd"
  onChange?: (value: string) => void
  formatPattern?: string // exibição
  disabled?: boolean
  min?: string // "yyyy-MM-dd"
  max?: string
  name?: string
}

export function CustomDateSelect({
  label = "Data",
  placeholder = "Selecione uma data",
  value,
  onChange,
  formatPattern = "dd 'de' MMMM',' yyyy",
  disabled,
  min,
  max,
  name,
}: CustomDateSelectProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Formata de forma consistente (sem depender de Date(string) do iOS)
  const formattedLabel = value
    ? format(parse(value, "yyyy-MM-dd", new Date()), formatPattern, {
        locale: ptBR,
      })
    : ""

  return (
    <div className="w-full">
      {label && (
        <label className="mb-[7px] block text-[13px] font-medium text-tinta-2">
          {label}
        </label>
      )}

      <div
        className={`relative flex h-11 w-full items-center justify-between rounded-[10px] border border-filete-forte px-3.5 transition-[border-color,box-shadow] duration-150 focus-within:border-acao focus-within:shadow-[0_0_0_3px_#D7EBEE] ${
          disabled
            ? "cursor-not-allowed bg-gray-100 opacity-70"
            : "cursor-pointer bg-white"
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Conteúdo visual */}
        <div
          className="flex items-center gap-2 flex-1 pointer-events-none"
          aria-hidden
        >
          <MdCalendarToday
            className={`h-[17px] w-[17px] shrink-0 ${value ? "text-acao" : "text-gray-400"}`}
          />
          <span
            className={`${value ? "text-tinta" : "text-gray-400"} w-full truncate text-left text-[15px]`}
          >
            {formattedLabel || placeholder}
          </span>
        </div>

        {/* Input real cobrindo toda a área clicável (visível p/ o browser) */}
        <input
          ref={inputRef}
          type="date"
          name={name}
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          min={min}
          max={max}
          disabled={disabled}
          // Importante para iOS: o campo precisa ser "visível"
          className="absolute inset-0 w-full h-full opacity-0 appearance-none
                     [font-size:16px] focus:outline-none"
          // Evita autofill/zoom maluco
          autoComplete="off"
          // Fallback: se showPicker existir em algum browser, ainda abre.
          onFocus={(e) => {
            if (typeof e.currentTarget.showPicker === "function") {
              e.currentTarget.showPicker()
            }
          }}
        />
      </div>
    </div>
  )
}
