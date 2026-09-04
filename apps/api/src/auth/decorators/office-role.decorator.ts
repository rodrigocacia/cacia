import { SetMetadata } from '@nestjs/common';
import type { Role } from '@cacia/database';

export const PAPEL_EXIGIDO = 'auth:papel-escritorio';

/**
 * Exige um papel mínimo dentro do escritório da requisição.
 *
 * O papel é por escritório, não global: a mesma pessoa pode ser administradora
 * de um e usuária comum de outro.
 */
export const RequerPapel = (...papeis: Role[]) =>
  SetMetadata(PAPEL_EXIGIDO, papeis);
