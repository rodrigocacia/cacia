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
        <label className="block text-gray-600 text-base mb-2 font-semibold">
          {label}
        </label>
        <div
          className={`flex items-center w-full rounded-2xl border-1 transition-colors duration-200 px-4 py-3
    ${isFocused ? "border-[#348C98] ring-1 ring-[#348C98]" : "border-gray-200"}
    ${
      rest.disabled
        ? "bg-[#F0F0F0] cursor-not-allowed opacity-70"
        : "bg-[#FCFCFD] cursor-text"
    }`}
        >
          {Icon && (
            <Icon
              className={`mr-2 h-5 w-5 ${
                isFocused ? "text-[#348C98]" : "text-gray-400"
              }`}
            />
          )}
          <input
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full bg-transparent outline-0 border-0 placeholder-gray-400 text-gray-600"
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
