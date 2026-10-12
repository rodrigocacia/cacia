"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import clsx from "clsx"
import type { LucideIcon } from "lucide-react"

export interface ItemDaNav {
  nome: string
  path: string
  icone: LucideIcon
}

export interface GrupoDaNav {
  rotulo?: string
  itens: ItemDaNav[]
}

interface NavDeSecoesProps {
  grupos: GrupoDaNav[]
  /** Nome da navegação para leitores de tela. */
  rotulo: string
  /**
   * Caminho do item ativo, quando a rota sozinha não basta para dizê-lo (as
   * notificações filtram pela query string). Sem ele, compara o início da rota.
   */
  atual?: string
}

function ativoPorPrefixo(path: string, pathname: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`)
}

/**
 * Navegação entre as seções de uma área (Configurações, Minha conta).
 *
 * No desktop é uma lista à esquerda, agrupada por rótulos; abaixo de `md`
 * vira uma faixa de abas sublinhadas que rola na horizontal — antes a lista
 * simplesmente sumia no celular e não havia como trocar de seção.
 */
export function NavDeSecoes({
  grupos,
  rotulo,
  atual: caminhoAtual,
}: NavDeSecoesProps) {
  const pathname = usePathname()

  const ativo = (path: string): boolean =>
    caminhoAtual !== undefined
      ? caminhoAtual === path
      : ativoPorPrefixo(path, pathname)
  const faixa = useRef<HTMLDivElement>(null)

  const todos = grupos.flatMap((grupo) => grupo.itens)

  // Na faixa do celular, a aba ativa pode estar fora da tela: centraliza-a
  // mexendo só na rolagem horizontal da própria faixa (scrollIntoView
  // rolaria a página também).
  useEffect(() => {
    const el = faixa.current
    const atual = el?.querySelector<HTMLElement>("[aria-current='page']")
    if (!el || !atual) return

    el.scrollLeft =
      atual.offsetLeft - el.clientWidth / 2 + atual.clientWidth / 2
  }, [pathname, caminhoAtual])

  return (
    <nav aria-label={rotulo} className="min-w-0">
      {/* Celular: abas sublinhadas */}
      <div
        ref={faixa}
        className="-mx-4 flex gap-[18px] overflow-x-auto border-b border-filete px-4 text-[13px] [scrollbar-width:none] md:hidden"
      >
        {todos.map((item) => {
          const atual = ativo(item.path)

          return (
            <Link
              key={item.path}
              href={item.path}
              aria-current={atual ? "page" : undefined}
              className={clsx(
                "-mb-px shrink-0 border-b-2 pb-2.5 whitespace-nowrap transition-colors",
                atual
                  ? "border-tinta font-semibold text-tinta"
                  : "border-transparent text-tinta-3 hover:text-tinta"
              )}
            >
              {item.nome}
            </Link>
          )
        })}
      </div>

      {/* Desktop: lista agrupada */}
      <div className="flex flex-col gap-6 max-md:hidden">
        {grupos.map((grupo, indice) => (
          <div key={grupo.rotulo ?? indice} className="flex flex-col gap-1.5">
            {grupo.rotulo && (
              <span className="rotulo px-2.5 pb-1">{grupo.rotulo}</span>
            )}

            <ul className="flex flex-col gap-0.5">
              {grupo.itens.map((item) => {
                const atual = ativo(item.path)
                const Icone = item.icone

                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      aria-current={atual ? "page" : undefined}
                      className={clsx(
                        "flex h-9 items-center gap-2.5 rounded-[9px] px-2.5 text-[13.5px] transition-colors",
                        atual
                          ? "bg-[#F1EEE8] font-medium text-tinta"
                          : "text-tinta-2 hover:bg-[#F6F4EF] hover:text-tinta"
                      )}
                    >
                      <Icone
                        size={16}
                        strokeWidth={1.7}
                        className={atual ? "text-tinta" : "text-tinta-3"}
                        aria-hidden
                      />
                      <span className="truncate">{item.nome}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  )
}
