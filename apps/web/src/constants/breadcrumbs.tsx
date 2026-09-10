import { Crumb } from "@/components/ui/custom-breadcrumb"
import { Icon } from "@/components/icone"
import { formatProcess } from "@/utils/formatters"

export const customerDetailsCrumbs = (_id: string, name: string): Crumb[] => {
  return [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <Icon icon="mdi:chart-box-outline" className="w-4 h-4" />,
      isActive: true,
    },
    {
      label: "Clientes",
      href: "/customer",
      icon: <Icon icon="mdi:account-group-outline" className="w-4 h-4" />,
      isActive: false,
    },
    {
      label: name,
      href: `/customer/${_id}`,
      icon: <Icon icon="mdi:account-group-outline" className="w-4 h-4" />,
      isActive: false,
    },
  ]
}

export const folderDetailsCrumbs = (_id: string, title: string): Crumb[] => {
  return [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <Icon icon="mdi:chart-box-outline" className="w-4 h-4" />,
      isActive: true,
    },
    {
      label: "Documentos",
      href: "/document",
      icon: <Icon icon="mdi:file-document-outline" className="w-4 h-4" />,
      isActive: true,
    },
    {
      label: title,
      href: `/document/${_id}`,
      icon: <Icon icon="mdi:folder-open-outline" className="w-4 h-4" />,
      isActive: false,
    },
  ]
}

export const processDetailsCrumbs = (_id: string, number: string): Crumb[] => {
  return [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <Icon icon="mdi:chart-box-outline" className="w-4 h-4" />,
      isActive: true,
    },
    {
      label: "Processos",
      href: "/process",
      icon: <Icon icon="mdi:folder-text-outline" className="w-4 h-4" />,
      isActive: true,
    },
    {
      label: `Processo ${formatProcess(number)}`,
      href: `/process/${_id}/information`,
      icon: <Icon icon="mdi:folder-text-outline" className="w-4 h-4" />,
      isActive: false,
    },
  ]
}
