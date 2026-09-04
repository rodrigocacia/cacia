"use client";
import { FaTrash } from "react-icons/fa";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui/toast";
import { mutate } from "swr";

import { Button } from "@/components/ui/custom-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react/dist/iconify.js";
import { deleteUserAction } from "../../actions";

interface DialogDeleteUserProps {
  userId: string;
  userName: string;
}

export function DialogDeleteUser({ userId, userName }: DialogDeleteUserProps) {
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

  const handleDeleteUser = async () => {
    try {
      setIsLoading(true);
      const result = await deleteUserAction(userId);

      if (!result.success) {
        throw new Error("Falha ao excluir usuário");
      }

      setToastConfig({
        title: "Sucesso!",
        description: "Usuário excluído com sucesso!",
        variant: "successSolid",
      });
      setShowToast(true);
      setIsOpen(false);
      await mutate((key) => Array.isArray(key) && key[0] === "user");
      router.push("/user?deleted=true");
    } catch {
      setToastConfig({
        title: "Erro!",
        description: "Não foi possível excluir o usuário",
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
          <Button
            className="cursor-pointer"
            variant="danger"
            iconLeft={<FaTrash size={16} className="text-[#DC2626]" />}
          >
            Excluir
          </Button>
        </DialogTrigger>

        <DialogContent className="px-[30px]">
          <DialogHeader>
            <DialogTitle className="sr-only">
              Tem certeza que deseja excluir este usuário?
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
                Deseja mesmo excluir o usuário {userName}?
              </h4>

              <p className="text-[18px] leading-[24px] text-[#4D5D63] text-center">
                Caso prossiga com esta solicitação, todos os dados do usuário
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
                onClick={handleDeleteUser}
                disabled={isLoading}
              >
                {isLoading ? "Excluindo..." : "Excluir mesmo assim"}
              </Button>
            </div>
          </div>
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
