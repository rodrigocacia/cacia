import { getOfficeById } from "@/http/office/get-office-by-id";

import { CustomTab } from "@/components/ui/custom-tab";

import { OfficeDetail } from "./detail";
import { tabs } from "../components/tabs";
import { Form } from "../../new/steps";

export default async function ProccessDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: officeId } = await params;

  const { data } = await getOfficeById({ id: officeId });

  return (
    <>
      <div className="mb-6 md:hidden">
        <CustomTab tabs={tabs(officeId)} />
      </div>

      <OfficeDetail
        name={data?.name ?? ""}
        remotejid={data?.remotejid ?? ""}
        legal_name={data?.legal_name ?? ""}
        description={data?.description ?? ""}
        address={data?.addresses ?? []}
      />

      <Form />
    </>
  );
}
