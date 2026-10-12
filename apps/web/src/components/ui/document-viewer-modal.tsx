import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Image from "next/image"
import { useState, useEffect } from "react"
import { CustomRadioButton } from "@/components/ui/custom-radio-button"
import { CustomSelect } from "@/components/ui/custom-select"
import { Button } from "@/components/ui/custom-button"
import { useCustomers } from "@/http/hooks/customer"
import { useLeads } from "@/http/hooks/lead"
import { updateDocument } from "@/http/document/update-document"
import { nomeParaExibir } from "@/utils/formatters"
import { Toast } from "@/components/ui/toast"

export interface DocumentViewer {
  _id: string
  title: string
  extension: string
  content_url: string
  updated_at: string
  type?: string
  lead?: {
    _id: string
    name: string
    remotejid: string
    email: string
  }
  customer?: {
    _id: string
    name: string
    remotejid: string
    email: string
  }
}

interface DocumentViewerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: DocumentViewer | null
}

type AttachmentType = "none" | "lead" | "customer"

export function DocumentViewerModal({
  open,
  onOpenChange,
  document,
}: DocumentViewerModalProps) {
  const [attachmentType, setAttachmentType] = useState<AttachmentType>("none")
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
  const [selectedLeadId, setSelectedLeadId] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"success" | "error">("success")
  const [initialAttachmentType, setInitialAttachmentType] =
    useState<AttachmentType>("none")
  const [initialSelectedCustomerId, setInitialSelectedCustomerId] =
    useState<string>("")
  const [initialSelectedLeadId, setInitialSelectedLeadId] = useState<string>("")

  const { customers } = useCustomers({ limit: 100 })
  const { leads: allLeads } = useLeads(1)

  useEffect(() => {
    if (document) {
      if (document.lead) {
        setAttachmentType("lead")
        setSelectedLeadId(document.lead._id)
        setInitialAttachmentType("lead")
        setInitialSelectedLeadId(document.lead._id)
      } else if (document.customer) {
        setAttachmentType("customer")
        setSelectedCustomerId(document.customer._id)
        setSelectedLeadId("")
        setInitialAttachmentType("customer")
        setInitialSelectedCustomerId(document.customer._id)
        setInitialSelectedLeadId("")
      } else {
        setAttachmentType("none")
        setSelectedCustomerId("")
        setSelectedLeadId("")
        setInitialAttachmentType("none")
        setInitialSelectedCustomerId("")
        setInitialSelectedLeadId("")
      }
    }
  }, [document])

  const hasChanges = () => {
    return (
      attachmentType !== initialAttachmentType ||
      selectedCustomerId !== initialSelectedCustomerId ||
      selectedLeadId !== initialSelectedLeadId
    )
  }

  const handleSave = async () => {
    if (!document) return

    setIsSubmitting(true)
    try {
      const updateData: {
        _id: string
        customer_id?: string | null
        lead_id?: string | null
      } = {
        _id: document._id,
      }

      switch (attachmentType) {
        case "none":
          updateData.customer_id = null
          updateData.lead_id = null
          break
        case "customer":
          updateData.customer_id = selectedCustomerId || null
          updateData.lead_id = null
          break
        case "lead":
          updateData.lead_id = selectedLeadId || null
          updateData.customer_id = null
          break
      }

      const result = await updateDocument(updateData)

      if (result.success) {
        setToastMessage("Vinculação do documento atualizada com sucesso!")
        setToastType("success")
        setShowToast(true)
        setInitialAttachmentType(attachmentType)
        setInitialSelectedCustomerId(selectedCustomerId)
        setInitialSelectedLeadId(selectedLeadId)
        setTimeout(() => {
          onOpenChange(false)
        }, 1500)
      } else {
        setToastMessage(
          result.error || "Erro ao atualizar vinculação do documento"
        )
        setToastType("error")
        setShowToast(true)
      }
    } catch {
      setToastMessage("Erro interno ao atualizar vinculação do documento")
      setToastType("error")
      setShowToast(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAttachmentTypeChange = (value: string) => {
    setAttachmentType(value as AttachmentType)
    setSelectedCustomerId("")
    setSelectedLeadId("")
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!w-[96vw] !max-w-[96vw] md:!w-[1024px] md:!max-w-[1024px] max-h-[94vh] md:max-h-[90vh] p-0 overflow-hidden border-0 shadow-lg rounded-smone bg-[#20585FCC]">
          <div className="flex flex-col h-full w-full">
            <DialogHeader className="p-4 border-b w-full">
              <DialogTitle className="text-lg text-white font-semibold">
                {document?.title}
              </DialogTitle>
            </DialogHeader>

            <div className="bg-white border-b px-4 py-3">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
                <div className="flex gap-6">
                  <CustomRadioButton
                    name="attachmentType"
                    value="none"
                    label="Não anexar"
                    checked={attachmentType === "none"}
                    onChange={handleAttachmentTypeChange}
                  />
                  <CustomRadioButton
                    name="attachmentType"
                    value="lead"
                    label="Anexar a lead"
                    checked={attachmentType === "lead"}
                    onChange={handleAttachmentTypeChange}
                  />
                  <CustomRadioButton
                    name="attachmentType"
                    value="customer"
                    label="Anexar a cliente"
                    checked={attachmentType === "customer"}
                    onChange={handleAttachmentTypeChange}
                  />
                </div>

                <div className="flex gap-4 items-center flex-1">
                  {attachmentType === "lead" && (
                    <div className="flex-1">
                      <CustomSelect
                        options={
                          allLeads?.map((lead) => ({
                            value: lead._id,
                            label: nomeParaExibir(lead.name),
                          })) || []
                        }
                        value={selectedLeadId}
                        onChange={setSelectedLeadId}
                        iconName="person"
                        placeholder="Selecione um lead"
                      />
                    </div>
                  )}

                  {attachmentType === "customer" && (
                    <div className="flex-1">
                      <CustomSelect
                        options={
                          customers?.map((customer) => ({
                            value: customer._id,
                            label: nomeParaExibir(customer.name),
                          })) || []
                        }
                        value={selectedCustomerId}
                        onChange={setSelectedCustomerId}
                        iconName="person"
                        placeholder="Selecione um cliente"
                      />
                    </div>
                  )}

                  {hasChanges() && (
                    <Button
                      onClick={handleSave}
                      disabled={
                        isSubmitting ||
                        (attachmentType === "customer" &&
                          !selectedCustomerId) ||
                        (attachmentType === "lead" && !selectedLeadId)
                      }
                      className="px-6 py-2"
                    >
                      {isSubmitting ? "Salvando..." : "Salvar"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 w-full h-full overflow-auto">
              {document?.extension !== "pdf" ? (
                <div className="flex items-center justify-center w-full h-full">
                  <Image
                    src={document?.content_url ?? ""}
                    alt={document?.title ?? ""}
                    width={0}
                    height={0}
                    sizes="100vw"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      width: "auto",
                      height: "auto",
                      objectFit: "contain",
                    }}
                  />
                </div>
              ) : null}
              {document?.extension === "pdf" ? (
                <iframe
                  src={document?.content_url}
                  className="w-full !h-[94vh] md:max-h-[90vh]"
                ></iframe>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showToast && (
        <Toast
          title={toastType === "success" ? "Sucesso!" : "Erro!"}
          description={toastMessage}
          variant={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  )
}
