import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { getUserById } from "@/http/user/get-user-by-id";
import { CustomTab } from "@/components/ui/custom-tab";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { nomeParaExibir } from "@/utils/formatters";

import { tabs } from "../components/tabs";

interface Address {
  city: string;
  number: string;
  state: string;
  neighborhood: string;
  street: string;
  cep: string;
  complement?: string;
}

interface Office {
  _id: string;
  name: string;
  /**
   * A API chama de `addresses`, no plural, e pode vir vazio: escritório sem
   * endereço cadastrado é situação normal, não erro.
   */
  addresses?: Address[];
}

function enderecoDe(office: Office): string | null {
  const endereco = office.addresses?.[0];

  if (!endereco) return null;

  return `${endereco.street}, ${endereco.number}${
    endereco.complement ? ` - ${endereco.complement}` : ""
  }`;
}

function Inicial({ nome }: { nome: string }) {
  return (
    <span
      aria-hidden
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-nevoa text-[13px] font-semibold text-turquesa-profundo"
    >
      {nome.trim()[0]?.toUpperCase() ?? "?"}
    </span>
  );
}

export default async function ProccessDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: userId } = await params;
  const { data } = await getUserById({ id: userId });

  const offices: Office[] = data?.offices ?? [];

  return (
    <div className="w-full">
      <div className="mb-6 md:hidden">
        <CustomTab tabs={tabs(userId)} />
      </div>

      <section className="w-full overflow-hidden rounded-[14px] border border-filete bg-white">
        <header className="flex items-baseline gap-2.5 border-b border-filete px-5 py-4">
          <h2 className="text-[14.5px] font-semibold text-tinta">
            Escritórios
          </h2>
          <span className="tabular font-mono text-xs text-tinta-3">
            {offices.length}
          </span>
        </header>

        {offices.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13.5px] text-tinta-3">
            Nenhum escritório cadastrado.
          </p>
        ) : (
          <>
            {/* Tabela a partir do tablet */}
            <div className="max-md:hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offices.map((office, idx) => (
                    <TableRow key={office._id ?? idx}>
                      <TableCell>
                        <Link
                          href={`/office/${office._id}/information`}
                          className="flex items-center gap-3 font-medium text-tinta hover:text-turquesa-profundo"
                        >
                          <Inicial nome={office.name} />
                          {nomeParaExibir(office.name)}
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        {enderecoDe(office) ?? "—"}
                      </TableCell>
                      <TableCell>
                        {office.addresses?.[0]?.city ?? "—"}
                      </TableCell>
                      <TableCell>
                        {office.addresses?.[0]?.state ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Lista no celular */}
            <ul className="md:hidden">
              {offices.map((office, idx) => {
                const endereco = enderecoDe(office);
                const cidade = office.addresses?.[0]
                  ? `${office.addresses[0].city} - ${office.addresses[0].state}`
                  : null;

                return (
                  <li
                    key={office._id ?? idx}
                    className="border-b border-[#F1EEE8] last:border-b-0"
                  >
                    <Link
                      href={`/office/${office._id}/information`}
                      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-papel"
                    >
                      <Inicial nome={office.name} />

                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-[13.5px] font-medium text-tinta">
                          {nomeParaExibir(office.name)}
                        </span>
                        <span className="truncate text-[12.5px] text-tinta-3">
                          {[endereco, cidade].filter(Boolean).join(" · ") ||
                            "Sem endereço cadastrado"}
                        </span>
                      </div>

                      <ChevronRight
                        size={16}
                        strokeWidth={1.7}
                        aria-hidden
                        className="shrink-0 text-tinta-3"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
