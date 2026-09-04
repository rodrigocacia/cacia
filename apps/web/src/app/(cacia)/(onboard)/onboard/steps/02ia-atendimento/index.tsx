"use client"

import { useEffect } from "react"

import Image from "next/image"

import { Form } from "./form"

export function IAAtendimento() {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }, [])

  return (
    <div className="w-full h-screen px-8 py-10 max-lg:px-0 max-lg:py-0">
      <main className="w-full h-fit max-lg:h-full pb-6 max-lg:pb-0 grid grid-cols-[1fr_2fr] max-lg:flex max-lg max-lg:flex-col max-lg:justify-between">
        <div className="relative flex flex-1 flex-col px-4 pt-10 pb-10 justify-end gap-3.5 bg-[url('/bg-login.png')] bg-cover bg-center h-[260px] w-full lg:hidden -mb-6 z-0">
          <h3 className="text-2xl text-white font-semibold">
            Defina o tom para seus clientes
          </h3>

          <p className="text-[18px] text-white">
            Escolha o estilo e a saudação.
          </p>
        </div>

        <div className="relative flex flex-col items-center bg-[url('/bg-login.png')] bg-cover bg-center h-full w-full rounded-l-4xl max-lg:hidden -mr-6 z-0">
          <div className="w-full flex items-start justify-center">
            <Image src="/mockup-pc.png" alt="mockup" width={549} height={556} />
          </div>

          <div className="flex flex-col gap-3.5 mb-20 px-18">
            <div className="flex flex-col items-center justify-center gap-2">
              <h3 className="text-2xl text-[#348C98] font-semibold">
                Defina o tom para
              </h3>

              <h3 className="text-2xl text-[#EFEFEF] font-semibold">
                seus clientes
              </h3>
            </div>

            <p className="text-lg text-[#BDBDBD] text-center">
              Escolha o estilo e a saudação.
            </p>
          </div>
        </div>

        <Form />
      </main>
    </div>
  )
}
