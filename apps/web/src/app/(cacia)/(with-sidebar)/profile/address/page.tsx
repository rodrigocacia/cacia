/* eslint-disable @typescript-eslint/no-explicit-any */

import { getCurrentUser } from "@/auth/auth"

import { CustomAvatar } from "@/components/ui/custom-avatar"
import { CustomTab } from "@/components/ui/custom-tab"
import { HeaderToGoBack } from "@/components/header-to-go-back"

import { Form } from "./form"
import { getOfficeById } from "@/http/office/get-office-by-id"
import { tabs } from "../components/tabs"

export default async function Address() {
  const user: any = await getCurrentUser()

  const office = await getOfficeById()

  return (
    <div className="h-screen max-md:h-full">
      <div className="max-md:hidden">
        <Form address={office?.address[0]} />
      </div>

      <main className="w-full h-fit max-lg:h-full pb-6 max-lg:pb-0 flex flex-col max-lg:justify-between md:hidden">
        <div className="relative flex flex-1 flex-col px-4 pt-2 pb-10 bg-[#ECF7F8] bg-cover bg-center h-[160px] w-full lg:hidden -mb-6 z-0">
          <div className="md:hidden">
            <HeaderToGoBack link="/dashboard" bgColor="#ECF7F8" />
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
              <Form address={office?.address[0]} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
