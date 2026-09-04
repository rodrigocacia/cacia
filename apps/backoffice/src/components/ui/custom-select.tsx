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
      {variant !== "compact" && (
        <label className="block text-gray-600 text-base mb-2 font-semibold">
          {label}
        </label>
      )}

      <div
        className={`${
          variant === "compact"
            ? "h-[36px] bg-white rounded-[10px] px-3"
            : "rounded-2xl px-4 py-3"
        } flex items-center justify-between border border-[#F6F6F9] transition-colors duration-200 cursor-pointer ${
          isFocused || isOpen
            ? "border-[#348C98] ring-1 ring-[#348C98]"
            : "border-gray-200"
        }`}
        onClick={() => {
          setIsOpen(!isOpen);
          setIsFocused(!isOpen);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => !isOpen && setIsFocused(false)}
        tabIndex={0}
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
            className={`block truncate max-w-[120px] ${
              !selectedOption
                ? "text-gray-400"
                : variant === "compact"
                  ? "text-[#707070] font-bold text-sm"
                  : "text-gray-600"
            }`}
            title={selectedOption?.label ?? placeholder}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <MdKeyboardArrowDown
          className={`h-5 w-5 transition-transform ${
            isOpen ? "rotate-180 text-[#348C98]" : "text-[#BDBDBD]"
          }`}
        />
      </div>

      {isOpen && (
        <div className="relative z-10">
          <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto text-sm">
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
  );
}
