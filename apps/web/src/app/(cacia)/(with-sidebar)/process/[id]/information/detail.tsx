"use client"

import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { ProcessBadge } from "@/components/ui/badge/proccess.badge"
import { Detalhe, GrupoDeDetalhes, Painel } from "@/components/tables/ficha"
import { Process } from "@/types/process"
import {
  formatDocument,
  formatPhone,
  formatProcess,
  formatNumberToCurrency,
} from "@/utils/formatters"

interface ProcessDetailProps {
  process: Process
}

export function ProcessDetail({ process }: ProcessDetailProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
      <Painel titulo="Dados do processo">
        <dl className="flex flex-col">
          <Detalhe rotulo="Número">
            <span className="tabular">{formatProcess(process?.number)}</span>
          </Detalhe>

          <Detalhe rotulo="Status">
            <ProcessBadge variant={process?.status} />
          </Detalhe>

          {process?.name && (
            <Detalhe rotulo="Partes do processo">{process?.name}</Detalhe>
          )}

          {process?.amount && (
            <Detalhe rotulo="Valor">
              <span className="tabular">
                {formatNumberToCurrency(process?.amount)}
              </span>
            </Detalhe>
          )}

          {process?.secrecy_level && (
            <Detalhe rotulo="Nível de sigilo">{process?.secrecy_level}</Detalhe>
          )}

          {process?.instance && (
            <Detalhe rotulo="Instância">{process?.instance}</Detalhe>
          )}

          {process?.judge && <Detalhe rotulo="Juiz">{process?.judge}</Detalhe>}

          {process?.justice_description && (
            <Detalhe rotulo="Justiça">{process?.justice_description}</Detalhe>
          )}

          {process?.county && (
            <Detalhe rotulo="Vara">{process?.county}</Detalhe>
          )}

          {process?.distribution_date && (
            <Detalhe rotulo="Distribuição">
              <span className="tabular">
                {format(new Date(process?.distribution_date), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </span>
            </Detalhe>
          )}

          {process?.city && <Detalhe rotulo="Comarca">{process?.city}</Detalhe>}

          {process?.state && (
            <Detalhe rotulo="Estado">{process?.state}</Detalhe>
          )}

          {process?.courts && process?.courts.length > 0 && (
            <Detalhe rotulo="Tribunais">
              <ul className="flex flex-col gap-0.5">
                {process?.courts.map((court) => (
                  <li key={court.name}>{court.name}</li>
                ))}
              </ul>
            </Detalhe>
          )}

          {process?.classifications && process?.classifications.length > 0 && (
            <Detalhe rotulo="Classificações">
              <ul className="flex flex-col gap-0.5">
                {process?.classifications.map((classification) => (
                  <li key={classification.name}>{classification.name}</li>
                ))}
              </ul>
            </Detalhe>
          )}

          {process?.subjects && process?.subjects.length > 0 && (
            <Detalhe rotulo="Assuntos">
              <ul className="flex flex-col gap-0.5">
                {process?.subjects.map((subject) => (
                  <li key={subject.name}>{subject.name}</li>
                ))}
              </ul>
            </Detalhe>
          )}
        </dl>
      </Painel>

      {process?.customer ? (
        <Painel
          titulo="Cliente"
          className="h-fit"
          acao={
            <Link
              href={`/customer/${process?.customer?._id}/personal-information`}
              className="text-[12.5px] font-medium text-turquesa-profundo hover:underline"
            >
              Abrir ficha
            </Link>
          }
        >
          <GrupoDeDetalhes titulo="Dados do cliente">
            <Detalhe rotulo="Nome">
              <Link
                href={`/customer/${process?.customer?._id}/personal-information`}
                className="hover:text-turquesa-profundo hover:underline"
              >
                {process?.customer?.name}
              </Link>
            </Detalhe>

            <Detalhe rotulo="CPF/CNPJ">
              <span className="tabular">
                {formatDocument(process?.customer?.document)}
              </span>
            </Detalhe>

            <Detalhe rotulo="E-mail">
              {process?.customer?.email ? (
                <a
                  href={`mailto:${process?.customer?.email}`}
                  className="text-turquesa-profundo hover:underline"
                >
                  {process?.customer?.email}
                </a>
              ) : (
                "—"
              )}
            </Detalhe>

            <Detalhe rotulo="Telefone">
              <span className="tabular">
                {formatPhone(process?.customer?.remotejid)}
              </span>
            </Detalhe>
          </GrupoDeDetalhes>
        </Painel>
      ) : null}
    </div>
  )
}
