"use client"

import { useState, useRef, useEffect, forwardRef, useId } from "react"
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
    const listaId = useId()

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
        {variant !== "compact" && label && (
          <label className="mb-[7px] block text-[13px] font-medium text-tinta-2">
            {label}
          </label>
        )}

        <div
          ref={ref}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listaId}
          aria-haspopup="listbox"
          aria-disabled={disabled}
          className={`flex h-11 w-full items-center justify-between rounded-[10px] border bg-white transition-[border-color,box-shadow] duration-150 ${
            variant === "compact" ? "px-3" : "px-3.5"
          } ${
            isFocused || isOpen
              ? "border-acao shadow-[0_0_0_3px_#D7EBEE]"
              : "border-filete-forte"
          } ${disabled ? "cursor-not-allowed bg-gray-100 opacity-70" : "cursor-pointer"}`}
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
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {Icon && (
              <Icon
                className={`h-[17px] w-[17px] shrink-0 ${
                  isFocused || isOpen ? "text-acao" : "text-gray-400"
                }`}
              />
            )}

            <span
              className={`truncate ${
                !selectedOption || !selectedOption.label
                  ? "text-gray-400"
                  : "text-tinta"
              } ${variant === "compact" ? "text-[13.5px] font-medium" : "text-[15px]"}`}
            >
              {selectedOption?.label || placeholder}
            </span>
          </div>

          <MdKeyboardArrowDown
            className={`h-5 w-5 shrink-0 transition-transform ${
              isOpen ? "rotate-180 text-acao" : "text-tinta-3"
            }`}
          />
        </div>

        {isOpen && !disabled && (
          <div className="relative z-10">
            <div
              id={listaId}
              role="listbox"
              className="absolute right-0 left-0 mt-1.5 max-h-60 overflow-auto rounded-[12px] border border-filete bg-white p-1 text-[14px] shadow-[0_12px_32px_rgba(21,19,17,0.12)]"
            >
              {onNewAction && (
                <div
                  className="mb-1 flex cursor-pointer items-center gap-2 rounded-lg border-b border-filete px-3 py-2.5 font-semibold text-turquesa-profundo hover:bg-gray-100"
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
                    role="option"
                    aria-selected={selectedOption?.value === option.value}
                    className={`cursor-pointer rounded-lg px-3 py-2 hover:bg-gray-100 ${
                      selectedOption?.value === option.value
                        ? "bg-nevoa font-medium text-turquesa-profundo"
                        : "text-tinta"
                    }`}
                    onClick={() => handleSelect(option)}
                  >
                    {option.label}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-tinta-3">
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
