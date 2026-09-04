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
        <label className="block text-gray-600 text-base mb-2 font-semibold">
          {label}
        </label>
      )}

      <div
        className={`relative bg-[#FCFCFD] flex items-center justify-between w-full rounded-2xl border transition-colors duration-200 px-4 py-3 ${
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Conteúdo visual */}
        <div
          className="flex items-center gap-2 flex-1 pointer-events-none"
          aria-hidden
        >
          <MdCalendarToday
            className={`h-5 w-5 ${value ? "text-[#348C98]" : "text-gray-400"}`}
          />
          <span
            className={`${value ? "text-gray-600" : "text-gray-400"} w-full text-left`}
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
