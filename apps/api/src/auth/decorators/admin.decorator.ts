import { SetMetadata } from '@nestjs/common';

export const EXIGE_ADMIN = 'auth:admin-da-plataforma';

/**
 * Exige papel de administrador GLOBAL — o operador da plataforma.
 *
 * Não confundir com `@RequerPapel(Role.ADMIN)`, que trata do papel dentro de
 * um escritório. Aqui a rota atravessa todos os escritórios, e é por isso que
 * ela não pode depender do cabeçalho de tenant.
 */
export const AdminDaPlataforma = () => SetMetadata(EXIGE_ADMIN, true);
