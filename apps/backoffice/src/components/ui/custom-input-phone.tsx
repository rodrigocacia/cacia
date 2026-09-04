/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import "react-phone-number-input/style.css";
import { useState } from "react";
import {
  Control,
  Controller,
  FieldError,
  FieldValues,
  Path,
} from "react-hook-form";
import { MdOutlineSmartphone } from "react-icons/md";
import PhoneInput from "react-phone-number-input";

/**
 * O Control do react-hook-form é invariante: Control<MeuForm> não é atribuível
 * a Control<any>. Por isso o componente é genérico sobre o formato do
 * formulário, em vez de tentar aceitar qualquer um.
 */
interface InputPhoneProps<T extends FieldValues> {
  label?: string;
  name: Path<T>;
  control: Control<T>;
  error?: string | FieldError | null;
  placeholder?: string;
}

export function InputPhone<T extends FieldValues>({
  label,
  name,
  control,
  error,
  placeholder,
}: InputPhoneProps<T>) {
  const [isFocused, setIsFocused] = useState(false);
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
            const safeValue =
              typeof field.value === "string" && field.value !== ""
                ? field.value.startsWith("+")
                  ? field.value
                  : `+${field.value}`
                : "";

            return (
              <div
                className={`flex items-center outline-0 gap-3 w-full rounded-2xl px-4 py-3 transition-all duration-200
                border ${
                  isFocused
                    ? "border-[#348C98] ring-1 ring-[#348C98]"
                    : "border-gray-200"
                } bg-white`}
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
                  maxLength={20}
                  limitMaxLength={true}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => {
                    setIsFocused(false);
                    field.onBlur();
                  }}
                  onChange={(value) => field.onChange(value)}
                  className="phone-input-wrapper border-0 w-full text-sm text-gray-700 bg-transparent outline-none border-white"
                />
              </div>
            );
          }}
        />
      </div>
      {error && (
        <p className="text-xs font-medium text-red-500 dark:text-red-400">
          {typeof error === "string" ? error : error.message}
        </p>
      )}
    </div>
  );
}
