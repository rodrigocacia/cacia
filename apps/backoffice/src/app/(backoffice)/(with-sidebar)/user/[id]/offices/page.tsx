import { Icon } from "@iconify/react/dist/iconify.js";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

import { getUserById } from "@/http/user/get-user-by-id";
import { CustomTab } from "@/components/ui/custom-tab";
import { tabs } from "../components/tabs";
import { CustomAvatar } from "@/components/ui/custom-avatar";
import { formatName } from "@/utils/formatters";

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
  address: Address[];
}

export default async function ProccessDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: userId } = await params;
  const { data } = await getUserById({ id: userId });

  let formattedCreatedAtDate = null;
  if (data) {
    if (data?.created_at !== null) {
      formattedCreatedAtDate = format(
        new Date(data?.created_at),
        "MMMM, yyyy",
        {
          locale: ptBR,
        },
      );
    }
  }

  return (
    <div className="w-full h-full">
      <div className="h-full max-md:hidden">
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon
                icon="mdi:office-building-outline"
                className="w-6 h-6 text-[#348C98]"
              />
              <h2 className="text-2xl font-semibold text-[#3D3D3D]">
                Escritórios
              </h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8FAFB] text-[#707070] text-sm">
                  <th className="px-4 py-3 text-left font-semibold rounded-l-xl">
                    <div className="flex items-center gap-1">
                      Nome
                      <Icon
                        icon="mdi:arrow-up-down"
                        className="w-4 h-4 text-[#BDBDBD]"
                      />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Endereço
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Cidade</th>
                  <th className="px-4 py-3 text-left font-semibold rounded-r-xl">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.offices?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-[#BDBDBD] py-6">
                      Nenhum escritório cadastrado
                    </td>
                  </tr>
                )}
                {data?.offices?.map((office: Office, idx) => (
                  <tr
                    key={idx}
                    className={`transition-all ${idx !== data.offices.length - 1 ? "border-b border-[#F1F1F1]" : ""}`}
                  >
                    <td className="px-4 py-3 text-[#3D3D3D] bg-[#F9FBFC] rounded-l-xl">
                      <div className="flex items-center gap-2">
                        <Icon
                          icon="mdi:office-building"
                          className="w-5 h-5 text-[#BDBDBD]"
                        />
                        <Link
                          href={`/office/${office._id}/information`}
                          className="hover:text-[#348C98] transition-colors"
                        >
                          {formatName(office.name)}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#348C98] bg-[#F9FBFC]">
                      {office.address[0]?.street}, {office.address[0]?.number}
                      {office.address[0]?.complement &&
                        ` - ${office.address[0].complement}`}
                    </td>
                    <td className="px-4 py-3 text-[#348C98] bg-[#F9FBFC]">
                      {office.address[0]?.city}
                    </td>
                    <td className="px-4 py-3 text-[#348C98] bg-[#F9FBFC] rounded-r-xl">
                      {office.address[0]?.state}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <main className="w-full bg-red-100 h-fit max-lg:h-full pb-6 max-lg:pb-0 grid grid-cols-[2fr_3fr] max-lg:flex max-lg:flex-col max-lg:justify-between md:hidden">
        <div className="relative flex flex-1 flex-col px-4 pt-2 pb-10 bg-[#ECF7F8] bg-cover bg-center h-[160px] w-full lg:hidden -mb-6 z-0"></div>
        <div className="bg-white relative z-10 w-full max-lg:h-fit flex flex-col rounded-t-4xl px-4 py-10 max-lg:pb-0">
          <div className="w-full max-h-[360px]">
            <div className="flex flex-col items-center gap-[17px] relative -top-14">
              <CustomAvatar
                name={data?.name ?? ""}
                size="lg"
                className="w-[86px] h-[86px] rounded-full object-cover"
              />
              <div className="flex flex-col items-center gap-2">
                <h2 className="text-[18px] text-[#3D3D3D] font-semibold">
                  {data?.name}
                </h2>
                <h3 className="text-sm text-[#707070]">
                  Usuário desde {formattedCreatedAtDate}
                </h3>
              </div>
            </div>
            <CustomTab tabs={tabs(userId)} />
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-2">
                <Icon
                  icon="mdi:office-building-outline"
                  className="w-5 h-5 text-[#348C98]"
                />
                <h2 className="text-xl font-semibold text-[#3D3D3D]">
                  Escritórios
                </h2>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-2">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F8FAFB] text-[#707070] text-xs">
                      <th className="px-2 py-2 text-left font-semibold rounded-l-xl">
                        <div className="flex items-center gap-1">
                          Nome
                          <Icon
                            icon="mdi:arrow-up-down"
                            className="w-4 h-4 text-[#BDBDBD]"
                          />
                        </div>
                      </th>
                      <th className="px-2 py-2 text-left font-semibold">
                        Endereço
                      </th>
                      <th className="px-2 py-2 text-left font-semibold">
                        Cidade
                      </th>
                      <th className="px-2 py-2 text-left font-semibold rounded-r-xl">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.offices?.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center text-[#BDBDBD] py-4"
                        >
                          Nenhum escritório cadastrado
                        </td>
                      </tr>
                    )}
                    {data?.offices?.map((office: Office, idx) => (
                      <tr
                        key={idx}
                        className={`transition-all ${idx !== data.offices.length - 1 ? "border-b border-[#F1F1F1]" : ""}`}
                      >
                        <td className="px-2 py-2 text-[#3D3D3D] bg-[#F9FBFC] rounded-l-xl">
                          <div className="flex items-center gap-2">
                            <Icon
                              icon="mdi:office-building"
                              className="w-4 h-4 text-[#BDBDBD]"
                            />
                            <Link
                              href={`/office/${office._id}/information`}
                              className="hover:text-[#348C98] transition-colors"
                            >
                              {formatName(office.name)}
                            </Link>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-[#348C98] bg-[#F9FBFC]">
                          {office.address[0]?.street},{" "}
                          {office.address[0]?.number}
                          {office.address[0]?.complement &&
                            ` - ${office.address[0].complement}`}
                        </td>
                        <td className="px-2 py-2 text-[#348C98] bg-[#F9FBFC]">
                          {office.address[0]?.city}
                        </td>
                        <td className="px-2 py-2 text-[#348C98] bg-[#F9FBFC] rounded-r-xl">
                          {office.address[0]?.state}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
