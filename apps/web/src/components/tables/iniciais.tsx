import { cn } from "@/lib/utils"

/** Até duas iniciais do nome, em maiúsculas. */
export function iniciaisDe(nome: string | null | undefined): string {
  return (nome ?? "")
    .split(/\s+/)
    .filter((parte) => /^[\p{L}\p{N}]/u.test(parte))
    .filter((parte, i, partes) => i === 0 || i === partes.length - 1)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("")
}

/**
 * Avatar de iniciais da direção visual 02: névoa com turquesa profundo, sem
 * cor sorteada por nome — a cor aleatória competia com o status da linha.
 */
export function Iniciais({
  nome,
  className,
}: {
  nome: string | null | undefined
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nevoa text-[11.5px] font-semibold text-turquesa-profundo",
        className
      )}
    >
      {iniciaisDe(nome) || "?"}
    </span>
  )
}
