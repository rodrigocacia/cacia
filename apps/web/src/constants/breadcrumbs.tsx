import { Crumb } from "@/components/ui/custom-breadcrumb"
import { Icon } from "@iconify/react/dist/iconify.js"
import { formatProcess } from "@/utils/formatters"

export const customerCrumbs: Crumb[] = [
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
]

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

export const leadCrumbs: Crumb[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <Icon icon="mdi:chart-box-outline" className="w-4 h-4" />,
    isActive: true,
  },
  {
    label: "Leads",
    href: "/lead",
    icon: <Icon icon="mdi:leads-outline" className="w-4 h-4" />,
    isActive: false,
  },
]

export const processCrumbs: Crumb[] = [
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
    isActive: false,
  },
]

export const documentCrumbs: Crumb[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <Icon icon="mdi:chart-box-outline" className="w-4 h-4" />,
    isActive: true,
  },
  {
    label: "Documentos",
    href: "/process",
    icon: <Icon icon="mdi:file-document-outline" className="w-4 h-4" />,
    isActive: false,
  },
]

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

export const eventCrumbs: Crumb[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <Icon icon="mdi:chart-box-outline" className="w-4 h-4" />,
    isActive: true,
  },
  {
    label: "Eventos",
    href: "/event",
    icon: <Icon icon="mdi:calendar-month-outline" className="w-4 h-4" />,
    isActive: false,
  },
]

export const notificationCrumbs: Crumb[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <Icon icon="mdi:chart-box-outline" className="w-4 h-4" />,
    isActive: true,
  },
  {
    label: "Notificações",
    href: "/notification",
    icon: <Icon icon="mdi:bell-outline" className="w-4 h-4" />,
    isActive: false,
  },
]
