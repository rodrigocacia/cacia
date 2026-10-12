"use client";

import {
  FormEvent,
  InputHTMLAttributes,
  useCallback,
  useState,
  useEffect,
  useRef,
} from "react";
import { FieldError } from "react-hook-form";
import { IoMdEye, IoMdEyeOff, IoMdSearch } from "react-icons/io";
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
} from "react-icons/md";
import { FaBalanceScale } from "react-icons/fa";
import {
  phone,
  date,
  cpf,
  cnpj,
  cep,
  hour,
  currency,
  cpfCnpj,
} from "@/utils/masks";

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
};

type IconName = keyof typeof iconMap;

interface CustomInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  mask?:
    | "phone"
    | "birthdate"
    | "cpf"
    | "cnpj"
    | "cep"
    | "price"
    | "hour"
    | "cpfCnpj";
  iconName?: IconName | null;
  error?: string | FieldError | null;
}

export function Input({
  type,
  label,
  iconName = "mail",
  error,
  mask,
  value,
  ...rest
}: CustomInputProps) {
  const [show, setShow] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const Icon = iconName ? iconMap[iconName] : null;

  useEffect(() => {
    if (mask && inputRef.current && value) {
      const event = {
        currentTarget: inputRef.current,
      } as React.FormEvent<HTMLInputElement>;

      switch (mask) {
        case "phone":
          phone(event);
          break;
        case "birthdate":
          date(event);
          break;
        case "cpf":
          cpf(event);
          break;
        case "cnpj":
          cnpj(event);
          break;
        case "cep":
          cep(event);
          break;
        case "hour":
          hour(event);
          break;
        case "price":
          currency(event);
          break;
        case "cpfCnpj":
          cpfCnpj(event);
          break;
        default:
          break;
      }
    }
  }, [mask, value]);

  const handleKeyUp = useCallback(
    (e: FormEvent<HTMLInputElement>) => {
      switch (mask) {
        case "phone":
          phone(e);
          break;
        case "birthdate":
          date(e);
          break;
        case "cpf":
          cpf(e);
          break;
        case "cnpj":
          cnpj(e);
          break;
        case "cep":
          cep(e);
          break;
        case "hour":
          hour(e);
          break;
        case "price":
          currency(e);
          break;
        case "cpfCnpj":
          cpfCnpj(e);
          break;
        default:
          break;
      }
    },
    [mask],
  );

  const handleChange = useCallback(
    (e: FormEvent<HTMLInputElement>) => {
      switch (mask) {
        case "phone":
          phone(e);
          break;
        case "birthdate":
          date(e);
          break;
        case "cpf":
          cpf(e);
          break;
        case "cnpj":
          cnpj(e);
          break;
        case "cep":
          cep(e);
          break;
        case "hour":
          hour(e);
          break;
        case "price":
          currency(e);
          break;
        case "cpfCnpj":
          cpfCnpj(e);
          break;
        default:
          break;
      }
    },
    [mask],
  );

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
            ref={inputRef}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full border-0 bg-transparent text-[15px] text-tinta outline-0 placeholder-gray-400"
            type={show ? "text" : type}
            onKeyUp={handleKeyUp}
            onChange={handleChange}
            {...rest}
          />

          {type === "password" ? (
            <>
              {show ? (
                <IoMdEye
                  className={`${
                    isFocused ? "text-acao" : "text-gray-400"
                  } cursor-pointer`}
                  size={20}
                  onClick={() => setShow(false)}
                />
              ) : (
                <IoMdEyeOff
                  className={`${
                    isFocused ? "text-acao" : "text-gray-400"
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
  );
}
