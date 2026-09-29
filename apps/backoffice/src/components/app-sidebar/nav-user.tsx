"use client";

import { LogOut } from "lucide-react";

import { sairAction } from "@/auth/sair";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg">
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{user.name}</span>
            <span className="truncate text-xs">{user.email}</span>
          </div>

          <form action={sairAction} className="ml-auto">
            <button type="submit" aria-label="Sair" className="cursor-pointer">
              <LogOut className="size-4" />
            </button>
          </form>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
