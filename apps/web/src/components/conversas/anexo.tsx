"use client"

import { useRef } from "react"
import clsx from "clsx"

import { Icon } from "@/components/icone"
import type { Mensagem } from "@/http/crm/conversas"

/** O link assinado vale 15 min; troca com folga antes de vencer. */
const RENOVAR_LINK_MS = 10 * 60 * 1000

/**
 * Links de anexo que não mudam a cada consulta.
 *
 * A API assina o link de novo a cada resposta, e a tela consulta a cada
 * poucos segundos. Usar o link novo toda vez faria a imagem ser baixada de
 * novo e o áudio voltar ao começo no meio da reprodução. Guarda o primeiro e
 * só troca quando ele está perto de vencer.
 */
export function useLinksEstaveis() {
  const guardados = useRef(new Map<string, { url: string; em: number }>())

  return function linkDe(mensagem: Mensagem): string | null {
    if (!mensagem.messageFileUrl) return null

    const agora = Date.now()
    const guardado = guardados.current.get(mensagem.id)

    if (guardado && agora - guardado.em < RENOVAR_LINK_MS) return guardado.url

    guardados.current.set(mensagem.id, {
      url: mensagem.messageFileUrl,
      em: agora,
    })
    return mensagem.messageFileUrl
  }
}

const ROTULO: Record<string, string> = {
  IMAGE: "Imagem",
  AUDIO: "Áudio",
  VIDEO: "Vídeo",
  DOCUMENT: "Documento",
  LOCATION: "Localização",
  CONTACT: "Contato",
}

export function temAnexo(mensagem: Mensagem): boolean {
  return mensagem.type in ROTULO
}

function tamanho(bytes: number | null): string | null {
  if (!bytes) return null
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`
}

export function ConteudoDoAnexo({
  mensagem,
  url,
  escura,
}: {
  mensagem: Mensagem
  url: string | null
  /** Balão escuro (resposta da equipe): texto claro. */
  escura: boolean
}) {
  const rotulo = ROTULO[mensagem.type] ?? "Anexo"

  if (url && mensagem.type === "IMAGE") {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="mb-1 block">
        {/* eslint-disable-next-line @next/next/no-img-element -- link assinado e temporário, fora do otimizador do Next */}
        <img
          src={url}
          alt={mensagem.messageCaption ?? "Imagem enviada"}
          className="max-h-72 w-auto max-w-full rounded-lg object-contain"
          loading="lazy"
        />
      </a>
    )
  }

  if (url && mensagem.type === "AUDIO") {
    return (
      <audio
        controls
        preload="none"
        src={url}
        className="mb-1 h-10 w-64 max-w-full"
      />
    )
  }

  if (url && mensagem.type === "VIDEO") {
    return (
      <video
        controls
        preload="metadata"
        src={url}
        className="mb-1 max-h-72 max-w-full rounded-lg"
      />
    )
  }

  const detalhe = [
    mensagem.messageFileExtension?.toUpperCase(),
    tamanho(mensagem.messageFileSizeBytes),
  ]
    .filter(Boolean)
    .join(" · ")

  const corpo = (
    <>
      <span
        className={clsx(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          escura ? "bg-white/15" : "bg-[#E6F2F4] text-[#2A727C]"
        )}
      >
        {mensagem.type === "DOCUMENT" ? (
          <Icon icon="mdi:file-document-outline" className="h-5 w-5" />
        ) : (
          <Icon icon="mdi:paperclip" className="h-5 w-5" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{rotulo}</span>
        <span
          className={clsx(
            "block text-[11px]",
            escura ? "text-white/70" : "text-zinc-500"
          )}
        >
          {url ? detalhe || "Abrir" : "Arquivo indisponível"}
        </span>
      </span>
    </>
  )

  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={clsx(
        "mb-1 flex items-center gap-2 rounded-lg p-1.5 pr-3 transition",
        escura ? "hover:bg-white/10" : "hover:bg-zinc-50"
      )}
    >
      {corpo}
    </a>
  ) : (
    <div className="mb-1 flex items-center gap-2 p-1.5 pr-3">{corpo}</div>
  )
}
