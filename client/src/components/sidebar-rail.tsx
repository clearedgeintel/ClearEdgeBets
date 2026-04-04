/**
 * Collapsed sidebar rail — shows only icons.
 * Visible when sidebar is collapsed (w-16). Hidden when expanded.
 */
import { Link, useLocation } from "wouter";
import {
  Home, Target, Calendar, BarChart3, Trophy, HelpCircle,
  FileText, Newspaper, Rss, CircleDot, Pen
} from "lucide-react";

const RAIL_ITEMS = [
  { href: "/feed", icon: Rss, label: "Feed" },
  { href: "/blog", icon: Newspaper, label: "Roast" },
  { href: "/experts", icon: Target, label: "Experts" },
  { href: "/todays-games", icon: Calendar, label: "Games" },
  { href: "/team-power-scores", icon: BarChart3, label: "Rankings" },
  { href: "/player-rankings", icon: Trophy, label: "Players" },
  { href: "/trivia", icon: HelpCircle, label: "Trivia" },
  { href: "/newsletter", icon: FileText, label: "Newsletter" },
  { href: "/editors-desk", icon: Pen, label: "Editor's Desk" },
  { href: "/virtual-sportsbook", icon: CircleDot, label: "Play" },
];

export default function SidebarRail() {
  const [location] = useLocation();

  return (
    <div className="flex flex-col items-center py-4 gap-1 w-16">
      {/* Logo */}
      <Link href="/">
        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 cursor-pointer hover:bg-amber-500/20 transition-colors">
          <Home className="h-4 w-4 text-amber-400" />
        </div>
      </Link>

      {/* Nav icons */}
      {RAIL_ITEMS.map(({ href, icon: Icon, label }) => {
        const active = href === "/" ? location === "/" : location.startsWith(href);
        return (
          <Link key={href} href={href}>
            <button
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors relative group/icon ${
                active ? 'bg-amber-500/15 text-amber-400' : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`}
              title={label}
            >
              <Icon className="h-4.5 w-4.5" />
              {/* Tooltip */}
              <span className="absolute left-12 px-2 py-1 bg-zinc-900 border border-border/30 rounded text-[10px] text-foreground whitespace-nowrap opacity-0 group-hover/icon:opacity-100 pointer-events-none transition-opacity z-50">
                {label}
              </span>
            </button>
          </Link>
        );
      })}
    </div>
  );
}
