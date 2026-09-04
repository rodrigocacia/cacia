import { PropsWithChildren } from "react";

import { Header } from "@/components/header";
import { Sidebar } from "./sidebar";
import { getMe } from "@/http/user/get-me";

export default async function ProfileLayout({ children }: PropsWithChildren) {
  const userResult = await getMe();
  const user = userResult.success ? userResult.data : null;

  return (
    <div className="w-full h-fit flex flex-col">
      <div className="max-md:hidden">
        <Header title="Minha conta" />
      </div>

      <div className="w-full grid grid-cols-[322px_1fr] max-md:grid-cols-1 mt-8 max-md:mt-0">
        <Sidebar name={user?.name || ""} email={user?.email || ""} />

        <main className="px-4 pb-12 max-md:px-0 lg:col-start-2 max-md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
