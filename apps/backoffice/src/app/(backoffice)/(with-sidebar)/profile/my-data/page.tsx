import { CustomTab } from "@/components/ui/custom-tab";
import { getMe } from "@/http/user/get-me";
import { tabs } from "../components/tabs";

import { Form } from "./form";

export default async function MyData() {
  const userResult = await getMe();
  const user = userResult.success ? userResult.data : null;

  return (
    <div className="w-full">
      <div className="mb-6 md:hidden">
        <CustomTab tabs={tabs()} />
      </div>

      <Form
        name={user?.name || ""}
        document={user?.document || ""}
        phone={user?.phone || ""}
      />
    </div>
  );
}
