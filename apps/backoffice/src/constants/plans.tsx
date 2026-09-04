import {
  MdOutlineAutoAwesome,
  MdOutlineGroups,
  MdOutlineWhatsapp,
  MdPlayCircleFilled,
  MdSupportAgent,
} from "react-icons/md";
import { TbMailFast } from "react-icons/tb";

import { IconType } from "react-icons/lib";
import { JSX } from "react";

export type Plan = {
  id: number;
  value: number;
  title: string;
  benefits: (
    | {
        id: number;
        title: string;
        icon: IconType;
      }
    | {
        id: number;
        title: string;
        icon: JSX.Element;
      }
  )[];
  mostPopular: boolean;
};

export const plans: Plan[] = [
  {
    id: 0,
    value: 0,
    title: "Grátis!",
    benefits: [
      { id: 0, title: "Até 10 clientes", icon: MdOutlineGroups },
      { id: 1, title: "Integração WhatsApp básica", icon: MdOutlineWhatsapp },
      { id: 2, title: "Suporte por email", icon: TbMailFast },
    ],
    mostPopular: false,
  },
  {
    id: 1,
    value: 97,
    title: "Standard",
    benefits: [
      { id: 0, title: "Até 50 clientes", icon: MdOutlineGroups },
      { id: 1, title: "Integração WhatsApp completa", icon: MdOutlineWhatsapp },
      { id: 2, title: "Automações básicas com IA", icon: MdOutlineAutoAwesome },
      { id: 3, title: "Suporte prioritário", icon: MdSupportAgent },
    ],
    mostPopular: true,
  },
  {
    id: 2,
    value: 197,
    title: "Premium",
    benefits: [
      { id: 0, title: "Clientes ilimitados", icon: MdOutlineGroups },
      { id: 1, title: "IA avançada + Analytics", icon: MdOutlineAutoAwesome },
      { id: 2, title: "Suporte 24/7", icon: MdSupportAgent },
      {
        id: 3,
        title: "Treinamento exclusivo",
        icon: MdPlayCircleFilled,
      },
    ],
    mostPopular: false,
  },
];
