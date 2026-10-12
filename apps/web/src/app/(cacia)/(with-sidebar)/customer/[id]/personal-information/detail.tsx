import {
  formatDocument,
  formatPhone,
  getDocumentType,
} from "@/utils/formatters"
import { Address } from "@/types/address"
import { Detalhe, GrupoDeDetalhes, Painel } from "@/components/tables/ficha"

interface CustomerDetailProps {
  name?: string
  document: string
  email?: string
  address?: Address | null
  phone?: string
}

export function CustomerDetail({
  name,
  document,
  email,
  address,
  phone,
}: CustomerDetailProps) {
  const enderecoCompleto = address
    ? [
        [address.street, address.number].filter(Boolean).join(", "),
        address.complement,
        address.neighborhood,
        [address.city, address.state].filter(Boolean).join(" / "),
      ]
        .filter(Boolean)
        .join(" · ")
    : null

  return (
    <div className="grid max-w-[880px] gap-5">
      <Painel titulo="Dados do cliente">
        <div className="flex flex-col gap-5">
          <GrupoDeDetalhes titulo="Identificação">
            {name && <Detalhe rotulo="Nome completo">{name}</Detalhe>}
            <Detalhe rotulo={document ? getDocumentType(document) : "CPF"}>
              <span className="tabular">
                {document ? formatDocument(document) : "—"}
              </span>
            </Detalhe>
          </GrupoDeDetalhes>

          <GrupoDeDetalhes titulo="Contato">
            <Detalhe rotulo="Telefone">
              {phone ? (
                <a
                  href={`tel:+${phone.replace(/\D/g, "")}`}
                  className="tabular text-turquesa-profundo hover:underline"
                >
                  {formatPhone(phone)}
                </a>
              ) : (
                "—"
              )}
            </Detalhe>
            <Detalhe rotulo="E-mail">
              {email ? (
                <a
                  href={`mailto:${email}`}
                  className="text-turquesa-profundo hover:underline"
                >
                  {email}
                </a>
              ) : (
                "—"
              )}
            </Detalhe>
          </GrupoDeDetalhes>

          <GrupoDeDetalhes titulo="Endereço">
            <Detalhe rotulo="Endereço">{enderecoCompleto || "—"}</Detalhe>
            {address?.cep && (
              <Detalhe rotulo="CEP">
                <span className="tabular">{address.cep}</span>
              </Detalhe>
            )}
          </GrupoDeDetalhes>
        </div>
      </Painel>
    </div>
  )
}
