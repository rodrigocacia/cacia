export enum ServiceArea {
  ADMINISTRATIVE = 'administrative',
  AGRARIAN = 'agrarian',
  BANKRUPTCY = 'bankruptcy',
  BUSINESS = 'business',
  CIVIL = 'civil',
  CONSUMER = 'consumer',
  CONTRACT = 'contract',
  CORPORATE = 'corporate',
  CRIMINAL = 'criminal',
  DIGITAL = 'digital',
  ELECTORAL = 'electoral',
  ENVIRONMENTAL = 'environmental',
  FAMILY = 'family',
  HEALTH = 'health',
  HUMAN_RIGHTS = 'human_rights',
  IMMIGRATION = 'immigration',
  INSURANCE = 'insurance',
  INTELLECTUAL_PROPERTY = 'intellectual_property',
  INTERNATIONAL = 'international',
  LABOR = 'labor',
  MILITARY = 'military',
  NOTARIAL = 'notarial',
  PENSION = 'pension',
  REAL_ESTATE = 'real_estate',
  SOCIAL_SECURITY = 'social_security',
  SPORTS = 'sports',
  TAX = 'tax',
  TECHNOLOGY = 'technology',
  TRAFFIC = 'traffic',
  TRIBUTARY = 'tributary',
  YOUTH = 'youth',
  OTHER = 'other',
}

export interface Service {
  office: string;
  title: string;
  description: string;
  area: string;
  value_type: string;
  value_fixed: number;
  value_float: number | null;
  value_detail: string;
  status: boolean;
  deleted_at: string | null;
  _id: string;
  created_at: string;
  updated_at: string;
  __v: number;
}
