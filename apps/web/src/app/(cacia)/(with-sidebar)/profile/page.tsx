import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { Cartao } from "../setting/_ui/cartao"
import { DescricoesDaConta, GruposDaConta } from "./navs"

export default function Profile() {
  const itens = GruposDaConta.flatMap((grupo) => grupo.itens)

  return (
    <Cartao
      titulo="Sua conta"
      descricao="Escolha o que quer atualizar."
      semRecuo
    >
      <ul className="flex flex-col">
        {itens.map((item) => {
          const Icone = item.icone

          return (
            <li
              key={item.path}
              className="border-t border-[#F1EEE8] first:border-t-0"
            >
              <Link
                href={item.path}
                className="group flex items-center gap-3 px-7 py-4 transition-colors hover:bg-[#FBFAF7] max-md:px-5"
              >
                <Icone
                  size={17}
                  strokeWidth={1.7}
                  className="shrink-0 text-tinta-3"
                  aria-hidden
                />

                <span className="flex min-w-0 flex-grow flex-col">
                  <span className="text-[14px] font-medium text-tinta">
                    {item.nome}
                  </span>
                  <span className="text-[13px] text-tinta-3">
                    {DescricoesDaConta[item.path]}
                  </span>
                </span>

                <ChevronRight
                  size={16}
                  strokeWidth={1.7}
                  className="shrink-0 text-tinta-3 transition-colors group-hover:text-tinta"
                  aria-hidden
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </Cartao>
  )
}
