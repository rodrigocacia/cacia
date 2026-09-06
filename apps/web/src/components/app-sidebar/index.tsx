/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import Image from "next/image"
import Link from "next/link"

import { usePathname, useRouter } from "next/navigation"

import { Icon } from "@/components/icone"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: (props: any) => <Icon icon="mdi:chart-box-outline" {...props} />,
  },
  {
    title: "Leads",
    url: "/lead",
    icon: (props: any) => <Icon icon="mdi:leads-outline" {...props} />,
  },
  {
    title: "Clientes",
    url: "/customer",
    icon: (props: any) => <Icon icon="mdi:account-group-outline" {...props} />,
  },
  {
    title: "Processos",
    url: "/process",
    icon: (props: any) => <Icon icon="mdi:folder-text-outline" {...props} />,
  },
  {
    title: "Documentos",
    url: "/document",
    icon: (props: any) => <Icon icon="mdi:file-document" {...props} />,
  },
  {
    title: "Eventos",
    url: "/event",
    icon: (props: any) => <Icon icon="mdi:calendar-month-outline" {...props} />,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "GET",
    })

    router.push("/signin")
  }

  const currentSegment = pathname.split("/")[1]

  return (
    <Sidebar className="p-4">
      <SidebarContent className="bg-[#24211E] rounded-tl-3xl rounded-tr-3xl max-md:rounded-none">
        <SidebarGroup>
          <SidebarGroupLabel className="mt-6 text-2xl font-bold text-blue-500">
            <Image
              src="/cacia-sidebar.png"
              alt="mockup"
              width={110}
              height={32}
            />
          </SidebarGroupLabel>

          <SidebarGroupContent className="mt-8">
            <SidebarMenu>
              {items.map((item) => {
                const itemSegment = item.url.split("/")[1]
                const isActive = currentSegment === itemSegment

                const IconComponent = item.icon

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      size="lg"
                      className={`flex items-center gap-3 rounded-full px-3 py-3 hover:bg-[#3D3D3D] data-[state=active]:bg-transparent active:bg-transparent ${
                        isActive ? "bg-[#3D3D3D]" : ""
                      }`}
                      asChild
                    >
                      <Link className="" href={item.url}>
                        <IconComponent
                          className={`${
                            isActive ? "text-[#348C98]" : "text-[#707070]"
                          }`}
                        />

                        <span
                          className={`${
                            isActive ? "font-bold" : ""
                          } text-[#EFEFEF]`}
                        >
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-[#24211E] rounded-bl-3xl rounded-br-3xl max-md:rounded-none">
        <div className="w-full flex flex-col gap-2 pb-8 px-2.5">
          <Link
            href="/setting/ia-service"
            className={`flex items-center gap-3 rounded-full py-[7px] data-[state=active]:bg-transparent active:bg-transparent ${
              currentSegment === "setting"
                ? "bg-[#3D3D3D] px-3 -ml-2 hover:bg-[#3D3D3D]"
                : ""
            }`}
          >
            <Icon
              icon="mdi:gear-outline"
              className={`${
                currentSegment === "setting"
                  ? "text-[#348C98]"
                  : "text-[#707070]"
              } w-[22px] h-[22px]`}
            />

            <span
              className={`${
                currentSegment === "setting" ? "font-bold" : ""
              } text-[#BDBDBD] text-sm`}
            >
              Configurações
            </span>
          </Link>

          <Link
            href="/support"
            className="w-full py-[7px]  flex items-center justify-start gap-2 cursor-pointer"
          >
            <Icon
              icon="mdi:help-circle-outline"
              className="text-[#707070] w-[22px] h-[22px]"
            />

            <span className="text-[#BDBDBD] text-sm">Precisa de ajuda?</span>
          </Link>

          <div
            onClick={handleLogout}
            className="w-full py-[7px] flex items-center justify-start gap-2 cursor-pointer"
          >
            <Icon
              icon="mdi:logout"
              className="text-[#DC2626] w-[22px] h-[22px]"
            />

            <span className="text-[#BDBDBD] text-sm">Sair</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
