import type { Request } from 'express';
import type { Role } from '@cacia/database';

export interface UsuarioAutenticado {
  userId: string;
  email: string;
}

export interface RequisicaoAutenticada extends Request {
  user?: UsuarioAutenticado;
  /** Preenchido pelo TenantGuard depois de validar o vínculo */
  officeId?: string;
  /** Papel do usuário NESTE escritório — pode diferir entre escritórios */
  officeRole?: Role;
}
