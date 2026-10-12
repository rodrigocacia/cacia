"use client";

import { TextareaHTMLAttributes, useState } from "react";
import { FieldError } from "react-hook-form";

import { MdPerson, MdEdit } from "react-icons/md";

const iconMap = {
  person: MdPerson,
  edit: MdEdit,
};

type IconName = keyof typeof iconMap;

interface CustomTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  iconName?: IconName | null;
  error?: string | FieldError | null;
}

export function Textarea({
  label,
  iconName = "edit",
  error,
  ...rest
}: CustomTextareaProps) {
  const [isFocused, setIsFocused] = useState(false);

  const Icon = iconName ? iconMap[iconName] : null;

  return (
    <div className="w-full space-y-1">
      <div className="w-full">
        <label className="mb-[7px] block text-[13px] font-medium text-tinta-2">
          {label}
        </label>
        <div
          className={`flex w-full items-start rounded-[10px] border px-3.5 py-3 transition-[border-color,box-shadow] duration-150
    ${isFocused ? "border-acao shadow-[0_0_0_3px_#D7EBEE]" : "border-filete-forte"}
    ${
      rest.disabled
        ? "bg-gray-100 cursor-not-allowed opacity-70"
        : "bg-white cursor-text"
    }`}
        >
          {Icon && (
            <Icon
              className={`mt-[3px] mr-2 h-[17px] w-[17px] shrink-0 ${
                isFocused ? "text-acao" : "text-gray-400"
              }`}
            />
          )}
          <textarea
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="min-h-[120px] w-full resize-none border-0 bg-transparent text-[15px] leading-relaxed text-tinta outline-0 placeholder-gray-400"
            {...rest}
          />
        </div>
      </div>

      {error && (
        <p className="text-xs font-medium text-red-500 dark:text-red-400">
          {typeof error === "string" ? error : error.message}
        </p>
      )}
    </div>
  );
}
