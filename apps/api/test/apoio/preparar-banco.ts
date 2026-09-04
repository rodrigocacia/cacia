import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import './ambiente';

/**
 * Aplica as migrations no schema de teste antes da suíte.
 *
 * Roda uma vez por execução, no processo principal do Vitest. O schema é o
 * `e2e` (ver ambiente.ts) e não o `public`: assim rodar os testes não apaga o
 * banco de desenvolvimento de quem está com a aplicação aberta ao lado.
 */
export default function preparar(): void {
  const pacote = resolve(__dirname, '../../../../packages/database');
  const prisma = resolve(pacote, 'node_modules/prisma/build/index.js');

  if (!existsSync(prisma)) {
    throw new Error(
      `Prisma CLI não encontrada em ${prisma}. Rode pnpm install antes.`,
    );
  }

  // Executado pelo próprio Node, e não por `npx`: no Windows, chamar um `.cmd`
  // pelo execFile falha com EINVAL desde o Node 20, e a alternativa
  // (`shell: true`) traz o custo e as regras de escape do interpretador.
  execFileSync(process.execPath, [prisma, 'migrate', 'deploy'], {
    cwd: pacote,
    stdio: 'inherit',
    env: { ...process.env },
  });
}
