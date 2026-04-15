import { useState } from "react";

interface ExpertAvatarProps {
  avatar: string;
  fallback?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "h-6 w-6 text-sm",
  md: "h-10 w-10 text-xl",
  lg: "h-14 w-14 text-3xl",
} as const;

export function ExpertAvatar({ avatar, fallback = "🎯", name, size = "md", className = "" }: ExpertAvatarProps) {
  const [errored, setErrored] = useState(false);
  const cls = `${SIZES[size]} ${className} inline-flex items-center justify-center`;
  const isUrl = typeof avatar === "string" && (avatar.startsWith("/") || avatar.startsWith("http"));

  if (isUrl && !errored) {
    return (
      <img
        src={avatar}
        alt={name || ""}
        className={`${cls} rounded-full object-cover ring-1 ring-amber-500/20 bg-zinc-900`}
        onError={() => setErrored(true)}
      />
    );
  }
  return <span className={`${cls} select-none`} aria-hidden={!name}>{isUrl ? fallback : avatar || fallback}</span>;
}
