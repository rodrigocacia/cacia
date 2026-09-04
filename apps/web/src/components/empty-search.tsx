import { Icon } from "@iconify/react/dist/iconify.js"

interface EmptySearchProps {
  title: string
  subtitle: string
}

export function EmptySearch({ title, subtitle }: EmptySearchProps) {
  return (
    <div className="w-full flex flex-col items-center justify-center mt-12 gap-3.5">
      <Icon icon="mdi:clipboard-search" className="w-20 h-20 text-[#BBE2E7]" />

      <div className="w-full flex flex-col items-center gap-2.5">
        <h3 className="text-base text-[#BDBDBD] font-semibold">{title}</h3>

        <p className="text-sm text-[#BDBDBD]">{subtitle}</p>
      </div>
    </div>
  )
}
