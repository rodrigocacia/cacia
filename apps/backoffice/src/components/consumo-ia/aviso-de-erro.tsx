import { CircleAlert } from "lucide-react";

/** Falha ao carregar o relatório: o motivo vem da API. */
export function AvisoDeErro({ mensagem }: { mensagem: string }) {
  return (
    <div
      role="alert"
      className="mt-6 flex w-full items-center gap-3 rounded-[14px] border border-filete bg-white p-5"
    >
      <CircleAlert
        size={18}
        strokeWidth={1.7}
        className="shrink-0 text-tinta-3"
        aria-hidden
      />
      <p className="text-[14px] text-tinta-2">{mensagem}</p>
    </div>
  );
}
