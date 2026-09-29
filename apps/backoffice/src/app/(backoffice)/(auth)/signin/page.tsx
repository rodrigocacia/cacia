import { SignInForm } from "./sign-in-form";
import TextSlider from "@/components/text-slider";

export default function SignIn() {
  return (
    <div className="w-full h-screen px-8 py-10 max-lg:px-0 max-lg:py-0">
      <main className="w-full h-fit max-lg:h-full pb-6 max-lg:pb-0  grid grid-cols-[2fr_3fr] max-lg:flex max-lg max-lg:flex-col max-lg:justify-between">
        <div className="relative flex flex-1 flex-col px-4 pt-10 pb-10 justify-end gap-3.5 bg-[url('/bg-login.png')] bg-cover bg-center h-[260px] w-full lg:hidden -mb-6 z-0">
          <h3 className="text-2xl text-white font-semibold">
            Potencialize suas tarefas jurídicas com a CacIA
          </h3>

          <p className="text-[18px] text-white">
            Faça login agora e transforme sua forma de advogar!
          </p>
        </div>

        <SignInForm />

        <div className="relative flex flex-col items-center justify-center bg-[url('/bg-login.png')] bg-cover bg-center h-full w-full rounded-r-4xl max-lg:hidden -ml-6 z-0">
          <TextSlider />
        </div>
      </main>
    </div>
  );
}
