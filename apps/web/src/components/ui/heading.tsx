interface HeadingProps {
  title: string
  subtitle: string
}

export function Heading({ title, subtitle }: HeadingProps) {
  return (
    <div className="w-full flex flex-col gap-3.5">
      <h2 className="text-[28px] text-[#3D3D3D] font-semibold">{title}</h2>

      <p className="text-[18px] text-[#BDBDBD] font-semibold">{subtitle}</p>
    </div>
  )
}
