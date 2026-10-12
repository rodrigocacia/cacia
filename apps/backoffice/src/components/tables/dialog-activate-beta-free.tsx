"use client";

import { useState } from "react";
import { BadgeCheck } from "lucide-react";
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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-nevoa">
            <BadgeCheck
              size={22}
              strokeWidth={1.7}
              className="text-turquesa-profundo"
            />
          </div>

          <div className="mt-5 flex flex-col items-center justify-center gap-2">
            <h4 className="text-center font-display text-[26px] leading-tight text-tinta">
              Ativar plano Beta FREE
            </h4>

            <p className="text-center text-[14.5px] leading-[1.5] text-tinta-2">
              Deseja ativar o plano Beta FREE para o escritório{" "}
              <strong>{officeName}</strong>? Esta ação irá modificar o status da
              recorrência.
            </p>
          </div>

          <div className="mt-7 flex w-full items-center justify-center gap-2.5">
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
