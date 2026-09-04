import { CustomAvatar } from "@/components/ui/custom-avatar";
import { CustomTab } from "@/components/ui/custom-tab";
import { HeaderToGoBack } from "@/components/header-to-go-back";
import { getMe } from "@/http/user/get-me";
import { tabs } from "../components/tabs";

import { Form } from "./form";

export default async function MyData() {
  const userResult = await getMe();
  const user = userResult.success ? userResult.data : null;

  return (
    <div className="h-screen max-md:h-full">
      <div className="max-md:hidden">
        <Form
          name={user?.name || ""}
          document={user?.document || ""}
          phone={user?.phone || ""}
        />
      </div>

      <main className="w-full h-fit max-lg:h-full pb-6 max-lg:pb-0 flex flex-col max-lg:justify-between md:hidden">
        <div className="relative flex flex-1 flex-col px-4 pt-2 pb-10 bg-[#ECF7F8] bg-cover bg-center h-[160px] w-full lg:hidden -mb-6 z-0">
          <div className="md:hidden">
            <HeaderToGoBack link="/profile" bgColor="#ECF7F8" />
          </div>
        </div>

        <div className="bg-white relative z-10 w-full max-lg:h-fit flex flex-col rounded-t-4xl px-4 py-10 max-lg:pb-0">
          <div className="w-full max-h-[360px]">
            <div className="flex flex-col items-center gap-[17px] relative -top-14">
              <CustomAvatar
                name={user?.name ?? ""}
                size="lg"
                className="w-[86px] h-[86px] rounded-full object-cover"
              />

              <div className="flex flex-col items-center gap-2">
                <h2 className="text-[18px] text-[#3D3D3D] font-semibold">
                  {user?.name}
                </h2>
                <h3 className="text-sm text-[#707070]">{user?.email}</h3>
              </div>
            </div>

            <CustomTab tabs={tabs()} />

            <div className="mt-6">
              <Form
                name={user?.name || ""}
                document={user?.document || ""}
                phone={user?.phone || ""}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
