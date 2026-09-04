"use client"

import Image from "next/image"
import { MdArrowForward } from "react-icons/md"

import { useOnboardingStore } from "@/stores/use-onboard-store"

export function Form() {
  const { nextStep } = useOnboardingStore()

  return (
    <form className="bg-white relative z-10 w-full h-full max-lg:h-fit flex flex-col justify-center gap-8 shadow-md rounded-r-4xl px-8 pt-[28px] max-lg:pb-4">
      <div className="w-full max-lg:hidden">
        <Image src="/logo-cacia.png" alt="mockup" width={200} height={61} />
      </div>

      <div className="w-full flex flex-col gap-3.5">
        <h2 className="text-2xl text-[#3D3D3D] font-semibold">
          Bem vindo a bordo!
        </h2>

        <p className="text-lg text-[#BDBDBD]">
          Vou ajuda-lo a me configurar, assim eu já posso começar a falar com
          seus leads e clientes e resolver tarefas para você!
        </p>
      </div>

      <button
        onClick={nextStep}
        className="cursor-pointer w-fit px-12 py-4 flex items-center gap-3 bg-[#348C98] rounded-full"
      >
        <MdArrowForward className="w-7 h-7 text-white" />

        <span className="text-lg text-white font-semibold">Vamos nessa</span>
      </button>
    </form>
  )
}
