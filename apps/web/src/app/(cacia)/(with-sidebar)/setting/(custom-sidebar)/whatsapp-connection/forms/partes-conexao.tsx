import { ReactNode } from "react"
import Image from "next/image"
import clsx from "clsx"

import { CustomAvatar } from "@/components/ui/custom-avatar"
import { formatPhone, nomeParaExibir } from "@/utils/formatters"

/**
 * Peças visuais comuns aos formulários de conexão do WhatsApp (provedor 1 e
 * provedor 2). Seções separadas por filete, estado em chip contornado com
 * ponto colorido — nada de caixas preenchidas.
 */

export function SecaoConexao({
  titulo,
  descricao,
  acao,
  children,
}: {
  titulo: ReactNode
  descricao?: ReactNode
  acao?: ReactNode
  children?: ReactNode
}) {
  return (
    <section className="flex flex-col gap-4 border-t border-filete pt-6 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-[14.5px] font-semibold text-tinta">{titulo}</h3>
          {descricao && (
            <div className="text-[13px] leading-relaxed text-tinta-3">
              {descricao}
            </div>
          )}
        </div>
        {acao && <div className="max-sm:w-full">{acao}</div>}
      </div>
      {children}
    </section>
  )
}

type Situacao = "conectado" | "desconectado" | "aguardando"

const PONTO: Record<Situacao, string> = {
  conectado: "bg-acao",
  desconectado: "bg-[#C0533F]",
  aguardando: "bg-ambar-ponto",
}

export function ChipSituacao({
  situacao,
  children,
}: {
  situacao: Situacao
  children: ReactNode
}) {
  return (
    <span className="inline-flex h-[22px] w-fit items-center gap-1.5 rounded-md border border-[#E3DED6] bg-white px-2 text-xs font-medium text-tinta-2">
      <span
        aria-hidden
        className={clsx("h-1.5 w-1.5 rounded-full", PONTO[situacao])}
      />
      {children}
    </span>
  )
}

export function PerfilConexao({
  nome,
  telefone,
  foto,
}: {
  nome?: string | null
  telefone?: string | null
  foto?: string | null
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {foto ? (
        <Image
          src={foto}
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 rounded-full object-cover"
        />
      ) : (
        <CustomAvatar
          name={nome || "Usuário"}
          size="md"
          className="h-11 w-11"
        />
      )}
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-[14px] font-medium text-tinta">
          {nomeParaExibir(nome || "") || "Sem nome no perfil"}
        </span>
        <span className="tabular text-[13px] text-tinta-3">
          {formatPhone(telefone || "")}
        </span>
      </div>
    </div>
  )
}

export function QrConexao({
  base64,
  instrucao,
}: {
  base64: string
  instrucao: ReactNode
}) {
  return (
    <div className="flex w-fit flex-col items-center gap-3 rounded-[14px] border border-filete bg-white p-4 max-sm:w-full">
      <Image
        src={base64}
        alt="QR Code para conectar o WhatsApp"
        width={180}
        height={180}
        className="rounded-lg"
      />
      <p className="max-w-[220px] text-center text-[13px] text-tinta-2">
        {instrucao}
      </p>
    </div>
  )
}

export function ErroConexao({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-[13px] text-[#A23B2A]">
      {children}
    </p>
  )
}
