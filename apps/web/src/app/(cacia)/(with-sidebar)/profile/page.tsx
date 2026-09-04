import { Header } from "@/components/header"
import { SidebarResponsive } from "./sidebar-responsive"
import { CustomAvatar } from "@/components/ui/custom-avatar"
import { me } from "@/http/user/me"

export default async function Profile() {
  const user = await me()

  return (
    <div className="w-full h-full">
      <main className="w-full h-fit max-lg:h-full pb-6 max-lg:pb-0  grid grid-cols-[2fr_3fr] max-lg:flex max-lg max-lg:flex-col max-lg:justify-between md:hidden">
        <div className="relative flex flex-1 flex-col px-4 pt-2 pb-18 bg-[#ECF7F8] bg-cover bg-center h-[160px] w-full lg:hidden -mb-6 z-0">
          <Header title="Minha conta" />

          <div className="w-full flex flex-col items-center">
            <CustomAvatar
              name={user?.name ?? ""}
              className="w-[100px] h-[100px] rounded-full object-cover"
            />

            <div className="mt-3 w-full flex flex-col gap-2 items-center justify-center">
              <h3 className="text-xl text-[#707070]">{user?.name ?? ""}</h3>
              <p className="text-sm text-[#707070]">{user?.email ?? ""}</p>
            </div>
          </div>
        </div>

        <SidebarResponsive />
      </main>
    </div>
  )
}
