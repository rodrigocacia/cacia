"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui/toast";
import { mutate } from "swr";

import { Button } from "@/components/ui/custom-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteOfficeAction } from "../../actions";

interface DialogDeleteOfficeProps {
  officeId: string;
  officeName: string;
}

export function DialogDeleteOffice({
  officeId,
  officeName,
}: DialogDeleteOfficeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastConfig, setToastConfig] = useState<{
    title: string;
    description: string;
    variant: "success" | "error" | "alert" | "successSolid" | "errorSolid";
  }>({
    title: "",
    description: "",
    variant: "success",
  });
  const router = useRouter();

  const handleDeleteOffice = async () => {
    try {
      setIsLoading(true);
      const result = await deleteOfficeAction(officeId);

      if (!result.success) {
        throw new Error("Falha ao excluir escritório");
      }

      setToastConfig({
        title: "Sucesso!",
        description: "Escritório excluído com sucesso!",
        variant: "successSolid",
      });
      setShowToast(true);
      setIsOpen(false);
      await mutate((key) => Array.isArray(key) && key[0] === "office");
      router.push("/office?deleted=true");
    } catch {
      setToastConfig({
        title: "Erro!",
        description: "Não foi possível excluir o escritório",
        variant: "errorSolid",
      });
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[9px] border border-filete-forte bg-white px-3.5 text-[13.5px] font-medium text-[#A23B2A] transition-colors hover:border-[#F0CFC7] hover:bg-[#FBEDEA] focus-visible:ring-[3px] focus-visible:ring-nevoa-2 focus-visible:outline-none"
          >
            <Trash2 size={15} strokeWidth={1.7} aria-hidden />
            Excluir
          </button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Excluir o escritório {officeName}?</DialogTitle>
          </DialogHeader>

          <DialogDescription className="text-[14px] leading-[1.55]">
            Todos os dados do escritório serão perdidos. Essa ação não poderá
            ser desfeita.
          </DialogDescription>

          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showToast && (
        <Toast
          title={toastConfig.title}
          description={toastConfig.description}
          variant={toastConfig.variant}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}
