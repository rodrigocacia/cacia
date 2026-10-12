"use client";

import { useEffect, useRef, useState } from "react";

import { DialogTitle } from "@radix-ui/react-dialog";

import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { CabecalhoDoFormulario } from "@/components/drawer-or-sheet/partes";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/sppiner";

import { PersonalData } from "./personal-data";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Toast } from "@/components/ui/toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  userUpdateFormSchema,
  userFormSchema,
  UserUpdateFormData,
  UserFormData,
} from "@/schemas/user";
import { getUserById } from "@/http/user/get-user-by-id";
import { formatDocument } from "@/utils/formatters";

function formatBirthdayForInput(birthday: string): string {
  if (!birthday) return "";

  try {
    const date = new Date(birthday);
    if (isNaN(date.getTime())) return "";

    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

function FormComponent({
  handleOpenSuccess,
  onClose,
}: {
  handleOpenSuccess: () => void;
  onClose: () => void;
}) {
  const searchParams = useSearchParams();
  const editId = searchParams.get("editId");
  const editProcessedRef = useRef(false);

  const [loading, setLoading] = useState(!!editId);

  const isEditing = !!editId;
  const schema = isEditing ? userUpdateFormSchema : userFormSchema;
  const defaultValues = isEditing ? {} : { password: "", confirmPassword: "" };

  const methods = useForm<UserFormData | UserUpdateFormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    const fetchUser = async () => {
      if (editId && !editProcessedRef.current) {
        try {
          const { data } = await getUserById({ id: editId });

          if (data) {
            methods.reset({
              name: data.name || "",
              email: data.email || "",
              phone: data.phone || "",
              birthday: formatBirthdayForInput(data.birthday),
              document: formatDocument(data.document || ""),
            });

            editProcessedRef.current = true;
          }
        } catch (err) {
          console.error("Erro ao carregar usuário para edição:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUser();
  }, [editId, methods]);

  if (editId && loading) {
    return <Spinner />;
  }

  return (
    <FormProvider {...methods}>
      <div className="flex h-screen w-full flex-col gap-7 overflow-y-auto max-md:h-[85vh]">
        <CabecalhoDoFormulario
          rotulo="Usuários"
          titulo={editId ? "Editar usuário" : "Novo usuário"}
          descricao={
            editId
              ? "Edite os campos abaixo para atualizar os dados do usuário."
              : "Preencha os campos abaixo para criar um novo usuário."
          }
        />

        <PersonalData
          editId={editId || ""}
          handleOpenSuccess={handleOpenSuccess}
          onClose={onClose}
        />
      </div>
    </FormProvider>
  );
}

export function Form() {
  const [openSheet, setOpenSheet] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [openSuccess, setOpenSuccess] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const editId = searchParams.get("editId");
  // `?novo=1` abre o cadastro — o formulário de criação existia, mas só abria
  // com `editId`, e não havia como chegar nele pela tela.
  const aberto = !!editId || searchParams.get("novo") === "1";

  const editProcessedRef = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      if (aberto) {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          setOpenDrawer(true);
          setOpenSheet(false);
        } else {
          setOpenSheet(true);
          setOpenDrawer(false);
        }
      }
    };

    if (aberto) {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setOpenDrawer(true);
        setOpenSheet(false);
      } else {
        setOpenSheet(true);
        setOpenDrawer(false);
      }
    } else {
      setOpenSheet(false);
      setOpenDrawer(false);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [aberto]);

  const fecharNaUrl = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("editId");
    params.delete("novo");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    editProcessedRef.current = false;
  };

  const handleChangeSheet = (value: boolean) => {
    if (!value && aberto) {
      fecharNaUrl();
      return;
    }

    setOpenSheet(value);
  };

  const handleChangeDrawer = (value: boolean) => {
    if (!value && aberto) fecharNaUrl();

    setOpenDrawer(value);
  };

  const handleOpenSuccess = () => {
    setOpenSuccess(true);
  };

  return (
    <div>
      <div className="h-full max-md:hidden">
        <Sheet open={openSheet} onOpenChange={handleChangeSheet}>
          <SheetContent className="min-w-[640px] px-8">
            <SheetTitle className="sr-only">
              {editId ? "Editar usuário" : "Novo usuário"}
            </SheetTitle>
            <FormComponent
              handleOpenSuccess={handleOpenSuccess}
              onClose={() => handleChangeSheet(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      <div className="md:hidden">
        <Drawer open={openDrawer} onOpenChange={handleChangeDrawer}>
          <DrawerContent className="h-full px-4">
            <DialogTitle className="sr-only">
              {editId ? "Editar usuário" : "Novo usuário"}
            </DialogTitle>
            <FormComponent
              handleOpenSuccess={handleOpenSuccess}
              onClose={() => handleChangeDrawer(false)}
            />
          </DrawerContent>
        </Drawer>
      </div>

      {openSuccess && (
        <Toast
          onClose={() => setOpenSuccess(false)}
          variant="successSolid"
          title={editId ? "Usuário atualizado!" : "Usuário criado!"}
          description={
            editId
              ? "Os dados do usuário foram atualizados com sucesso."
              : "O usuário foi criado com sucesso."
          }
        />
      )}
    </div>
  );
}
