"use client";

import { useState, useRef, useEffect } from "react";
import { IoMdDocument } from "react-icons/io";
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
  MdLens,
} from "react-icons/md";
import { TbTriangleSquareCircle } from "react-icons/tb";

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
  document: IoMdDocument,
  lens: MdLens,
};

type IconName = keyof typeof iconMap;

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  label?: string;
  options: Option[];
  placeholder?: string;
  onChange?: (value: string) => void;
  value?: string;
  iconName?: IconName | null;
  variant?: "default" | "compact";
  defaultValue?: string;
}

export function CustomSelect({
  label,
  options = [],
  placeholder = "Selecione uma opção",
  onChange,
  value,
  iconName = "mail",
  variant = "default",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | null>(
    value ? options.find((option) => option.value === value) || null : null,
  );
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const Icon = iconName ? iconMap[iconName] : null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (value) {
      const option = options.find((option) => option.value === value);
      setSelectedOption(option || null);
    }
  }, [value, options]);

  const handleSelect = (option: Option) => {
    setSelectedOption(option);
    setIsOpen(false);
    if (onChange) {
      onChange(option.value);
    }
  };

  return (
    <div
      className={
        variant === "compact" ? "relative w-full sm:w-[193px]" : "w-full"
      }
      ref={dropdownRef}
    >
      {variant !== "compact" && label && (
        <label className="mb-[7px] block text-[13px] font-medium text-tinta-2">
          {label}
        </label>
      )}

      <div
        className={`${
          variant === "compact"
            ? "h-9 rounded-[9px] px-3"
            : "h-11 rounded-[10px] px-3.5"
        } flex cursor-pointer items-center justify-between border bg-white transition-[border-color,box-shadow] duration-150 ${
          isFocused || isOpen
            ? "border-acao shadow-[0_0_0_3px_#D7EBEE]"
            : "border-filete-forte"
        }`}
        onClick={() => {
          setIsOpen(!isOpen);
          setIsFocused(!isOpen);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => !isOpen && setIsFocused(false)}
        tabIndex={0}
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
            className={`block truncate ${
              variant === "compact"
                ? "max-w-[140px] text-[13.5px] font-medium"
                : "text-[15px]"
            } ${!selectedOption ? "text-gray-400" : "text-tinta"}`}
            title={selectedOption?.label ?? placeholder}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <MdKeyboardArrowDown
          className={`h-5 w-5 shrink-0 transition-transform ${
            isOpen ? "rotate-180 text-acao" : "text-tinta-3"
          }`}
        />
      </div>

      {isOpen && (
        <div className="relative z-10">
          <div className="absolute right-0 left-0 mt-1.5 max-h-60 overflow-auto rounded-[12px] border border-filete bg-white p-1 text-[14px] shadow-[0_12px_32px_rgba(21,19,17,0.12)]">
            {options.length > 0 ? (
              options.map((option) => (
                <div
                  key={option.value}
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
  );
}
