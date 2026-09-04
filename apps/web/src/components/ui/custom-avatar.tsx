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

  const getBackgroundColor = (name: string) => {
    const colors = [
      "bg-[#348C98]",
      "bg-[#3BAB93]",
      "bg-[#3B59AB]",
      "bg-[#91AB3B]",
      "bg-[#AB483B]",
      "bg-[#3B9DAB]",
    ]
    const hash = Array.from(name).reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0
    )
    return colors[hash % colors.length]
  }

  const backgroundColor = getBackgroundColor(name)

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-base",
    xs: "w-[100px] h-[100px] text-2xl",
    lg: "w-[140px] h-[140px] text-3xl",
  }

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback
        className={cn(
          "flex items-center justify-center font-semibold text-white",
          backgroundColor
        )}
      >
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
