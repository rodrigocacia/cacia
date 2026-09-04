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
  const base =
    "px-4 py-2 rounded-full font-medium transition-colors duration-200 focus:outline-none focus:ring-2 flex items-center justify-center space-x-2"

  const variants = {
    primary:
      "h-[56px] bg-[#348C98] text-white hover:bg-primary-700 focus:ring-primary-400",
    secondary:
      "bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-400",
    outline:
      "h-[56px] w-[120px] shadow-sm text-gray-700 hover:bg-gray-100 focus:ring-gray-300",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-200",
    danger: "bg-[#FEF2F2] text-[#DC2626]",
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
