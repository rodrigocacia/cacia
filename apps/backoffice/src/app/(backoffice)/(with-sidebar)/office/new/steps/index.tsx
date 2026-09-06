"use client";

import { useEffect, useRef, useState } from "react";

import { DialogTitle } from "@radix-ui/react-dialog";

import { Icon } from "@/components/icone";

import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

import { PersonalData } from "./personal-data";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Toast } from "@/components/ui/toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { officeFormSchema, OfficeFormData } from "@/schemas/office";
import { getOfficeById } from "@/http/office/get-office-by-id";
import { Spinner } from "@/components/ui/sppiner";
import { formatDocument } from "@/utils/formatters";

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

  const methods = useForm<OfficeFormData>({
    resolver: zodResolver(officeFormSchema),
    defaultValues: {},
  });

  useEffect(() => {
    const fetchOffice = async () => {
      if (editId && !editProcessedRef.current) {
        try {
          const { data } = await getOfficeById({ id: editId });

          if (data) {
            methods.reset({
              name: data.name || "",
              document: formatDocument(data.document || ""),
              legal_name: data.legal_name || "",
              trade_name: data.trade_name || "",
              remotejid: data.remotejid || "",
              description: data.description || "",
              street: data.address?.[0]?.street || "",
              number: data.address?.[0]?.number || "",
              neighborhood: data.address?.[0]?.neighborhood || "",
              city: data.address?.[0]?.city || "",
              state: data.address?.[0]?.state || "",
              cep: data.address?.[0]?.cep || "",
            });

            editProcessedRef.current = true;
          }
        } catch (err) {
          console.error("Erro ao carregar escritório para edição:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchOffice();
  }, [editId, methods]);

  if (editId && loading) {
    return (
      <div className="p-6">
        <Spinner size="md" className="h-40" />
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="px-4 pb-6 w-full h-screen overflow-y-scroll">
        <div className="mt-10 flex flex-col gap-3 mb-10">
          <div className="flex gap-2">
            <Icon
              icon={editId ? "mdi:pencil-outline" : "mdi:plus-outline"}
              className="text-[#BBE2E7] w-[30px] h-[30px]"
            />
            <h3 className="text-xl text-[#3D3D3D] font-bold">
              {editId ? "Editar escritório" : "Novo escritório"}
            </h3>
          </div>
          <p className="text-base text-[#BDBDBD]">
            {editId
              ? "Edite os campos abaixo para atualizar os dados do escritório"
              : "Preencha os campos abaixo para criar um novo escritório"}
          </p>
        </div>

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

  const editProcessedRef = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      if (editId) {
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

    if (editId) {
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
  }, [editId]);

  const handleChangeSheet = (value: boolean) => {
    if (!value && editId) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("editId");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      editProcessedRef.current = false;
      return;
    }

    setOpenSheet(value);
  };

  const handleChangeDrawer = (value: boolean) => {
    if (!value && editId) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("editId");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      editProcessedRef.current = false;
    }

    setOpenDrawer(value);
  };

  const handleOpenSuccess = () => {
    setOpenSuccess(true);
  };

  return (
    <div>
      <div className="h-full max-md:hidden">
        <Sheet open={openSheet} onOpenChange={handleChangeSheet}>
          <SheetContent className="min-w-[707px] rounded-tl-[24px] rounded-bl-[24px]">
            <SheetTitle className="sr-only">
              {editId ? "Editar escritório" : "Novo escritório"}
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
          <DrawerContent className="h-full">
            <DialogTitle className="sr-only">
              {editId ? "Editar escritório" : "Novo escritório"}
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
          title={editId ? "Escritório atualizado!" : "Escritório criado!"}
          description={
            editId
              ? "Os dados do escritório foram atualizados com sucesso."
              : "O escritório foi criado com sucesso."
          }
        />
      )}
    </div>
  );
}
