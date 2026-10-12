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
          <label className="mb-[7px] block text-[13px] font-medium text-tinta-2">
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
                className={`flex h-11 w-full items-center gap-2 rounded-[10px] border bg-white px-3.5 outline-0 transition-[border-color,box-shadow] duration-150 ${
                  isFocused
                    ? "border-acao shadow-[0_0_0_3px_#D7EBEE]"
                    : "border-filete-forte"
                }`}
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
                  maxLength={20}
                  limitMaxLength={true}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => {
                    setIsFocused(false);
                    field.onBlur();
                  }}
                  // Mantém o +55 fixo, como no app: editável, os primeiros
                  // dígitos digitados viravam código de país (31 → Holanda)
                  countryCallingCodeEditable={false}
                  onChange={(value) => field.onChange(value)}
                  className="phone-input-wrapper w-full border-0 border-white bg-transparent text-[15px] text-tinta outline-none"
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
