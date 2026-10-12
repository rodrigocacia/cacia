"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/custom-button"

import { Plus, RefreshCw } from "lucide-react"
import { GetQrCodeResponse, getQrCode } from "@/http/connection/qr-code"
import { createConnection } from "@/http/connection/create-connection"
import { disconnect } from "@/http/connection/disconnect"
import { useConnection } from "@/http/hooks/connection"

import {
  ChipSituacao,
  ErroConexao,
  PerfilConexao,
  QrConexao,
  SecaoConexao,
} from "./partes-conexao"

interface FormEvolutionApiProps {
  qrCode: GetQrCodeResponse | null
}

export function FormEvolutionApi({ qrCode }: FormEvolutionApiProps) {
  const [typeConnection, setTypeConnection] = useState<
    "HAS_SET" | "HAS_NOT_SET" | "CREATING_CONNECTION" | "CREATING_RECONNECTION"
  >("HAS_SET")
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [liveQrCode, setLiveQrCode] = useState<GetQrCodeResponse | null>(qrCode)
  const [isLoadingQr, setIsLoadingQr] = useState(false)
  const [qrError, setQrError] = useState<string | null>(null)

  const { connection, mutate } = useConnection()

  useEffect(() => {
    if (connection?.evolution_phone) {
      setTypeConnection("HAS_SET")
    } else {
      setTypeConnection("HAS_NOT_SET")
    }
  }, [connection])

  const handleDisconnect = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    if (!connection) return

    await disconnect({ connectionId: connection?._id })
    mutate()
  }

  const handleFetchQr = async () => {
    setIsLoadingQr(true)
    setQrError(null)

    try {
      // Sem conexão cadastrada: cria uma antes de pedir o QR. No sistema
      // anterior ela nascia com o escritório; na API nova é sob demanda.
      const alvo = connection ?? (await createConnection())
      if (!alvo) throw new Error("Conexão não criada")

      const result = await getQrCode({ connectionId: alvo._id })
      setLiveQrCode(result)

      if (!connection) {
        await mutate()
        setTypeConnection("CREATING_CONNECTION")
      }
    } catch {
      setQrError(
        connection
          ? "Não foi possível gerar o QR agora. Tente de novo em alguns segundos."
          : "Não foi possível criar a conexão. Confira se o provedor de WhatsApp está configurado e tente de novo."
      )
      setLiveQrCode(null)
    } finally {
      setIsLoadingQr(false)
    }
  }

  const isWorking = connection?.evolution_state === "open"

  const botaoCriar = (
    <Button
      type="button"
      variant="primary"
      iconLeft={<Plus size={16} strokeWidth={1.8} />}
      disabled={isLoadingQr}
      className="max-sm:w-full"
      onClick={() => {
        setTypeConnection("CREATING_CONNECTION")
        handleFetchQr()
      }}
    >
      {isLoadingQr ? "Gerando QR..." : "Criar conexão"}
    </Button>
  )

  return (
    <div className="mt-6 flex w-full flex-col gap-6">
      {typeConnection === "HAS_SET" && (
        <SecaoConexao
          titulo="Status"
          acao={
            isWorking ? (
              <Button
                type="button"
                variant="danger"
                className="max-md:hidden"
                onClick={handleDisconnect}
              >
                Desconectar
              </Button>
            ) : isReconnecting && liveQrCode?.data?.base64 ? null : (
              <Button
                type="button"
                variant="primary"
                disabled={isLoadingQr}
                className="max-sm:w-full"
                onClick={() => {
                  setIsReconnecting(true)
                  handleFetchQr()
                }}
              >
                {isLoadingQr ? "Gerando QR..." : "Conectar"}
              </Button>
            )
          }
        >
          <ChipSituacao situacao={isWorking ? "conectado" : "desconectado"}>
            {isWorking ? "Conectado" : "Desconectado"}
          </ChipSituacao>

          <PerfilConexao
            nome={connection?.evolution_profile_name}
            telefone={connection?.evolution_phone}
            foto={connection?.evolution_profile_picture_url}
          />

          {!isWorking && isReconnecting && liveQrCode?.data?.base64 && (
            <QrConexao
              base64={liveQrCode.data.base64}
              instrucao="Escaneie o QR Code para conectar seu WhatsApp à CacIA."
            />
          )}

          {!isWorking && qrError && <ErroConexao>{qrError}</ErroConexao>}
        </SecaoConexao>
      )}

      {typeConnection === "HAS_NOT_SET" && (
        <SecaoConexao titulo="Status" acao={botaoCriar}>
          <ChipSituacao situacao="desconectado">Desconectado</ChipSituacao>
          {qrError && <ErroConexao>{qrError}</ErroConexao>}
        </SecaoConexao>
      )}

      {typeConnection === "CREATING_CONNECTION" && (
        <SecaoConexao
          titulo="Status"
          acao={
            <Button
              type="button"
              variant="outline"
              iconLeft={<RefreshCw size={15} strokeWidth={1.7} />}
              disabled={isLoadingQr}
              className="max-sm:w-full"
              onClick={handleFetchQr}
            >
              {isLoadingQr
                ? "Gerando QR..."
                : liveQrCode
                  ? "Atualizar QR"
                  : "Atualizar"}
            </Button>
          }
        >
          <ChipSituacao situacao={liveQrCode ? "aguardando" : "desconectado"}>
            {liveQrCode ? "Aguardando conexão..." : "Desconectado"}
          </ChipSituacao>

          {liveQrCode?.data?.base64 && (
            <QrConexao
              base64={liveQrCode.data.base64}
              instrucao={
                <>
                  Abra o WhatsApp e vá em Aparelhos conectados &gt; Conectar
                  aparelho.
                </>
              }
            />
          )}

          {qrError && <ErroConexao>{qrError}</ErroConexao>}
        </SecaoConexao>
      )}
    </div>
  )
}
