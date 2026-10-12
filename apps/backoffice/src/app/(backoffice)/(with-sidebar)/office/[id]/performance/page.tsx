import { CustomTab } from "@/components/ui/custom-tab";

import { OfficeDetail } from "./detail";
import { tabs } from "../components/tabs";

export default async function ProccessDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: officeId } = await params;

  return (
    <div className="w-full">
      <div className="mb-6 md:hidden">
        <CustomTab tabs={tabs(officeId)} />
      </div>

      <OfficeDetail officeId={officeId} />
    </div>
  );
}
