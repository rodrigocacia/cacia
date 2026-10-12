"use client";

import { ReactNode } from "react";

import { formatDocument, formatPhone } from "@/utils/formatters";

interface UserDetailProps {
  document: string;
  email: string;
  phone: string;
  userName: string;
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
      <dd className="min-w-0 font-medium break-words text-tinta">
        {children || <span className="font-normal text-tinta-3">—</span>}
      </dd>
    </div>
  );
}

export function UserDetail({
  document,
  email,
  phone,
  userName,
}: UserDetailProps) {
  return (
    <section className="w-full rounded-[14px] border border-filete bg-white">
      <header className="border-b border-filete px-5 py-4">
        <h2 className="text-[14.5px] font-semibold text-tinta">
          Informações do usuário
        </h2>
      </header>

      <dl className="px-5 py-1">
        <Detalhe rotulo="Nome">{userName}</Detalhe>
        <Detalhe rotulo="CPF / CNPJ">
          {document && (
            <span className="tabular">{formatDocument(document)}</span>
          )}
        </Detalhe>
        <Detalhe rotulo="E-mail">
          {email && (
            <a
              href={`mailto:${email}`}
              className="break-all text-turquesa-profundo underline-offset-2 hover:underline"
            >
              {email}
            </a>
          )}
        </Detalhe>
        <Detalhe rotulo="Telefone">
          {phone && <span className="tabular">{formatPhone(phone)}</span>}
        </Detalhe>
      </dl>
    </section>
  );
}
