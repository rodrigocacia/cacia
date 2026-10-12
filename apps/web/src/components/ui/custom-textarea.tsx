"use client"

import type React from "react"
import { type TextareaHTMLAttributes, useState } from "react"
import { MdEdit } from "react-icons/md"

interface CustomTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  maxLength?: number
  showCharacterCount?: boolean
}

export function CustomTextarea({
  label = "Biografia",
  maxLength = 400,
  showCharacterCount = true,
  placeholder = "Insira a sua biografia...",
  value = "",
  onChange,
  ...rest
}: CustomTextareaProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className="w-full">
      <label className="mb-[7px] block text-[13px] font-medium text-tinta-2">
        {label}
      </label>
      <div
        className={`flex w-full items-start rounded-[10px] border bg-white px-3.5 py-3 transition-[border-color,box-shadow] duration-150 ${
          isFocused
            ? "border-acao shadow-[0_0_0_3px_#D7EBEE]"
            : "border-filete-forte"
        }`}
      >
        <MdEdit
          className={`mt-[3px] mr-2 h-[17px] w-[17px] shrink-0 ${
            isFocused ? "text-acao" : "text-gray-400"
          }`}
        />
        <textarea
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="min-h-[160px] w-full resize-none bg-transparent text-[15px] leading-relaxed text-tinta placeholder-gray-400 outline-none"
          placeholder={placeholder}
          maxLength={maxLength}
          {...rest}
        />
      </div>
      {showCharacterCount && (
        <div className="mt-1.5 flex justify-end font-mono text-[11px] text-tinta-3 tabular">
          {String(value).length}/{maxLength} caracteres
        </div>
      )}
    </div>
  )
}
