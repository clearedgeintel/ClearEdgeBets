import { Link, useLocation } from "wouter";
import { Home, Newspaper, Target, Trophy, Rss } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home", match: (p: string) => p === "/" },
  { href: "/feed", icon: Rss, label: "Feed", match: (p: string) => p.startsWith("/feed") },
  { href: "/virtual-sportsbook", icon: Trophy, label: "Play", match: (p: string) => p === "/virtual-sportsbook" || p.startsWith("/contests") || p === "/groups" || p === "/weekly-leaderboard", featured: true },
  { href: "/experts", icon: Target, label: "Experts", match: (p: string) => p.startsWith("/experts") },
  { href: "/blog", icon: Newspaper, label: "Roast", match: (p: string) => p.startsWith("/blog") },
];

export default function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { data: contests = [] } = useQuery<Array<{ status: string; myEntry: unknown }>>({
    queryKey: ["/api/contests"],
    queryFn: () => fetch("/api/contests", { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
    enabled: !!user,
    staleTime: 60_000,
  });
  const activeCount = (Array.isArray(contests) ? contests : []).filter((c) => c.status === "active" && c.myEntry).length;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111113]/95 backdrop-blur-md border-t border-border/30">
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map(({ href, icon: Icon, label, match, featured }) => {
          const active = match(location);
          const showBadge = featured && activeCount > 0;
          return (
            <Link key={href} href={href}>
              <button className={`relative flex flex-col items-center justify-center gap-0.5 w-16 py-1 transition-colors ${active ? 'text-amber-400' : featured ? 'text-amber-300/80' : 'text-zinc-500'}`}>
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {showBadge && (
                    <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-amber-500 text-[9px] font-bold text-black flex items-center justify-center tabular-nums">
                      {activeCount > 9 ? '9+' : activeCount}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-medium">{label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
