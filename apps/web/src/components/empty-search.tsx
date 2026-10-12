import { SearchX } from "lucide-react"

interface EmptySearchProps {
  title: string
  subtitle: string
}

export function EmptySearch({ title, subtitle }: EmptySearchProps) {
  return (
    <div className="mt-12 flex w-full flex-col items-center justify-center gap-3 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-papel-2 text-tinta-3">
        <SearchX size={20} strokeWidth={1.7} aria-hidden />
      </span>

      <div className="flex w-full flex-col items-center gap-1">
        <h3 className="text-[14.5px] font-semibold text-tinta">{title}</h3>

        <p className="text-[13.5px] text-tinta-3">{subtitle}</p>
      </div>
    </div>
  )
}
