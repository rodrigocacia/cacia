"use client"

import Image from "next/image"
import { MdArrowForward } from "react-icons/md"
import { useOnboardingStore } from "@/stores/use-onboard-store"
import { Form } from "./form"

export default function Welcome() {
  const { nextStep } = useOnboardingStore()

  return (
    <div className="w-full min-h-screen">
      <div className="lg:hidden relative w-full min-h-screen flex flex-col items-center bg-[url('/phone-bg.png')] bg-cover justify-between text-white">
        <div className="pt-10 z-10">
          <Image src="/cacia-sidebar.png" alt="logo" width={100} height={30} />
        </div>

        <div className="flex flex-col items-center pt-10">
          <Image
            src="/mockup-onboard.png"
            width={400}
            height={300}
            alt="mockup"
            className="object-cover"
          />

          <div className="text-left px-6">
            <h2 className="text-white text-2xl font-bold leading-snug">
              Bem vindo <br />
              <span className="text-[#348C98]">a bordo!</span>
            </h2>
            <p className="text-[#BDBDBD] mt-2 text-md font-semibold">
              Vou ajuda-lo a me configurar, assim eu já posso começar a falar
              com seus leads e clientes e resolver tarefas para você!
            </p>
          </div>
        </div>

        <button
          onClick={nextStep}
          className="flex items-center mb-10 justify-center gap-2 px-8 py-3 mt-10 rounded-full bg-[#292929]"
        >
          <span className="text-white text-base font-semibold">Iniciar</span>
          <MdArrowForward className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="hidden lg:flex w-full h-screen">
        <main className="grid grid-cols-[2fr_2fr] w-full">
          <div className="relative flex flex-col items-center bg-[url('/bg-login.png')] bg-cover bg-center h-full w-full rounded-l-4xl -mr-6 z-0">
            <div className="w-full flex items-start justify-center">
              <Image
                src="/mockup-pc.png"
                alt="mockup"
                width={549}
                height={556}
              />
            </div>

            <div className="flex flex-col gap-3.5 mb-20 px-18">
              <div className="flex flex-col items-center justify-center gap-2">
                <h3 className="text-2xl text-[#348C98] font-semibold">
                  Preparado para o que
                </h3>
                <h3 className="text-2xl text-[#EFEFEF] font-semibold">
                  vem por ai?
                </h3>
              </div>

              <p className="text-lg text-[#BDBDBD] text-center">
                Em poucos passos, a CacIA fica pronta para atender seus clientes
                no WhatsApp, organizar sua agenda e acompanhar seus processos.
              </p>
            </div>
          </div>

          <Form />
        </main>
      </div>
    </div>
  )
}
