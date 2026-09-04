"use client";

import Link from "next/link";

import { useParams, usePathname } from "next/navigation";

import { DialogDeleteUser } from "./components/dialog-delete-user";
import { CustomAvatar } from "@/components/ui/custom-avatar";
import { Button } from "@/components/ui/custom-button";

import { navLinks } from "./navs";
import { FaEdit } from "react-icons/fa";
import { formatName } from "@/utils/formatters";

export function Sidebar({
  name,
  createdAt,
}: {
  name: string;
  createdAt: string;
}) {
  const pathname = usePathname();
  const params = useParams();

  const userId = params.id;

  const isActive = (path: string) => !!pathname.includes(path);

  return (
    <aside className="w-[280px] h-full shadow-md rounded-2xl py-4 px-5 space-y-6 md:space-y-0 max-md:hidden">
      <div className="flex flex-col items-center">
        <CustomAvatar name={name} size="lg" />

        <div className="mt-3 w-full flex flex-col gap-2 items-center justify-center">
          <h3 className="text-xl text-[#707070]">{formatName(name)}</h3>
          <p className="text-sm text-[#707070]">Usuário desde {createdAt}</p>
        </div>
      </div>

      <hr className="my-6 max-md:my-2 h-px border-t-0 bg-gray-200" />

      <ul className="flex flex-col gap-4 max-md:hidden">
        {navLinks(String(userId)).map((link) => (
          <Link key={link.id} href={link.path}>
            <li
              className={
                isActive(String(link.path))
                  ? "w-[full] max-md:w-[150px] list-none flex pl-3 py-2.5 bg-[#ECF7F8] rounded-full cursor-pointer items-center gap-4"
                  : "w-full max-md:w-[150px] list-none flex pl-3 py-2.5 rounded-md cursor-pointer items-center gap-4"
              }
            >
              {link.icon && (
                <span
                  className={
                    isActive(link.path) ? "text-[#348C98]" : "text-[#BDBDBD]"
                  }
                >
                  {link.icon}
                </span>
              )}

              <span className="text-base text-[#3D3D3D]">{link.name}</span>
            </li>
          </Link>
        ))}
      </ul>

      <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200" />

      <div className="flex flex-row gap-1 justify-between w-full">
        <Link href={`/user/${userId}/personal-information?editId=${userId}`}>
          <Button
            className="cursor-pointer"
            variant="outline"
            iconLeft={<FaEdit size={16} className="text-[#348C98]" />}
          >
            Editar
          </Button>
        </Link>

        <DialogDeleteUser userId={String(userId)} userName={name} />
      </div>
    </aside>
  );
}
