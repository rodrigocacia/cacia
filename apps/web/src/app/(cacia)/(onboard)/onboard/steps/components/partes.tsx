import { ReactNode } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/custom-button"

/**
 * Cabeçalho de um bloco dentro da etapa: título em 14,5 px, apoio embaixo e,
 * opcionalmente, uma ação à direita. Fecha com um filete.
 */
export function SecaoDoPasso({
  titulo,
  descricao,
  acao,
}: {
  titulo: string
  descricao?: ReactNode
  acao?: ReactNode
}) {
  return (
    <div className="flex w-full flex-wrap items-end justify-between gap-3 border-t border-filete pt-6 pb-5">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-[14.5px] font-semibold text-tinta">{titulo}</h2>
        {descricao && <p className="text-[13.5px] text-tinta-2">{descricao}</p>}
      </div>

      {acao}
    </div>
  )
}

/** Barra de navegação ao pé da etapa: Voltar à esquerda, avançar à direita. */
export function RodapeDoPasso({ children }: { children: ReactNode }) {
  return (
    <div className="mt-8 flex items-center justify-between gap-3 border-t border-filete pt-6">
      {children}
    </div>
  )
}

export function BotaoVoltar({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="cursor-pointer"
      onClick={onClick}
      iconLeft={<ArrowLeft size={17} strokeWidth={1.7} />}
    >
      Voltar
    </Button>
  )
}

export function BotaoAvancar({
  children = "Prosseguir",
  isLoading,
  ...props
}: {
  children?: ReactNode
  isLoading?: boolean
  type?: "button" | "submit"
  onClick?: () => void
}) {
  return (
    <Button
      type="submit"
      variant="primary"
      className="min-w-[168px] cursor-pointer"
      isLoading={isLoading}
      iconRight={!isLoading ? <ArrowRight size={17} strokeWidth={1.7} /> : null}
      {...props}
    >
      {children}
    </Button>
  )
}
