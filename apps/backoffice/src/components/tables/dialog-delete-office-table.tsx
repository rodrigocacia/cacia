"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icone";

import { Button } from "@/components/ui/custom-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { deleteOfficeAction } from "@/app/(backoffice)/(with-sidebar)/office/actions";

interface DialogDeleteOfficeTableProps {
  officeId: string;
  officeName: string;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export function DialogDeleteOfficeTable({
  officeId,
  officeName,
  onSuccess,
  onError,
}: DialogDeleteOfficeTableProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDeleteOffice = async () => {
    try {
      setIsLoading(true);
      const result = await deleteOfficeAction(officeId);

      if (!result.success) {
        throw new Error("Falha ao excluir escritório");
      }

      setIsOpen(false);

      if (onSuccess) {
        onSuccess();
      }

      router.refresh();
    } catch {
      if (onError) {
        onError("Não foi possível excluir o escritório");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenuItem
        onSelect={(event) => {
          event.preventDefault();
          setIsOpen(true);
        }}
      >
        <Icon icon="mdi:trash-can" className="w-4 h-4 mr-2 text-[#DC2626]" />
        Excluir
      </DropdownMenuItem>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="px-[30px]">
          <DialogHeader>
            <DialogTitle className="sr-only">
              Tem certeza que deseja excluir este escritório?
            </DialogTitle>
          </DialogHeader>

          <div className="w-full flex flex-col items-center">
            <div className="w-[100px] h-[100px] flex items-center justify-center rounded-full bg-[#F6F6F9]">
              <Icon
                icon="mdi:help-circle"
                className="w-[56px] h-[56px] text-[#BDBDBD]"
              />
            </div>

            <div className="flex flex-col items-center justify-center gap-3.5 mt-[30px]">
              <h4 className="text-xl text-center text-[#33454C] font-semibold">
                Deseja mesmo excluir o escritório {officeName}?
              </h4>

              <p className="text-[18px] leading-[24px] text-[#4D5D63] text-center">
                Caso prossiga com esta solicitação, todos os dados do escritório
                serão perdidos, e essa ação não poderá ser desfeita.
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
                variant="danger"
                onClick={handleDeleteOffice}
                disabled={isLoading}
              >
                {isLoading ? "Excluindo..." : "Excluir mesmo assim"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
