/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { api } from '../api-client';

export interface GetOfficePerformanceRequest {
  officeId: string;
  periodInDays: number;
}

export interface GetOfficePerformanceResponse {
  customers: number;
  documents: number;
  documentsVariation: number;
  leads: number;
  leadsVariation: number;
  customersVariation: number;
  totalProcesses: number;
  completedProcesses: number;
  ongoingProcesses: number;
  processesByType: Record<string, number>;
}

export async function getOfficePerformance({
  officeId,
  periodInDays,
}: GetOfficePerformanceRequest) {
  try {
    const result = await api
      .get(`admin/offices/${officeId}/performance?periodInDays=${periodInDays}`)
      .json<GetOfficePerformanceResponse>();

    return { success: true, data: result };
  } catch (err: any) {
    if (err.response) {
      const errorBody = await err.response.json();
      return {
        success: false,
        error: errorBody,
      };
    }

    console.error('Erro inesperado:', err);
    return { success: false, error: 'Erro interno no servidor' };
  }
}
