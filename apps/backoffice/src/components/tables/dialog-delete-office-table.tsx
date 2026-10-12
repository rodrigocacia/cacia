"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

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
        variant="destructive"
        onSelect={(event) => {
          event.preventDefault();
          setIsOpen(true);
        }}
      >
        <Trash2 strokeWidth={1.7} />
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
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FBEDEA]">
              <Trash2 size={22} strokeWidth={1.7} className="text-[#A23B2A]" />
            </div>

            <div className="mt-5 flex flex-col items-center justify-center gap-2">
              <h4 className="text-center font-display text-[26px] leading-tight text-tinta">
                Deseja mesmo excluir o escritório {officeName}?
              </h4>

              <p className="text-center text-[14.5px] leading-[1.5] text-tinta-2">
                Caso prossiga com esta solicitação, todos os dados do escritório
                serão perdidos, e essa ação não poderá ser desfeita.
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
