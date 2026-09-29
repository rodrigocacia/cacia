"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/custom-button"

import { Plus } from "lucide-react"
import Image from "next/image"
import { GetQrCodeResponse, getQrCode } from "@/http/connection/qr-code"
import { createConnection } from "@/http/connection/create-connection"
import { disconnect } from "@/http/connection/disconnect"
import { useConnection } from "@/http/hooks/connection"
import { CustomAvatar } from "@/components/ui/custom-avatar"
import { formatPhone, formatName } from "@/utils/formatters"

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

  return (
    <div className="w-full h-full">
      <div className="w-full mt-6 flex flex-col justify-between gap-8 pb-10">
        {typeConnection === "HAS_SET" && (
          <div className="w-full flex flex-col gap-4 bg-[#ECF7F8] px-4 py-4 rounded-[12px]">
            <div className="w-full flex items-end justify-between max-lg:items-start max-lg:flex-col max-lg:gap-4">
              <div className="flex items-start flex-col gap-2">
                <h4 className="text-base text-[#707070] font-semibold">
                  Status
                </h4>

                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      connection?.evolution_state === "open"
                        ? "bg-[#16A31B]"
                        : "bg-[#FF3B30]"
                    }`}
                  />
                  <span className="text-sm text-[#707070] font-medium">
                    {connection?.evolution_state === "open"
                      ? "Conectado"
                      : "Desconectado"}
                  </span>
                </div>

                <div className="flex items-center gap-2 h-full">
                  {connection?.evolution_profile_picture_url ? (
                    <Image
                      src={connection.evolution_profile_picture_url}
                      alt="Provedor 2"
                      width={60}
                      height={60}
                      className="rounded-full w-15 h-15 object-cover"
                    />
                  ) : (
                    <CustomAvatar
                      name={connection?.evolution_profile_name || "Usuário"}
                      size="md"
                      className="rounded-full w-15 h-15 object-cover"
                    />
                  )}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm text-[#707070] font-bold">
                      {formatName(connection?.evolution_profile_name || "")}
                    </h3>
                    <span className="text-xs text-[#707070] font-normal">
                      {formatPhone(connection?.evolution_phone || "")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-start flex-col gap-2 max-lg:items-center max-lg:w-full">
                {connection?.evolution_state === "open" ? (
                  <Button
                    className="min-w-[190px] cursor-pointer text-[#FF3B30] bg-[#FFFFFF] border-[#FF3B30] border hover:bg-[#FF3B30] hover:text-[#FFFFFF] max-md:hidden"
                    variant="danger"
                    onClick={handleDisconnect}
                  >
                    Desconectar
                  </Button>
                ) : (
                  <>
                    {isReconnecting && liveQrCode?.data?.base64 ? (
                      <div className="flex flex-col gap-2 items-center">
                        <Image
                          src={liveQrCode.data.base64}
                          alt="QR Code"
                          width={160}
                          height={160}
                          className="rounded-lg"
                        />
                        <p className="text-[13px] text-[#707070] text-center">
                          Escaneie o Qrcode para conectar<br></br>seu WhatsApp a
                          CacIA.
                        </p>
                      </div>
                    ) : (
                      <Button
                        className="min-w-[180px] cursor-pointer text-[#219653] bg-[#FFFFFF] border-[#219653] border hover:bg-[#219653] hover:text-[#FFFFFF]"
                        variant="outline"
                        disabled={isLoadingQr}
                        onClick={() => {
                          setIsReconnecting(true)
                          handleFetchQr()
                        }}
                      >
                        <span className="text-[#219653] font-medium">
                          {isLoadingQr ? "Gerando QR..." : "Conectar"}
                        </span>
                      </Button>
                    )}
                    {qrError && (
                      <p className="text-xs text-[#F44336] max-w-[200px] text-right">
                        {qrError}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {typeConnection === "HAS_NOT_SET" && (
          <div className="w-full flex flex-col justify-between gap-4">
            <div className="w-full flex justify-between bg-[#FCFCFD] px-3 py-4 rounded-[12px]">
              <div className="flex flex-col gap-2">
                <h4 className="text-base text-[#707070] font-semibold">
                  Status
                </h4>

                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF3B30]" />
                  <span className="text-sm text-[#707070] font-medium">
                    Desconectado
                  </span>
                </div>
              </div>

              <Button
                className="min-w-[180px] cursor-pointer text-[#219653]"
                variant="outline"
                iconLeft={<Plus className="text-[#219653]" />}
                disabled={isLoadingQr}
                onClick={() => {
                  setTypeConnection("CREATING_CONNECTION")
                  handleFetchQr()
                }}
              >
                <span className="text-[#219653] font-medium">
                  {isLoadingQr ? "Gerando QR..." : "Criar conexão"}
                </span>
              </Button>
            </div>
          </div>
        )}

        {typeConnection === "CREATING_CONNECTION" && (
          <div className="w-full flex flex-col gap-4">
            <div className="w-full flex justify-between bg-[#FCFCFD] px-3 py-4 rounded-[12px]">
              <div className="flex flex-col gap-2">
                <h4 className="text-base text-[#707070] font-semibold">
                  Status
                </h4>

                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF3B30]" />
                  <span className="text-sm text-[#707070] font-medium">
                    {liveQrCode ? "Aguardando conexão..." : "Desconectado"}
                  </span>
                </div>
                {qrError && (
                  <p className="text-xs text-[#F44336] max-w-[220px]">
                    {qrError}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                {liveQrCode?.data?.base64 && (
                  <>
                    <Image
                      src={liveQrCode.data.base64}
                      alt="QR Code"
                      width={180}
                      height={180}
                      className="rounded-lg"
                    />
                    <p className="text-[13px] text-[#707070] text-center">
                      Abra o WhatsApp e vá em Aparelhos conectados &gt; Conectar
                      aparelho.
                    </p>
                  </>
                )}

                <Button
                  className="min-w-[190px] cursor-pointer"
                  variant="outline"
                  iconLeft={<Plus />}
                  disabled={isLoadingQr}
                  onClick={handleFetchQr}
                >
                  {isLoadingQr
                    ? "Gerando QR..."
                    : liveQrCode
                      ? "Atualizar QR"
                      : "Atualizar"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
