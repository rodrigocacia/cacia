import { EventType, EventStatus } from '@/types/event';
import { ServiceArea } from '@/types/service';

export const eventyOptions = [
  {
    value: EventType.HEARING,
    label: 'Audiência',
  },
  {
    value: EventType.INQUIRY,
    label: 'Inquérito',
  },
  {
    value: EventType.DEADLINE,
    label: 'Prazo',
  },
  {
    value: EventType.MEETING,
    label: 'Reunião',
  },
];

export const statusOptions = [
  {
    value: EventStatus.PENDING,
    label: 'Pendente',
  },
  {
    value: EventStatus.CONFIRM,
    label: 'Confirmado',
  },
];

export const areaOptions = [
  { value: ServiceArea.ADMINISTRATIVE, label: 'Administrativo' },
  { value: ServiceArea.AGRARIAN, label: 'Agrário' },
  { value: ServiceArea.BANKRUPTCY, label: 'Falência' },
  { value: ServiceArea.BUSINESS, label: 'Empresarial' },
  { value: ServiceArea.CIVIL, label: 'Civil' },
  { value: ServiceArea.CONSUMER, label: 'Consumidor' },
  { value: ServiceArea.CONTRACT, label: 'Contratual' },
  { value: ServiceArea.CORPORATE, label: 'Corporativo' },
  { value: ServiceArea.CRIMINAL, label: 'Criminal' },
  { value: ServiceArea.DIGITAL, label: 'Digital' },
  { value: ServiceArea.ELECTORAL, label: 'Eleitoral' },
  { value: ServiceArea.ENVIRONMENTAL, label: 'Ambiental' },
  { value: ServiceArea.FAMILY, label: 'Familiar' },
  { value: ServiceArea.HEALTH, label: 'Saúde' },
  { value: ServiceArea.HUMAN_RIGHTS, label: 'Direitos Humanos' },
  { value: ServiceArea.IMMIGRATION, label: 'Imigração' },
  {
    value: ServiceArea.INTELLECTUAL_PROPERTY,
    label: 'Propriedade Intelectual',
  },
  { value: ServiceArea.INTERNATIONAL, label: 'Internacional' },
  { value: ServiceArea.LABOR, label: 'Trabalho' },
  { value: ServiceArea.MILITARY, label: 'Militar' },
  { value: ServiceArea.NOTARIAL, label: 'Notarial' },
  { value: ServiceArea.REAL_ESTATE, label: 'Imobiliário' },
  { value: ServiceArea.TAX, label: 'Tributário' },
  { value: ServiceArea.OTHER, label: 'Outro' },
].sort((a, b) => a.label.localeCompare(b.label));
