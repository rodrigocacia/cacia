"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import { MdCheckCircle } from "react-icons/md";

type ToastProps = {
  title: string;
  description: string;
  variant?: "success" | "error" | "alert" | "successSolid" | "errorSolid";
  onClose: () => void;
};

export function Toast({
  title,
  description,
  variant = "success",
  onClose,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const renderIcon = () => {
    if (variant === "successSolid") {
      return <MdCheckCircle className="w-5 h-5 text-white mt-1" />;
    }
    if (variant === "errorSolid") {
      return <MdCheckCircle className="w-5 h-5 text-white mt-1" />;
    }

    return (
      <div
        className={clsx(
          "mt-1 flex h-6 w-6 items-center justify-center rounded-full text-white",
          {
            "bg-green-600": variant === "success",
            "bg-red-600": variant === "error",
            "bg-yellow-600": variant === "alert",
          },
        )}
      >
        i
      </div>
    );
  };

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3">
      <div
        className={clsx(
          "relative flex w-full max-w-sm items-start gap-3 rounded-lg p-4 shadow-lg",
          {
            "border-l-4 bg-green-50 border-green-600": variant === "success",
            "border-l-4 bg-red-50 border-red-600": variant === "error",
            "border-l-4 bg-yellow-50 border-yellow-600": variant === "alert",

            "bg-[#16A31B] text-white": variant === "successSolid",
            "bg-[#DC2626] text-white": variant === "errorSolid",
          },
        )}
      >
        {renderIcon()}

        <div className="flex flex-1 flex-col">
          <strong className="text-base font-semibold">{title}</strong>
          <p className="text-sm">{description}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={clsx("absolute right-2 top-2 hover:text-white", {
            "text-gray-400 hover:text-gray-600":
              variant === "success" ||
              variant === "error" ||
              variant === "alert",
            "text-white":
              variant === "successSolid" || variant === "errorSolid",
          })}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
