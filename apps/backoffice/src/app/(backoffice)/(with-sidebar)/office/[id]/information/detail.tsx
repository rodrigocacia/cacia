"use client";

import { ReactNode } from "react";
import { MapPin } from "lucide-react";

import type { Address } from "@/types/address";
import { formatPhone, nomeParaExibir } from "@/utils/formatters";

interface OfficeDetailProps {
  name: string;
  remotejid: string;
  legal_name: string;
  description: string;
  address: Address[];
}

/** Linha da lista de detalhes: rótulo à esquerda, valor à direita. */
function Detalhe({
  rotulo,
  children,
}: {
  rotulo: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-x-6 gap-y-1 border-b border-[#F1EEE8] py-3 text-[13.5px] last:border-b-0 sm:grid-cols-[150px_minmax(0,1fr)]">
      <dt className="text-tinta-3">{rotulo}</dt>
      <dd className="min-w-0 font-medium break-words whitespace-pre-line text-tinta">
        {children || <span className="font-normal text-tinta-3">—</span>}
      </dd>
    </div>
  );
}

export function OfficeDetail({
  name,
  remotejid,
  legal_name,
  description,
  address,
}: OfficeDetailProps) {
  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-[14px] border border-filete bg-white">
        <header className="border-b border-filete px-5 py-4">
          <h2 className="text-[14.5px] font-semibold text-tinta">
            Informações
          </h2>
        </header>

        <dl className="px-5 py-1">
          <Detalhe rotulo="Nome">{nomeParaExibir(name)}</Detalhe>
          <Detalhe rotulo="Telefone">
            {remotejid && (
              <span className="tabular">{formatPhone(remotejid)}</span>
            )}
          </Detalhe>
          <Detalhe rotulo="Nome legal">{legal_name}</Detalhe>
          <Detalhe rotulo="Biografia">
            {description && (
              <span className="font-normal text-tinta-2">{description}</span>
            )}
          </Detalhe>
        </dl>
      </section>

      <section className="rounded-[14px] border border-filete bg-white">
        <header className="flex items-baseline gap-2.5 border-b border-filete px-5 py-4">
          <h2 className="text-[14.5px] font-semibold text-tinta">Endereços</h2>
          <span className="tabular font-mono text-xs text-tinta-3">
            {address.length}
          </span>
        </header>

        {address.length === 0 ? (
          <p className="px-5 py-6 text-[13.5px] text-tinta-3">
            Nenhum endereço cadastrado.
          </p>
        ) : (
          <ul className="grid md:grid-cols-2">
            {address.map((address, index) => (
              <li
                key={index}
                className="flex items-start gap-3 border-b border-[#F1EEE8] px-5 py-4 last:border-b-0 md:odd:border-r md:[&:nth-last-child(2):nth-child(odd)]:border-b-0"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-papel-2 text-tinta-3">
                  <MapPin size={15} strokeWidth={1.7} aria-hidden />
                </span>

                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="rotulo">Endereço {index + 1}</span>
                  <p className="text-[13.5px] font-medium text-tinta">
                    {address.street}, {address.number}
                  </p>
                  <p className="text-[13px] text-tinta-2">
                    {address.neighborhood}, {address.city} - {address.state}
                  </p>
                  <p className="tabular text-[13px] text-tinta-3">
                    {address.cep}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
