/* eslint-disable @typescript-eslint/no-explicit-any */
import { Icon } from "@iconify/react/dist/iconify.js";
import { Bell } from "lucide-react";

import { SidebarTrigger } from "../ui/sidebar";
import { CustomAvatar } from "../ui/custom-avatar";
import { getCurrentUser } from "@/auth/auth";
import Link from "next/link";

interface HeaderProps {
  title?: string;
  name?: string;
}

export async function Header({ title, name }: HeaderProps) {
  const user: any = await getCurrentUser();

  return (
    <div className="h-[80px] rounded-4xl shadow-md w-full min-h-12 px-4 max-md:px-0 max-md:rounded-none max-md:shadow-none max-md:bg-transparent bg-white flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="w-[56px] h-[56px] flex items-center justify-center rounded-[14px] bg-white shadow-md lg:hidden">
          <SidebarTrigger />
        </div>

        <div className="flex items-center gap-4">
          <h1 className="text-2xl max-md:text-xl font-bold text-[#3D3D3D]">
            {title ?? ""}
          </h1>

          {name ? (
            <div className="flex items-center pl-4 border-l-2 py-1.5 border-[#F6F6F9]">
              <p className="text-xl text-[#707070] font-bold">{name}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex gap-6 items-center">
        <div className="w-[38px] h-[38px] flex items-center justify-center rounded-2xl bg-white shadow-md">
          <Bell size={18} />
        </div>

        <Link href="/profile/my-data" className="flex items-center gap-4">
          <CustomAvatar name={user?.name} size="md" />

          <div className="flex max-md:hidden">
            <div className="flex flex-col gap-2">
              <h3 className="text-base text-[#707070] font-semibold">
                {user?.name}
              </h3>

              <p className="text-sm text-[#707070]">{user?.email}</p>
            </div>

            <div className="h-full flex items-start justify-start">
              <Icon
                icon="mdi:arrow-down-drop"
                className="w-6 h-6 text-[#BDBDBD]"
              />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
