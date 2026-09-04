"use client"

import { useState, useRef, useEffect, forwardRef } from "react"
import {
  MdWork,
  MdKeyboardArrowDown,
  MdMail,
  MdLock,
  MdPerson,
  MdOutlineSmartphone,
  MdBadge,
  MdPlace,
  MdApartment,
  MdFolder,
  MdCalendarToday,
  MdEventAvailable,
} from "react-icons/md"
import { TbTriangleSquareCircle } from "react-icons/tb"
import { GoLaw } from "react-icons/go"
import { AiOutlinePlus } from "react-icons/ai"

const iconMap = {
  mail: MdMail,
  lock: MdLock,
  person: MdPerson,
  phone: MdOutlineSmartphone,
  contact: MdBadge,
  place: MdPlace,
  build: MdApartment,
  work: MdWork,
  folder: MdFolder,
  calendar: MdCalendarToday,
  calendarCheck: MdEventAvailable,
  triangleSquareCircle: TbTriangleSquareCircle,
  law: GoLaw,
}

type IconName = keyof typeof iconMap

interface Option {
  value: string
  label: string
}

interface CustomSelectWithNewActionProps {
  label?: string
  options: Option[]
  placeholder?: string
  onChange?: (value: string) => void
  value?: string
  iconName?: IconName | null
  variant?: "default" | "compact"
  defaultValue?: string
  disabled?: boolean
  onNewAction?: () => void
  newActionLabel?: string
}

export const CustomSelectWithNewAction = forwardRef<
  HTMLDivElement,
  CustomSelectWithNewActionProps
>(
  (
    {
      label,
      options = [],
      placeholder = "Selecione uma opção",
      onChange,
      value,
      iconName = "mail",
      variant = "default",
      disabled = false,
      onNewAction,
      newActionLabel = "Novo",
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedOption, setSelectedOption] = useState<Option | null>(null)
    const [isFocused, setIsFocused] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const Icon = iconName ? iconMap[iconName] : null

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false)
          setIsFocused(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }, [])

    useEffect(() => {
      if (value && value !== "") {
        const option = options.find((option) => option.value === value)
        setSelectedOption(option || null)
      } else {
        setSelectedOption(null)
      }
    }, [value, options])

    const handleSelect = (option: Option) => {
      setSelectedOption(option)
      setIsOpen(false)
      setIsFocused(false)
      onChange?.(option.value)
    }

    const handleNewAction = () => {
      setIsOpen(false)
      setIsFocused(false)
      onNewAction?.()
    }

    return (
      <div
        className={variant === "compact" ? "relative w-[193px]" : "w-full"}
        ref={dropdownRef}
      >
        {variant !== "compact" && (
          <label className="block text-gray-600 text-base mb-2 font-semibold">
            {label}
          </label>
        )}

        <div
          ref={ref}
          className={`${
            variant === "compact"
              ? "h-11 bg-white rounded-2xl px-3"
              : "rounded-2xl px-4 py-3"
          } flex bg-white items-center justify-between border border-gray-200 transition-colors duration-200 cursor-pointer ${
            isFocused || isOpen
              ? "border-[#348C98] ring-2 ring-[#348C98]"
              : "border-gray-200"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          onClick={() => {
            if (disabled) return
            setIsOpen(!isOpen)
            setIsFocused(!isOpen)
          }}
          onFocus={() => {
            if (!disabled) setIsFocused(true)
          }}
          onBlur={() => {
            if (!isOpen && !disabled) setIsFocused(false)
          }}
          tabIndex={disabled ? -1 : 0}
        >
          <div className="flex items-center flex-1 gap-3">
            {Icon && (
              <Icon
                className={`h-5 w-5 ${
                  isFocused ? "text-[#348C98]" : "text-gray-400"
                }`}
              />
            )}

            <span
              className={`truncate ${
                !selectedOption || !selectedOption.label
                  ? "text-[#707070]"
                  : variant === "compact"
                    ? "text-[#707070] font-bold text-sm"
                    : "text-[#707070] font-semibold"
              }`}
            >
              {selectedOption?.label || placeholder}
            </span>
          </div>

          <MdKeyboardArrowDown
            className={`h-5 w-5 transition-transform ${
              isOpen ? "rotate-180 text-[#348C98]" : "text-[#BDBDBD]"
            }`}
          />
        </div>

        {isOpen && !disabled && (
          <div className="relative z-10">
            <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto text-sm">
              {onNewAction && (
                <div
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 flex items-center gap-3 text-[#348C98] font-semibold"
                  onClick={handleNewAction}
                >
                  <AiOutlinePlus className="h-4 w-4" />
                  {newActionLabel}
                </div>
              )}

              {options.length > 0 ? (
                options.map((option) => (
                  <div
                    key={option.value}
                    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                      selectedOption?.value === option.value
                        ? "bg-gray-50 text-[#348C98]"
                        : "text-gray-700"
                    }`}
                    onClick={() => handleSelect(option)}
                  >
                    {option.label}
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500 italic">
                  Nenhuma opção disponível
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
)

CustomSelectWithNewAction.displayName = "CustomSelectWithNewAction"
