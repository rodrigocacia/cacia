import { ReactNode } from "react"
import clsx from "clsx"

interface CartaoProps {
  /** Título da seção, em 14,5 px seminegrito. */
  titulo?: ReactNode
  /** Linha de contexto abaixo do título. */
  descricao?: ReactNode
  /** Ação alinhada à direita do título (botão, link). */
  acao?: ReactNode
  children: ReactNode
  className?: string
  /** Tira o recuo do corpo, para listas que correm de borda a borda. */
  semRecuo?: boolean
}

/**
 * Cartão das telas de configuração e de conta: filete, cantos de 14 px,
 * sem sombra. O título fica numa faixa separada por filete do corpo.
 */
export function Cartao({
  titulo,
  descricao,
  acao,
  children,
  className,
  semRecuo,
}: CartaoProps) {
  return (
    <section
      className={clsx(
        "min-w-0 rounded-[14px] border border-filete bg-white",
        className
      )}
    >
      {(titulo || acao) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-filete px-7 py-5 max-md:px-5">
          <div className="flex min-w-0 flex-col gap-1">
            {titulo && (
              <h2 className="text-[14.5px] font-semibold text-tinta">
                {titulo}
              </h2>
            )}
            {descricao && (
              <div className="text-[13px] text-tinta-3">{descricao}</div>
            )}
          </div>

          {acao}
        </header>
      )}

      <div className={semRecuo ? undefined : "p-7 max-md:p-5"}>{children}</div>
    </section>
  )
}

/** Rodapé de formulário dentro do cartão: filete em cima, ações à direita. */
export function RodapeDoCartao({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-filete pt-6 max-md:flex-col-reverse max-md:items-stretch">
      {children}
    </div>
  )
}
