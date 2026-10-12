import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface HeaderToGoBackProps {
  link: string;
  /** Para onde o botão leva, escrito por extenso ao lado da seta. */
  label?: string;
}

/**
 * Linha de volta das fichas: um botão contornado com a seta e o nome da
 * lista de onde se veio. Sem faixa colorida nem sombra — o painel de papel
 * já separa a página do resto.
 */
export function HeaderToGoBack({
  link,
  label = "Voltar",
}: HeaderToGoBackProps) {
  return (
    <div className="mb-5 flex items-center">
      <Link
        href={link}
        className="group inline-flex items-center gap-3 rounded-[9px] text-[13.5px] text-tinta-2 transition-colors hover:text-tinta focus-visible:ring-[3px] focus-visible:ring-nevoa-2 focus-visible:outline-none"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-filete-forte bg-white text-tinta transition-colors group-hover:bg-gray-100">
          <ArrowLeft size={16} strokeWidth={1.7} aria-hidden />
        </span>
        {label}
      </Link>
    </div>
  );
}
