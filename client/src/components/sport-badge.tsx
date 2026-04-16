interface SportBadgeProps {
  sport: string;
  size?: "xs" | "sm";
  className?: string;
}

const LABELS: Record<string, string> = { mlb: "MLB", nhl: "NHL", nba: "NBA", nfl: "NFL" };

export function SportBadge({ sport, size = "xs", className = "" }: SportBadgeProps) {
  const label = LABELS[sport?.toLowerCase?.() || ""] || sport?.toUpperCase() || "";
  if (!label) return null;
  const sizing = size === "xs" ? "text-[9px] px-1 py-0" : "text-[10px] px-1.5 py-0";
  return (
    <span
      className={`inline-flex items-center rounded border font-bold tracking-wider sport-${sport.toLowerCase()} ${sizing} ${className}`}
    >
      {label}
    </span>
  );
}
