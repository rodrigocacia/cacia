import { getUserById } from "@/http/user/get-user-by-id";

import { CustomTab } from "@/components/ui/custom-tab";
import { nomeParaExibir } from "@/utils/formatters";

import { UserDetail } from "./detail";
import { tabs } from "../components/tabs";
import { Form } from "../../new/steps";

export default async function ProccessDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: userId } = await params;

  const { data } = await getUserById({ id: userId });

  return (
    <>
      <div className="mb-6 md:hidden">
        <CustomTab tabs={tabs(userId)} />
      </div>

      <UserDetail
        document={data?.document ?? ""}
        email={data?.email ?? ""}
        phone={data?.phone ?? ""}
        userName={nomeParaExibir(data?.name ?? "")}
      />

      <Form />
    </>
  );
}
