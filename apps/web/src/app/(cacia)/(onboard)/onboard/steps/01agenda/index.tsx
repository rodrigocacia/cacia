"use client"

import { useEffect } from "react"

import Image from "next/image"

import { Form } from "./form"

export function Agenda() {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }, [])

  return (
    <div className="w-full h-screen px-8 py-10 max-lg:px-0 max-lg:py-0">
      <main className="w-full h-fit max-lg:h-full pb-8 grid grid-cols-[2fr_1fr] max-lg:flex max-lg max-lg:flex-col max-lg:justify-between">
        <div className="relative flex flex-1 flex-col px-4 pt-10 pb-10 justify-end gap-3.5 bg-[url('/bg-login.png')] bg-cover bg-center h-[260px] w-full lg:hidden -mb-6 z-0">
          <h3 className="text-2xl text-white font-semibold">
            Configure sua agenda
          </h3>

          <p className="text-[18px] text-white">
            Defina disponibilidade e regras gerais.
          </p>
        </div>

        <Form />

        <div className="relative flex flex-col items-center bg-[url('/bg-login.png')] bg-cover bg-center h-full w-full rounded-r-4xl max-lg:hidden -ml-6 z-0">
          <div className="w-full flex items-start justify-center">
            <Image src="/mockup-pc.png" alt="mockup" width={420} height={425} />
          </div>

          <div className="flex flex-col gap-3.5 mb-20 px-18">
            <div className="flex flex-col items-center justify-center gap-2">
              <h3 className="text-2xl text-[#348C98] font-semibold">
                Configure sua agenda
              </h3>
            </div>

            <p className="text-lg text-[#BDBDBD] text-center">
              Defina disponibilidade e regras gerais.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
