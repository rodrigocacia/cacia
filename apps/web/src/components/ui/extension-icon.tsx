import { Icon } from "@iconify/react"

interface ExtensionIconProps {
  type?: string
  extension?: string
  className?: string
}

export function ExtensionIcon({
  type = "",
  extension = "",
  className = "w-6 h-6",
}: ExtensionIconProps) {
  if (
    !type ||
    type === "upload" ||
    type === "create" ||
    type === "attachment"
  ) {
    switch (extension.toLowerCase()) {
      case "pdf":
        return (
          <Icon
            icon="mdi:file-pdf-box"
            className={`${className} text-[#E53935]`}
          />
        )
      case "doc":
      case "docx":
        return (
          <Icon
            icon="mdi:file-word-box"
            className={`${className} text-[#1976D2]`}
          />
        )
      case "png":
      case "jpeg":
      case "jpg":
      case "gif":
      case "bmp":
      case "webp":
        return (
          <Icon
            icon="mdi:file-image"
            className={`${className} text-[#388E3C]`}
          />
        )
      case "txt":
        return (
          <Icon
            icon="mdi:file-document-outline"
            className={`${className} text-[#FBC02D]`}
          />
        )
      case "xls":
      case "xlsx":
        return (
          <Icon
            icon="mdi:file-excel-box"
            className={`${className} text-[#1B5E20]`}
          />
        )
      case "ppt":
      case "pptx":
        return (
          <Icon
            icon="mdi:file-powerpoint-box"
            className={`${className} text-[#D84315]`}
          />
        )
      default:
        return (
          <Icon
            icon="mdi:file-document-outline"
            className={`${className} text-[#707070]`}
          />
        )
    }
  }
  // Só mostra pasta se for realmente uma pasta (type diferente dos documentos)
  return (
    <Icon icon="mdi:folder-open" className={`${className} text-[#348C98]`} />
  )
}
