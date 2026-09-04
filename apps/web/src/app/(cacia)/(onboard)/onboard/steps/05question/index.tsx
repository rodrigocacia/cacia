"use client"

import Image from "next/image"

import { FormQuestion } from "./form"
import { DialogDeleteQuestion } from "@/app/(cacia)/(with-sidebar)/setting/(custom-sidebar)/question/components/dialog-delete-question"

export function Question() {
  return (
    <div className="w-full h-screen px-8 py-10 max-lg:px-0 max-lg:py-0">
      <main className="w-full h-fit max-lg:h-full pb-6 max-lg:pb-0  grid grid-cols-[2fr_1fr] max-lg:flex max-lg max-lg:flex-col max-lg:justify-between">
        <div className="relative flex flex-1 flex-col px-4 pt-10 pb-10 justify-end gap-3.5 bg-[url('/bg-login.png')] bg-cover bg-center h-[260px] w-full lg:hidden -mb-6 z-0">
          <h3 className="text-2xl text-white font-semibold">
            Dúvidas frequentes
          </h3>

          <p className="text-[18px] text-white">
            Cadastre as perguntas comuns.
          </p>
        </div>

        <FormQuestion />

        <div className="relative flex flex-col items-center bg-[url('/bg-login.png')] bg-cover bg-center h-full w-full rounded-r-4xl max-lg:hidden -ml-6 z-0">
          <div className="w-full flex items-start justify-center">
            <Image src="/mockup-pc.png" alt="mockup" width={420} height={425} />
          </div>

          <div className="flex flex-col gap-3.5 mb-20 px-18">
            <div className="flex flex-col items-center justify-center gap-2">
              <h3 className="text-2xl text-[#348C98] font-semibold">
                Dúvidas frequentes
              </h3>
            </div>

            <p className="text-lg text-[#BDBDBD] text-center">
              Cadastre as perguntas comuns.
            </p>
          </div>
        </div>
      </main>

      <DialogDeleteQuestion />
    </div>
  )
}
