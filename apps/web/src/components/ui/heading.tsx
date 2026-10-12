interface HeadingProps {
  title: string
  subtitle: string
}

export function Heading({ title, subtitle }: HeadingProps) {
  return (
    <div className="flex w-full flex-col gap-2.5">
      <h2 className="font-display text-[40px] leading-[1.02] text-tinta max-lg:text-[32px]">
        {title}
      </h2>

      <p className="text-[15px] text-tinta-2">{subtitle}</p>
    </div>
  )
}
