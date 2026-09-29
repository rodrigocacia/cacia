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
  SidebarHeader,
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
    title: "Conversas",
    url: "/chat",
    icon: (props: any) => <Icon icon="mdi:forum-outline" {...props} />,
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
    icon: (props: any) => <Icon icon="mdi:file-document-outline" {...props} />,
  },
  {
    title: "Eventos",
    url: "/event",
    icon: (props: any) => <Icon icon="mdi:calendar-month-outline" {...props} />,
  },
]

const secondaryLinkClass =
  "flex items-center gap-3 h-10 px-3 rounded-xl text-sm text-[#A3A3A3] transition-colors hover:bg-white/[0.06] hover:text-white"

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
  const isSettingActive = currentSegment === "setting"

  return (
    <Sidebar className="border-none [&_[data-slot=sidebar-inner]]:bg-[#24211E]">
      <SidebarHeader className="h-20 shrink-0 justify-center border-b border-white/[0.07] px-5">
        <Image src="/cacia-sidebar.png" alt="CacIA" width={104} height={30} />
      </SidebarHeader>

      <SidebarContent className="px-3 py-5">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                const itemSegment = item.url.split("/")[1]
                const isActive = currentSegment === itemSegment

                const IconComponent = item.icon

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      className={`relative h-10 gap-3 rounded-xl px-3 text-sm transition-colors [&>svg]:size-[18px] ${
                        isActive
                          ? "bg-white/[0.08] font-semibold text-white hover:bg-white/[0.08] hover:text-white active:bg-white/[0.08] active:text-white data-[active=true]:bg-white/[0.08] data-[active=true]:text-white before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-[#348C98]"
                          : "font-medium text-[#A3A3A3] hover:bg-white/[0.06] hover:text-white active:bg-white/[0.06] active:text-white"
                      }`}
                      asChild
                    >
                      <Link href={item.url}>
                        <IconComponent
                          className={
                            isActive ? "text-[#4FB3C0]" : "text-[#7A7A7A]"
                          }
                        />

                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-1 border-t border-white/[0.07] px-3 py-3">
        <Link
          href="/setting/ia-service"
          className={
            isSettingActive
              ? "flex h-10 items-center gap-3 rounded-xl bg-white/[0.08] px-3 text-sm font-semibold text-white"
              : secondaryLinkClass
          }
        >
          <Icon
            icon="mdi:gear-outline"
            className={`h-[18px] w-[18px] shrink-0 ${
              isSettingActive ? "text-[#4FB3C0]" : "text-[#7A7A7A]"
            }`}
          />

          <span>Configurações</span>
        </Link>

        <Link href="/support" className={secondaryLinkClass}>
          <Icon
            icon="mdi:help-circle-outline"
            className="h-[18px] w-[18px] shrink-0 text-[#7A7A7A]"
          />

          <span>Precisa de ajuda?</span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="flex h-10 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm text-[#A3A3A3] transition-colors hover:bg-[#DC2626]/10 hover:text-[#F87171]"
        >
          <Icon
            icon="mdi:logout"
            className="h-[18px] w-[18px] shrink-0 text-[#DC2626]"
          />

          <span>Sair</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  )
}
