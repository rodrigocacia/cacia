import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { getOfficeById } from "@/http/office/get-office-by-id";

import { CustomTab } from "@/components/ui/custom-tab";

import { OfficeDetail } from "./detail";
import { tabs } from "../components/tabs";
import { CustomAvatar } from "@/components/ui/custom-avatar";
import { formatName } from "@/utils/formatters";

export default async function ProccessDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: officeId } = await params;

  const { data } = await getOfficeById({ id: officeId });

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
        <OfficeDetail officeId={officeId} />
      </div>

      <main className="w-full bg-red-100 h-fit max-lg:h-full pb-6 max-lg:pb-0  grid grid-cols-[2fr_3fr] max-lg:flex max-lg max-lg:flex-col max-lg:justify-between md:hidden">
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
                  {formatName(data?.name ?? "")}
                </h2>

                <h3 className="text-sm text-[#707070]">
                  Cadastrado desde {formattedCreatedAtDate}
                </h3>
              </div>
            </div>

            <CustomTab tabs={tabs(officeId)} />

            <OfficeDetail officeId={officeId} />
          </div>
        </div>
      </main>
    </div>
  );
}
