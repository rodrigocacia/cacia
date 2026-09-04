"use client";

import { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Button } from "@/components/ui/custom-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { activateBetaFree } from "@/http/office/activate-beta-free";

interface DialogActivateBetaFreeProps {
  officeId: string;
  officeName: string;
  trigger: React.ReactNode;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function DialogActivateBetaFree({
  officeId,
  officeName,
  trigger,
  onSuccess,
  onError,
}: DialogActivateBetaFreeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleActivateBetaFree = async () => {
    try {
      setIsLoading(true);
      const result = await activateBetaFree({ id: officeId });

      if (!result.success) {
        throw new Error(result.message);
      }

      onSuccess?.(result.message);
      setIsOpen(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Não foi possível ativar o plano Beta FREE";
      onError?.(errorMessage);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="px-[30px]">
        <DialogHeader>
          <DialogTitle className="sr-only">
            Tem certeza que deseja ativar o plano Beta FREE?
          </DialogTitle>
        </DialogHeader>

        <div className="w-full flex flex-col items-center">
          <div className="w-[100px] h-[100px] flex items-center justify-center rounded-full bg-[#F6F6F9]">
            <Icon
              icon="mdi:check-circle"
              className="w-[56px] h-[56px] text-[#348C98]"
            />
          </div>

          <div className="flex flex-col items-center justify-center gap-3.5 mt-[30px]">
            <h4 className="text-xl text-center text-[#33454C] font-semibold">
              Ativar plano Beta FREE
            </h4>

            <p className="text-[18px] leading-[24px] text-[#4D5D63] text-center">
              Deseja ativar o plano Beta FREE para o escritório{" "}
              <strong>{officeName}</strong>? Esta ação irá modificar o status da
              recorrência.
            </p>
          </div>

          <div className="w-full flex items-center justify-center gap-3.5 mt-[34px]">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>

            <Button
              variant="primary"
              className="cursor-pointer"
              onClick={handleActivateBetaFree}
              disabled={isLoading}
            >
              {isLoading ? "Ativando..." : "Ativar Beta FREE"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
