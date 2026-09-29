"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Formatos em ordem de preferência. OGG/Opus é o nativo do WhatsApp (só o
 * Firefox grava nele); Chrome grava WebM e Safari MP4, e o provedor converte
 * para voz na hora de enviar.
 */
const FORMATOS = [
  "audio/ogg;codecs=opus",
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
]

function extensaoDe(mime: string): string {
  if (mime.includes("ogg")) return "ogg"
  if (mime.includes("mp4")) return "m4a"
  return "webm"
}

export interface AudioGravado {
  arquivo: Blob
  nome: string
}

/**
 * Grava áudio pelo microfone do navegador.
 *
 * `parar(true)` devolve o áudio; `parar(false)` descarta. O microfone é
 * sempre liberado ao parar ou ao sair da tela: esquecido aberto, o navegador
 * fica mostrando o ícone de gravação.
 */
export function useGravador() {
  const [gravando, setGravando] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const [erro, setErro] = useState<string | null>(null)

  const gravador = useRef<MediaRecorder | null>(null)
  const partes = useRef<Blob[]>([])
  const relogio = useRef<ReturnType<typeof setInterval> | null>(null)

  function liberar() {
    if (relogio.current) clearInterval(relogio.current)
    relogio.current = null
    gravador.current?.stream.getTracks().forEach((t) => t.stop())
    gravador.current = null
    setGravando(false)
    setSegundos(0)
  }

  useEffect(() => liberar, [])

  const disponivel =
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia

  async function iniciar() {
    setErro(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = FORMATOS.find((f) => MediaRecorder.isTypeSupported(f))
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : {})

      partes.current = []
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) partes.current.push(e.data)
      }
      rec.start()

      gravador.current = rec
      setGravando(true)
      setSegundos(0)
      relogio.current = setInterval(() => setSegundos((s) => s + 1), 1000)
    } catch {
      setErro(
        "Não foi possível usar o microfone. Verifique a permissão do navegador."
      )
      liberar()
    }
  }

  function parar(aproveitar: boolean): Promise<AudioGravado | null> {
    const rec = gravador.current

    if (!rec || rec.state === "inactive") {
      liberar()
      return Promise.resolve(null)
    }

    return new Promise((resolver) => {
      rec.onstop = () => {
        const mime = rec.mimeType || "audio/webm"
        const arquivo = new Blob(partes.current, { type: mime })
        liberar()

        resolver(
          aproveitar && arquivo.size > 0
            ? { arquivo, nome: `audio.${extensaoDe(mime)}` }
            : null
        )
      }
      rec.stop()
    })
  }

  return { disponivel, gravando, segundos, erro, iniciar, parar }
}
