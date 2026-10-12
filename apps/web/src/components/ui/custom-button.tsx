"use client"

import { ButtonHTMLAttributes, ReactNode } from "react"
import clsx from "clsx"

import { motion } from "framer-motion"

type ButtonProps = {
  children: ReactNode
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
  iconLeft?: ReactNode
  iconRight?: ReactNode
  className?: string
  isLoading?: boolean
} & ButtonHTMLAttributes<HTMLButtonElement>

export function Button({
  children,
  variant = "primary",
  iconLeft,
  iconRight,
  className = "",
  isLoading,
  ...props
}: ButtonProps) {
  // Direção visual 02: cantos de 10 px, altura de 44 px, turquesa só na
  // ação principal. O relevo interno discreto é o que dá acabamento ao
  // botão sem recorrer a sombra.
  const base =
    "h-11 px-4 rounded-[10px] text-[14px] font-semibold transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-[3px] focus-visible:ring-nevoa-2 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"

  const variants = {
    primary:
      "bg-acao text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_2px_rgba(21,19,17,0.18)] hover:bg-acao-escura",
    secondary: "bg-tinta text-papel hover:bg-grafite",
    outline: "border border-filete-forte bg-white text-tinta hover:bg-gray-100",
    ghost: "bg-transparent font-medium text-tinta-2 hover:bg-gray-100",
    danger: "bg-[#FBEDEA] text-[#A23B2A] hover:bg-[#F6DDD7]",
  }

  return (
    <button className={clsx(base, variants[variant], className)} {...props}>
      {iconLeft && !isLoading && (
        <span className="flex-shrink-0">{iconLeft}</span>
      )}

      {isLoading ? (
        <motion.div
          className="inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <LoadingDots />
        </motion.div>
      ) : (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {children}
        </motion.span>
      )}

      {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
    </button>
  )
}

function LoadingDots() {
  return (
    <div className="flex space-x-1">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 bg-white rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1,
            repeat: Number.POSITIVE_INFINITY,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  )
}
