"use client"

import { FormEvent, InputHTMLAttributes, useCallback, useState } from "react"
import { FieldError } from "react-hook-form"

import {
  MdLock,
  MdMail,
  MdOutlineSmartphone,
  MdPerson,
  MdBadge,
  MdPlace,
  MdApartment,
  MdWhatsapp,
  MdTag,
  MdEdit,
  MdAccessTime,
} from "react-icons/md"

import { IoMdEye, IoMdEyeOff, IoMdSearch } from "react-icons/io"
import { FaBalanceScale, FaMoneyBill } from "react-icons/fa"

import {
  phone,
  cep,
  cnpj,
  cpf,
  currency,
  date,
  hour,
  process,
  fixed,
  cpfCnpj,
} from "@/utils/masks"

const iconMap = {
  mail: MdMail,
  lock: MdLock,
  person: MdPerson,
  phone: MdOutlineSmartphone,
  contact: MdBadge,
  place: MdPlace,
  build: MdApartment,
  search: IoMdSearch,
  whatsapp: MdWhatsapp,
  tag: MdTag,
  balance: FaBalanceScale,
  edit: MdEdit,
  money: FaMoneyBill,
  clock: MdAccessTime,
}

type IconName = keyof typeof iconMap

interface CustomInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  mask?:
    | "phone"
    | "birthdate"
    | "cpf"
    | "cnpj"
    | "cep"
    | "price"
    | "hour"
    | "currency"
    | "process"
    | "fixed"
    | "cpfCnpj"
  iconName?: IconName | null
  error?: string | FieldError | null
}

export function Input({
  type,
  label,
  iconName = "mail",
  error,
  mask,
  ...rest
}: CustomInputProps) {
  const [show, setShow] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const Icon = iconName ? iconMap[iconName] : null

  const handleKeyUp = useCallback(
    (e: FormEvent<HTMLInputElement>) => {
      // Com texto selecionado não há o que mascarar — a tecla foi de seleção
      // (Ctrl+A, Shift+setas). Reescrever o valor aqui desfaz a seleção: o
      // Backspace seguinte apagava um dígito só, e o que se digitava depois
      // era concatenado ao valor antigo.
      const campo = e.currentTarget
      if (
        campo.selectionStart !== null &&
        campo.selectionStart !== campo.selectionEnd
      ) {
        return
      }

      switch (mask) {
        case "phone":
          phone(e)
          break
        case "birthdate":
          date(e)
          break
        case "cpf":
          cpf(e)
          break
        case "cnpj":
          cnpj(e)
          break
        case "cep":
          cep(e)
          break
        case "hour":
          hour(e)
          break
        case "price":
          currency(e)
          break
        case "currency":
          currency(e)
          break
        case "fixed":
          fixed(e)
          break
        case "process":
          process(e)
          break
        case "cpfCnpj":
          cpfCnpj(e)
          break
        default:
          break
      }
    },
    [mask]
  )

  return (
    <div className="w-full space-y-1">
      <div className="w-full">
        {label && (
          <label className="mb-[7px] block text-[13px] font-medium text-tinta-2">
            {label}
          </label>
        )}
        <div
          className={`flex h-11 w-full items-center rounded-[10px] border px-3.5 transition-[border-color,box-shadow] duration-150
    ${isFocused ? "border-acao shadow-[0_0_0_3px_#D7EBEE]" : "border-filete-forte"}
    ${
      rest.disabled
        ? "bg-gray-100 cursor-not-allowed opacity-70"
        : "bg-white cursor-text"
    }`}
        >
          {Icon && (
            <Icon
              className={`mr-2 h-[17px] w-[17px] shrink-0 ${
                isFocused ? "text-acao" : "text-gray-400"
              }`}
            />
          )}
          <input
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full border-0 bg-transparent text-[15px] text-tinta outline-0 placeholder-gray-400"
            type={show ? "text" : type}
            onKeyUp={handleKeyUp}
            {...rest}
          />

          {type === "password" ? (
            <>
              {show ? (
                <IoMdEye
                  className={`${
                    isFocused ? "text-[#348C98]" : "text-gray-400"
                  } cursor-pointer`}
                  size={20}
                  onClick={() => setShow(false)}
                />
              ) : (
                <IoMdEyeOff
                  className={`${
                    isFocused ? "text-[#348C98]" : "text-gray-400"
                  } cursor-pointer`}
                  size={20}
                  onClick={() => setShow(true)}
                />
              )}
            </>
          ) : null}
        </div>
      </div>

      {error && (
        <p className="text-xs font-medium text-red-500 dark:text-red-400">
          {typeof error === "string" ? error : error.message}
        </p>
      )}
    </div>
  )
}
