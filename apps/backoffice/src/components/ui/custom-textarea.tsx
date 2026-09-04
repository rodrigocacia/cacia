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
        <label className="block text-gray-600 text-base mb-2 font-semibold">
          {label}
        </label>
        <div
          className={`flex items-start w-full rounded-2xl border-1 transition-colors duration-200 px-4 py-3
    ${isFocused ? "border-[#348C98] ring-1 ring-[#348C98]" : "border-gray-200"}
    ${
      rest.disabled
        ? "bg-[#F0F0F0] cursor-not-allowed opacity-70"
        : "bg-[#FCFCFD] cursor-text"
    }`}
        >
          {Icon && (
            <Icon
              className={`mr-2 h-5 w-5 mt-2 ${
                isFocused ? "text-[#348C98]" : "text-gray-400"
              }`}
            />
          )}
          <textarea
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full bg-transparent outline-0 border-0 placeholder-gray-400 text-gray-600 resize-none min-h-[120px]"
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
