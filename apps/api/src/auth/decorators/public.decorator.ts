import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'auth:publica';

/** Dispensa autenticação. Use apenas em login, cadastro e recuperação de senha. */
export const Public = () => SetMetadata(IS_PUBLIC, true);
