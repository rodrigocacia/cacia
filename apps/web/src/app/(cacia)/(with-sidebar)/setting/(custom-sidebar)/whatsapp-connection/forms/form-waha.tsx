"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/custom-button"
import { CustomSelect } from "@/components/ui/custom-select"
import { Input } from "@/components/ui/custom-input"

import { Plus, RefreshCw } from "lucide-react"
import { GetQrCodeResponse, getQrCode } from "@/http/connection/qr-code"
import { createConnection } from "@/http/connection/create-connection"
import { disconnect } from "@/http/connection/disconnect"
import { setConnectionProxy } from "@/http/connection/set-proxy"
import { useConnection } from "@/http/hooks/connection"
import { BR_STATES } from "@/constants/br-states"

import {
  ChipSituacao,
  ErroConexao,
  PerfilConexao,
  QrConexao,
  SecaoConexao,
} from "./partes-conexao"

interface FormWahaProps {
  qrCode: GetQrCodeResponse | null
}

const PROXY_SCOPE_LABEL: Record<string, string> = {
  city: "cidade",
  state: "estado",
  country: "país",
}

export function FormWaha({ qrCode }: FormWahaProps) {
  const [typeConnection, setTypeConnection] = useState<
    "HAS_SET" | "HAS_NOT_SET" | "CREATING_CONNECTION" | "CREATING_RECONNECTION"
  >("HAS_SET")
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [liveQrCode, setLiveQrCode] = useState<GetQrCodeResponse | null>(qrCode)
  const [isLoadingQr, setIsLoadingQr] = useState(false)
  const [qrError, setQrError] = useState<string | null>(null)

  const [proxyState, setProxyState] = useState("")
  const [proxyCity, setProxyCity] = useState("")
  const [isSavingProxy, setIsSavingProxy] = useState(false)
  const [proxyFeedback, setProxyFeedback] = useState<string | null>(null)

  const { connection, mutate } = useConnection()

  const isWorking = connection?.waha_state === "WORKING"

  useEffect(() => {
    if (connection?.waha_phone) {
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
          ? "Não foi possível gerar o QR agora. A sessão pode estar reiniciando — tente de novo em alguns segundos."
          : "Não foi possível criar a conexão. Confira se o provedor de WhatsApp está configurado e tente de novo."
      )
      setLiveQrCode(null)
    } finally {
      setIsLoadingQr(false)
    }
  }

  const handleSaveProxy = async () => {
    if (!connection || !proxyState) return

    setIsSavingProxy(true)
    setProxyFeedback(null)

    try {
      const updated = await setConnectionProxy({
        connectionId: connection._id,
        state: proxyState,
        city: proxyCity || undefined,
      })

      const scopeLabel = updated.proxy_scope
        ? PROXY_SCOPE_LABEL[updated.proxy_scope]
        : "país"

      setProxyFeedback(
        proxyCity && updated.proxy_scope !== "city"
          ? `Não encontramos proxy em "${proxyCity}" — usando o proxy do ${scopeLabel} (${updated.proxy_state}).`
          : `Proxy configurado com sucesso (nível: ${scopeLabel}). A sessão vai reiniciar — escaneie o QR de novo.`
      )
      mutate()
    } catch {
      setProxyFeedback("Erro ao configurar o proxy. Tente novamente.")
    } finally {
      setIsSavingProxy(false)
    }
  }

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
      {connection?.fallback_enabled && (
        <p className="text-[13px] text-tinta-3">
          Provedor ativo: <strong className="text-tinta-2">Provedor 1</strong> ·
          reserva: <strong className="text-tinta-2">Provedor 2</strong>
        </p>
      )}

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
            nome={connection?.waha_profile_name}
            telefone={connection?.waha_phone}
            foto={connection?.waha_profile_picture_url}
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

      <SecaoConexao
        titulo="Proxy residencial"
        descricao="Escolha o estado (obrigatório) e, se quiser mais precisão, a cidade. Se não houver proxy disponível na cidade, usamos o do estado automaticamente."
      >
        <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
          <CustomSelect
            label="Estado"
            iconName="place"
            placeholder="Selecione o estado"
            options={BR_STATES}
            value={proxyState}
            onChange={setProxyState}
          />
          <Input
            type="text"
            label="Cidade (opcional)"
            iconName="place"
            placeholder="Ex.: Campinas"
            value={proxyCity}
            onChange={(e) => setProxyCity(e.target.value)}
          />
        </div>

        {connection?.proxy_scope && (
          <p className="text-[13px] text-turquesa-profundo">
            Proxy atual:{" "}
            {connection.proxy_city ? `${connection.proxy_city}, ` : ""}
            {connection.proxy_state} (nível:{" "}
            {PROXY_SCOPE_LABEL[connection.proxy_scope]})
          </p>
        )}

        {proxyFeedback && (
          <p role="status" className="text-[13px] text-tinta-2">
            {proxyFeedback}
          </p>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="max-sm:w-full"
            disabled={!proxyState || isSavingProxy}
            onClick={handleSaveProxy}
          >
            {isSavingProxy ? "Salvando..." : "Salvar proxy"}
          </Button>
        </div>
      </SecaoConexao>
    </div>
  )
}
