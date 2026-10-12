import { CustomTab } from "@/components/ui/custom-tab";
import { tabs } from "../components/tabs";

import { Form } from "./form";

export default async function Password() {
  return (
    <div className="w-full">
      <div className="mb-6 md:hidden">
        <CustomTab tabs={tabs()} />
      </div>

      <Form />
    </div>
  );
}
