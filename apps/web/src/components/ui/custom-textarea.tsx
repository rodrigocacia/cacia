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
      <label className="block text-gray-600 text-base mb-2 font-semibold">
        {label}
      </label>
      <div
        className={`bg-[#FCFCFD] flex items-start w-full rounded-2xl border transition-colors duration-200 px-4 py-3 ${
          isFocused
            ? "border-[#348C98] ring-1 ring-[#348C98]"
            : "border-gray-200"
        }`}
      >
        <MdEdit
          className={`mr-2 h-5 w-5 mt-1 ${
            isFocused ? "text-[#348C98]" : "text-gray-400"
          }`}
        />
        <textarea
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full bg-transparent outline-none placeholder-gray-400 text-gray-600 resize-none min-h-[160px]"
          placeholder={placeholder}
          maxLength={maxLength}
          {...rest}
        />
      </div>
      {showCharacterCount && (
        <div className="flex items-center mt-2 text-xs text-gray-400">
          <div className="flex items-center">
            <span className="text-blue-500 mr-1">ⓘ</span>
            <span>
              {String(value).length}/{maxLength} caracteres
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
