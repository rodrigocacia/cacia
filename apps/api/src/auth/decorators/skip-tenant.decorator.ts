import { SetMetadata } from '@nestjs/common';

export const SKIP_TENANT = 'auth:sem-tenant';

/**
 * Dispensa o cabeçalho x-office-id.
 *
 * Só para rotas que legitimamente não pertencem a um escritório: perfil do
 * usuário, listagem dos escritórios dele, catálogo de planos. Se a rota lê ou
 * escreve qualquer dado de escritório, ela NÃO pode usar este decorator.
 */
export const SkipTenant = () => SetMetadata(SKIP_TENANT, true);
