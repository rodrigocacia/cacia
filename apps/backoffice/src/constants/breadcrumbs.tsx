import { Crumb } from "@/components/ui/custom-breadcrumb";
import { Icon } from "@/components/icone";

export const officeCrumbs: Crumb[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <Icon icon="mdi:chart-box-outline" className="w-4 h-4" />,
    isActive: true,
  },
  {
    label: "Escritórios",
    href: "/office",
    icon: <Icon icon="mdi:office-building-outline" className="w-4 h-4" />,
    isActive: false,
  },
];

export const financialCrumbs: Crumb[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <Icon icon="mdi:chart-box-outline" className="w-4 h-4" />,
    isActive: true,
  },
  {
    label: "Financeiro",
    href: "/financial",
    icon: <Icon icon="mdi:credit-card-outline" className="w-4 h-4" />,
    isActive: false,
  },
];

export const userCrumbs: Crumb[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <Icon icon="mdi:chart-box-outline" className="w-4 h-4" />,
    isActive: true,
  },
  {
    label: "Usuários",
    href: "/user",
    icon: <Icon icon="mdi:user-group-outline" className="w-4 h-4" />,
    isActive: false,
  },
];

export const officeDetailsCrumbs = (_id: string, name: string): Crumb[] => {
  return [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <Icon icon="mdi:chart-box-outline" className="w-4 h-4" />,
      isActive: true,
    },
    {
      label: "Escritórios",
      href: "/office",
      icon: <Icon icon="mdi:office-building-outline" className="w-4 h-4" />,
      isActive: false,
    },
    {
      label: name,
      href: `/office/${_id}/information`,
      icon: <Icon icon="mdi:office-building-outline" className="w-4 h-4" />,
      isActive: false,
    },
    {
      label: "Performance",
      href: `/office/${_id}/performance`,
      icon: <Icon icon="mdi:chart-box-outline" className="w-4 h-4" />,
      isActive: false,
    },
  ];
};

export const userDetailsCrumbs = (_id: string, name: string): Crumb[] => {
  return [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <Icon icon="mdi:chart-box-outline" className="w-4 h-4" />,
      isActive: true,
    },
    {
      label: "Usuários",
      href: "/user",
      icon: <Icon icon="mdi:user-group-outline" className="w-4 h-4" />,
      isActive: false,
    },
    {
      label: name,
      href: `/user/${_id}`,
      icon: <Icon icon="mdi:user-group-outline" className="w-4 h-4" />,
      isActive: false,
    },
  ];
};

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
];

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
];

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
];

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
  ];
};

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
      label: `Processo #${number}`,
      href: `/process/${_id}/information`,
      icon: <Icon icon="mdi:folder-text-outline" className="w-4 h-4" />,
      isActive: false,
    },
  ];
};

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
];

export const aiUsageCrumbs: Crumb[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <Icon icon="mdi:chart-box-outline" className="w-4 h-4" />,
    isActive: true,
  },
  {
    label: "Consumo de IA",
    href: "/ai-usage",
    icon: <Icon icon="mdi:robot-outline" className="w-4 h-4" />,
    isActive: false,
  },
];

export const aiBillingCrumbs: Crumb[] = [
  ...aiUsageCrumbs,
  {
    label: "Parâmetros de cobrança",
    href: "/ai-usage/billing",
    icon: <Icon icon="mdi:cog-outline" className="w-4 h-4" />,
    isActive: false,
  },
];
