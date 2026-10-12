type AvatarOnlyNameProps = {
  name: string;
  size?: "sm" | "md" | "lg" | "xs";
  className?: string;
};

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function CustomAvatar({
  name,
  size = "md",
  className,
}: AvatarOnlyNameProps) {
  const getInitials = (fullName: string) => {
    if (!fullName || fullName.trim().length === 0) return "?";
    const parts = fullName
      .trim()
      .split(" ")
      .filter((part) => part.length > 0);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-[13.5px]",
    xs: "w-[100px] h-[100px] text-2xl",
    lg: "w-[140px] h-[140px] text-3xl",
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback className="flex items-center justify-center bg-nevoa font-semibold text-turquesa-profundo uppercase">
        {getInitials(name ?? "")}
      </AvatarFallback>
    </Avatar>
  );
}
