import { Link, useLocation } from "wouter";
import { Home, Calendar, Newspaper, Trophy, Target } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/experts", icon: Target, label: "Experts" },
  { href: "/todays-games", icon: Calendar, label: "Games" },
  { href: "/blog", icon: Newspaper, label: "Roast" },
  { href: "/player-rankings", icon: Trophy, label: "Players" },
];

export default function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0c]/95 backdrop-blur-md border-t border-border/30">
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link key={href} href={href}>
              <button className={`flex flex-col items-center justify-center gap-0.5 w-16 py-1 transition-colors ${active ? 'text-emerald-400' : 'text-zinc-500'}`}>
                <Icon className="h-5 w-5" />
                <span className="text-[9px] font-medium">{label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
