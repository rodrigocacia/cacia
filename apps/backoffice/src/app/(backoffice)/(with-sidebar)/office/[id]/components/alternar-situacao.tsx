"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { CircleCheck, CircleOff, Loader2 } from "lucide-react";

import { Toast } from "@/components/ui/toast";
import { OfficeStatus } from "@/types/office";

import { alterarSituacaoDoEscritorioAction } from "../../actions";

/**
 * Ativar ou desativar o escritório.
 *
 * Pendente e desativado oferecem "Ativar"; ativo oferece "Desativar". Não há
 * volta para pendente pela tela: pendente é o estado de quem ainda não foi
 * liberado, não uma escolha do operador.
 *
 * Ativar é a ação principal da ficha de quem espera liberação, por isso leva
 * o turquesa; desativar fica contornado, sem cor.
 */
export function AlternarSituacao({
  officeId,
  status,
}: {
  officeId: string;
  status: OfficeStatus;
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const ativo = status === OfficeStatus.ACTIVE;
  const destino = ativo ? OfficeStatus.DEACTIVATE : OfficeStatus.ACTIVE;

  function alternar() {
    iniciar(async () => {
      const resultado = await alterarSituacaoDoEscritorioAction(
        officeId,
        destino,
      );

      if (!resultado.success) {
        setErro(resultado.error ?? "Erro ao alterar a situação");
        return;
      }

      await mutate((key) => Array.isArray(key) && key[0] === "office");
      router.refresh();
    });
  }

  const Icone = pendente ? Loader2 : ativo ? CircleOff : CircleCheck;

  return (
    <>
      <button
        type="button"
        onClick={alternar}
        disabled={pendente}
        aria-busy={pendente}
        className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-[9px] px-3.5 text-[13.5px] transition-colors focus-visible:ring-[3px] focus-visible:ring-nevoa-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
          ativo
            ? "border border-filete-forte bg-white font-medium text-tinta hover:bg-gray-100"
            : "bg-acao font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] hover:bg-acao-escura"
        }`}
      >
        <Icone
          size={15}
          strokeWidth={1.7}
          aria-hidden
          className={pendente ? "animate-spin" : undefined}
        />
        {ativo ? "Desativar" : "Ativar"}
      </button>

      {erro && (
        <Toast
          title="Erro!"
          description={erro}
          variant="errorSolid"
          onClose={() => setErro(null)}
        />
      )}
    </>
  );
}
