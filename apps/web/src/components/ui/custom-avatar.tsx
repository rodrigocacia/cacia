type AvatarOnlyNameProps = {
  name: string
  size?: "sm" | "md" | "lg" | "xs"
  className?: string
}

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { formatName } from "@/utils/formatters"

export function CustomAvatar({
  name,
  size = "md",
  className,
}: AvatarOnlyNameProps) {
  const getInitials = (fullName: string) => {
    const formattedName = formatName(fullName)
    const parts = formattedName.trim().split(" ")
    if (parts.length === 1) return parts[0][0]
    return parts[0][0] + parts[parts.length - 1][0]
  }

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-[15px]",
    xs: "w-[100px] h-[100px] text-2xl",
    lg: "w-[140px] h-[140px] text-3xl",
  }

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback className="flex items-center justify-center bg-nevoa font-semibold text-turquesa-profundo uppercase">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
