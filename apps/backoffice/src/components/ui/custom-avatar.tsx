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

  const getBackgroundColor = (name: string) => {
    const colors = [
      "bg-red-500",
      "bg-green-500",
      "bg-blue-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];
    const hash = Array.from(name).reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0,
    );
    return colors[hash % colors.length];
  };

  const backgroundColor = getBackgroundColor(name);

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-base",
    xs: "w-[100px] h-[100px] text-2xl",
    lg: "w-[140px] h-[140px] text-3xl",
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback
        className={cn(
          "flex items-center justify-center font-semibold text-white",
          backgroundColor,
        )}
      >
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
