import { Link, useLocation } from "wouter";

const SPORTS = [
  { key: "mlb", label: "MLB", href: "/todays-games" },
  { key: "nhl", label: "NHL", href: "/nhl/games" },
  { key: "nba", label: "NBA", href: "/nba/games" },
] as const;

interface SportSwitcherProps {
  className?: string;
}

export function SportSwitcher({ className = "" }: SportSwitcherProps) {
  const [location] = useLocation();
  const isActive = (href: string) => location === href || location.startsWith(href);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {SPORTS.map(({ key, label, href }) => {
        const active = isActive(href);
        return (
          <Link key={key} href={href}>
            <button
              aria-current={active ? "page" : undefined}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${
                active
                  ? `sport-${key} border`
                  : "text-zinc-500 border-transparent hover:text-zinc-300 hover:border-zinc-700"
              }`}
            >
              {label}
            </button>
          </Link>
        );
      })}
    </div>
  );
}
