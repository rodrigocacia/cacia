"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";

import { Icon } from "@/components/icone";
import { Button } from "@/components/ui/custom-button";
import { Toast } from "@/components/ui/toast";
import { OfficeStatus } from "@/types/office";

import { alterarSituacaoDoEscritorioAction } from "../../actions";

/**
 * Ativar ou desativar o escritório.
 *
 * Pendente e desativado oferecem "Ativar"; ativo oferece "Desativar". Não há
 * volta para pendente pela tela: pendente é o estado de quem ainda não foi
 * liberado, não uma escolha do operador.
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

  return (
    <>
      <Button
        type="button"
        className="cursor-pointer"
        variant={ativo ? "danger" : "outline"}
        onClick={alternar}
        isLoading={pendente}
        disabled={pendente}
        iconLeft={
          <Icon
            icon={ativo ? "mdi:archive" : "mdi:check-circle"}
            className="w-4 h-4"
          />
        }
      >
        {ativo ? "Desativar" : "Ativar"}
      </Button>

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
