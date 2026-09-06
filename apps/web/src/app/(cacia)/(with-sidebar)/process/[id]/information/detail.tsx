"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Icon } from "@/components/icone"

import { ProcessBadge } from "@/components/ui/badge/proccess.badge"
import { Process } from "@/types/process"
import Link from "next/link"
import {
  formatDocument,
  formatPhone,
  formatProcess,
  formatName,
  formatNumberToCurrency,
} from "@/utils/formatters"

interface ProcessDetailProps {
  process: Process
}

export function ProcessDetail({ process }: ProcessDetailProps) {
  return (
    <div className="p-8 max-md:p-0 md:rounded-2xl md:shadow-sm max-md:mt-6">
      <div className="w-full flex items-center gap-3 max-md:hidden">
        <Icon
          icon="mdi:format-list-bulleted"
          className="text-[#BDBDBD] w-8 h-8"
        />

        <h3 className="text-[20px] text-[#707070] font-bold">Informações</h3>
      </div>

      <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200 max-md:hidden" />

      {process?.customer ? (
        <div className="w-full flex flex-col gap-3 bg-[#FCFCFD] rounded-[12px] p-3">
          <div className="w-full flex items-center gap-1.5">
            <Icon
              icon="mdi:account-circle"
              className="w-[22px] h-[22px] text-[#BBE2E7]"
            />

            <h2 className="text-base text-[#BDBDBD] font-semibold">
              DADOS DO CLIENTE
            </h2>
          </div>

          <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
            <h3 className="text-sm text-[#707070] font-bold">Nome completo</h3>

            <p className="text-base text-[#3D3D3D]">
              <Link
                href={`/customer/${process?.customer?._id}/personal-information`}
                className="text-base text-[#3D3D3D] hover:text-[#348C98] hover:underline transition-colors"
              >
                {formatName(process?.customer?.name)}
              </Link>
            </p>
          </div>

          <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
            <h3 className="text-sm text-[#707070] font-bold">CPF</h3>

            <p className="text-base text-[#3D3D3D]">
              {formatDocument(process?.customer?.document)}
            </p>
          </div>

          <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
            <h3 className="text-sm text-[#707070] font-bold">E-mail</h3>

            <p className="text-base text-[#348C98] underline">
              {process?.customer?.email}
            </p>
          </div>

          <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
            <h3 className="text-sm text-[#707070] font-bold">Telefone</h3>

            <p className="text-base text-[#348C98] underline">
              {formatPhone(process?.customer?.remotejid)}
            </p>
          </div>
        </div>
      ) : null}

      <div className="w-full flex flex-col gap-3 bg-[#FCFCFD] rounded-[12px] p-3 mt-8">
        <div className="w-full flex items-center gap-1.5">
          <Icon
            icon="mdi:folder-text"
            className="w-[22px] h-[22px] text-[#BBE2E7]"
          />

          <h2 className="text-base text-[#BDBDBD] font-semibold">
            DADOS DO PROCESSO
          </h2>
        </div>

        <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
          <h3 className="text-sm text-[#707070] font-bold">
            Número do Processo
          </h3>

          <p className="text-base text-[#3D3D3D]">
            {formatProcess(process?.number)}
          </p>
        </div>

        {process?.name && (
          <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
            <h3 className="text-sm text-[#707070] font-bold">
              Partes do processo
            </h3>

            <p className="text-base text-[#3D3D3D]">{process?.name}</p>
          </div>
        )}

        {process?.amount && (
          <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
            <h3 className="text-sm text-[#707070] font-bold">Valor</h3>
            <p className="text-base text-[#3D3D3D]">
              {formatNumberToCurrency(process?.amount)}
            </p>
          </div>
        )}

        {/* {process?.phase && (
          <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
            <h3 className="text-sm text-[#707070] font-bold">Fase</h3>

            <p className="text-base text-[#3D3D3D]">{process?.phase}</p>
          </div>
        )} */}

        {process?.secrecy_level && (
          <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
            <h3 className="text-sm text-[#707070] font-bold">
              Nível de Segurança
            </h3>

            <p className="text-base text-[#3D3D3D]">{process?.secrecy_level}</p>
          </div>
        )}

        {/* {process?.tribunal && ( 
          <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
            <h3 className="text-sm text-[#707070] font-bold">Tribunal</h3>

            <p className="text-base text-[#3D3D3D]">{process?.tribunal}</p>
          </div>
        )} */}

        {/* {process?.tribunal_acronym && ( 
          <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
            <h3 className="text-sm text-[#707070] font-bold">
              Acrônimo do Tribunal
            </h3>

            <p className="text-base text-[#3D3D3D]">
              {process?.tribunal_acronym}
            </p>
          </div>
        )}  */}

        {process?.instance && (
          <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
            <h3 className="text-sm text-[#707070] font-bold">Instância</h3>

            <p className="text-base text-[#3D3D3D]">{process?.instance}</p>
          </div>
        )}

        {process?.judge && (
          <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
            <h3 className="text-sm text-[#707070] font-bold">Juiz</h3>

            <p className="text-base text-[#3D3D3D]">{process?.judge}</p>
          </div>
        )}

        {/* {process?.justice && ( 
          <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
            <h3 className="text-sm text-[#707070] font-bold">Justiça</h3>

            <p className="text-base text-[#3D3D3D]">{process?.justice}</p>
          </div>
        )} */}

        {process?.justice_description && (
          <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
            <h3 className="text-sm text-[#707070] font-bold">
              Descrição da Justiça
            </h3>

            <p className="text-base text-[#3D3D3D]">
              {process?.justice_description}
            </p>
          </div>
        )}

        {process?.county && (
          <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
            <h3 className="text-sm text-[#707070] font-bold">Vara</h3>

            <p className="text-base text-[#3D3D3D]">{process?.county}</p>
          </div>
        )}

        {process?.distribution_date && (
          <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
            <h3 className="text-sm text-[#707070] font-bold">
              Data de distribuição
            </h3>

            <p className="text-base text-[#3D3D3D]">
              {format(new Date(process?.distribution_date), "dd/MM/yyyy", {
                locale: ptBR,
              })}
            </p>
          </div>
        )}

        {process?.city && (
          <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
            <h3 className="text-sm text-[#707070] font-bold">Comarca</h3>

            <p className="text-base text-[#3D3D3D]">{process?.city}</p>
          </div>
        )}

        {process?.state && (
          <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
            <h3 className="text-sm text-[#707070] font-bold">Estado</h3>

            <p className="text-base text-[#3D3D3D]">{process?.state}</p>
          </div>
        )}

        <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
          <h3 className="text-sm text-[#707070] font-bold">Status</h3>

          <ProcessBadge variant={process?.status} />
        </div>

        {process?.courts && process?.courts.length > 0 && (
          <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
            <h3 className="text-sm text-[#707070] font-bold">Cortes</h3>

            <div className="flex flex-col gap-1.5">
              {process?.courts.map((court) => (
                <p key={court.name} className="text-base text-[#3D3D3D]">
                  {court.name}
                </p>
              ))}
            </div>
          </div>
        )}

        {process?.classifications && process?.classifications.length > 0 && (
          <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
            <h3 className="text-sm text-[#707070] font-bold">Classificações</h3>

            <div className="flex flex-col gap-1.5 mt-2">
              {process?.classifications.map((classification) => (
                <div key={classification.name} className="flex flex-col  gap-1">
                  {/*   <p className="text-base text-[#3D3D3D]">
                    <strong>Código:</strong> {classification.code}
                  </p> */}

                  <p className="text-base text-[#3D3D3D]">
                    <strong>Nome:</strong> {classification.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {process?.subjects && process?.subjects.length > 0 && (
          <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
            <h3 className="text-sm text-[#707070] font-bold">Assuntos</h3>

            <div className="flex flex-col gap-1.5">
              {process?.subjects.map((subject) => (
                <div key={subject.name} className="flex flex-col  gap-1">
                  {/* <p className="text-base text-[#3D3D3D]">
                    <strong>Código:</strong> {subject.code}
                  </p> */}

                  <p className="text-base text-[#3D3D3D]">
                    <strong>Nome:</strong> {subject.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
