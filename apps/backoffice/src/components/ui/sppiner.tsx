"use client";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-4",
    lg: "w-16 h-16 border-4",
  };

  return (
    <div
      className={`flex items-center justify-center w-full h-80 ${className}`}
    >
      <div
        className={`${sizeClasses[size]} border-t-transparent border-blue-500 rounded-full animate-spin`}
      />
    </div>
  );
}

export function LoadingText() {
  return (
    <div className="flex items-center justify-center w-full h-20">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin" />
        <span className="text-gray-500 text-sm">Carregando...</span>
      </div>
    </div>
  );
}
