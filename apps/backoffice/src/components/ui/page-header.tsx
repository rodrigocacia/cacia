import { ReactNode } from "react";

interface PageHeaderProps {
  /**
   * Mantido por compatibilidade com as telas que ainda o passam. A direção
   * visual 02 não usa ícone no título: a serifa já identifica a página.
   */
  icon?: ReactNode;
  title: string;
  /** Total de registros. Omitir quando a página não tem contagem. */
  count?: number;
  /** Linha de contexto abaixo do título. */
  description?: ReactNode;
  /** Rótulo em caixa alta acima do título. */
  eyebrow?: string;
  /** Botão de ação principal, alinhado à direita. */
  action?: ReactNode;
}

/**
 * Título das páginas: serifa editorial, contexto embaixo, ação à direita.
 */
export function PageHeader({
  title,
  count,
  description,
  eyebrow,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex w-full flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-2">
        {eyebrow && <span className="rotulo">{eyebrow}</span>}

        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-[44px] leading-none text-tinta max-md:text-[34px]">
            {title}
          </h1>

          {count !== undefined && (
            <span className="font-mono text-xs text-tinta-3 tabular">
              {count}
            </span>
          )}
        </div>

        {description && (
          <div className="text-[13.5px] text-tinta-2">{description}</div>
        )}
      </div>

      {action}
    </div>
  );
}
