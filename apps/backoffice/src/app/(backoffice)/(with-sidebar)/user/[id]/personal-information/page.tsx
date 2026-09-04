import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { getUserById } from "@/http/user/get-user-by-id";

import { CustomTab } from "@/components/ui/custom-tab";
import { UserDetail } from "./detail";
import { tabs } from "../components/tabs";
import { Form } from "../../new/steps";
import Link from "next/link";
import { Button } from "@/components/ui/custom-button";
import { CustomAvatar } from "@/components/ui/custom-avatar";
import { FaEdit } from "react-icons/fa";
import { formatName } from "@/utils/formatters";
import { DialogDeleteUser } from "../components/dialog-delete-user";

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
    <>
      <div className="h-full">
        <div className="h-full max-md:hidden">
          <UserDetail
            document={data?.document ?? ""}
            email={data?.email ?? ""}
            phone={data?.phone ?? ""}
            userName={formatName(data?.name ?? "")}
          />
        </div>

        <main className="w-full h-fit max-lg:h-full pb-6 max-lg:pb-0  grid grid-cols-[2fr_3fr] max-lg:flex max-lg max-lg:flex-col max-lg:justify-between md:hidden">
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
                    Usuário desde {formattedCreatedAtDate}
                  </h3>
                </div>

                <div className="flex gap-3">
                  <Link
                    href={`/user/${userId}/personal-information?editId=${userId}`}
                  >
                    <Button
                      className="cursor-pointer"
                      variant="outline"
                      iconLeft={<FaEdit size={16} className="text-[#348C98]" />}
                    >
                      Editar
                    </Button>
                  </Link>

                  <DialogDeleteUser
                    userId={userId}
                    userName={formatName(data?.name ?? "")}
                  />
                </div>
              </div>

              <CustomTab tabs={tabs(userId)} />

              <UserDetail
                document={data?.document ?? ""}
                email={data?.email ?? ""}
                phone={data?.phone ?? ""}
                userName={formatName(data?.name ?? "")}
              />
            </div>
          </div>
        </main>
      </div>

      <Form />
    </>
  );
}
