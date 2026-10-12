"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

type ToastProps = {
  title: string;
  description: string;
  variant?: "success" | "error" | "alert" | "successSolid" | "errorSolid";
  onClose: () => void;
};

/**
 * Aviso flutuante: cartão de tinta escura com um ponto colorido indicando o
 * tipo. Fica 5 s na tela (erros, 7 s) — 3 s não davam tempo de ler.
 *
 * As variantes "Solid" existem por compatibilidade e hoje têm a mesma cara
 * das demais.
 */
const PONTO: Record<NonNullable<ToastProps["variant"]>, string> = {
  success: "bg-turquesa-claro",
  successSolid: "bg-turquesa-claro",
  error: "bg-[#E2725F]",
  errorSolid: "bg-[#E2725F]",
  alert: "bg-ambar-ponto",
};

export function Toast({
  title,
  description,
  variant = "success",
  onClose,
}: ToastProps) {
  // Quem usa passa `onClose` como arrow inline: guardar numa ref impede que
  // cada nova renderização do pai reinicie a contagem.
  const fecharRef = useRef(onClose);
  useEffect(() => {
    fecharRef.current = onClose;
  }, [onClose]);

  const ehErro = variant === "error" || variant === "errorSolid";

  useEffect(() => {
    const timer = setTimeout(() => fecharRef.current(), ehErro ? 7000 : 5000);
    return () => clearTimeout(timer);
  }, [ehErro]);

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 max-sm:top-4 max-sm:right-4 max-sm:left-4">
      <div
        role={ehErro ? "alert" : "status"}
        aria-live={ehErro ? "assertive" : "polite"}
        className="relative flex w-full max-w-sm items-start gap-3 rounded-xl bg-ink py-3.5 pr-11 pl-4 text-[#F5F2ED] shadow-[0_18px_40px_rgba(21,19,17,0.28)] max-sm:max-w-none"
      >
        <span
          aria-hidden
          className={clsx(
            "mt-[7px] h-2 w-2 shrink-0 rounded-full",
            PONTO[variant] ?? PONTO.success,
          )}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <strong className="text-[14px] font-semibold">{title}</strong>
          {description && (
            <p className="text-[13px] leading-snug text-gray-400">
              {description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar aviso"
          className="absolute top-2.5 right-2.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-ink-line hover:text-[#F5F2ED]"
        >
          <X size={16} strokeWidth={1.7} />
        </button>
      </div>
    </div>
  );
}
