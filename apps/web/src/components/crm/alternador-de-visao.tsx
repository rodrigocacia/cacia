"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Icon } from "@/components/icone"

const VISOES = [
  { chave: "", rotulo: "Tabela", icon: "mdi:table" },
  { chave: "kanban", rotulo: "Funil", icon: "mdi:view-column-outline" },
] as const

/**
 * Alterna entre a tabela e o quadro.
 *
 * A escolha vive na URL, não em estado local: quem manda o link do funil
 * filtrado para um colega precisa que o colega veja o funil, e não a tabela.
 */
export function AlternadorDeVisao() {
  const router = useRouter()
  const pathname = usePathname()
  const parametros = useSearchParams()

  const atual = parametros.get("view") ?? ""

  function trocar(visao: string): void {
    const query = new URLSearchParams(parametros.toString())

    if (visao) query.set("view", visao)
    else query.delete("view")

    // A paginação da tabela não faz sentido no quadro, e vice-versa
    query.delete("page")

    router.push(`${pathname}?${query.toString()}`)
  }

  return (
    <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5">
      {VISOES.map((visao) => (
        <button
          key={visao.chave || "tabela"}
          type="button"
          onClick={() => trocar(visao.chave)}
          aria-pressed={atual === visao.chave}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition ${
            atual === visao.chave
              ? "bg-zinc-900 text-white"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          <Icon icon={visao.icon} className="h-4 w-4" />
          {visao.rotulo}
        </button>
      ))}
    </div>
  )
}
