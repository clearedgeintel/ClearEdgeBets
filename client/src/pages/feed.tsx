import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pen, Target, Mail, ChevronRight, Clock } from "lucide-react";
import { Link } from "wouter";
import { FadeIn } from "@/components/fade-in";

interface FeedItem {
  id: string;
  type: 'recap' | 'expert_pick' | 'trivia' | 'ranking' | 'newsletter';
  title: string;
  subtitle?: string;
  body?: string;
  author?: string;
  authorAvatar?: string;
  image?: string;
  awayLogo?: string;
  homeLogo?: string;
  meta?: Record<string, any>;
  timestamp: string;
}

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string; route: string }> = {
  recap: { icon: '☕', label: 'Morning Roast', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20', route: '/blog' },
  expert_pick: { icon: '🎯', label: 'Expert Pick', color: 'bg-purple-500/15 text-purple-400 border-purple-500/20', route: '/experts' },
  newsletter: { icon: '📧', label: 'Newsletter', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20', route: '/newsletter' },
  trivia: { icon: '❓', label: 'Trivia', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', route: '/trivia' },
  ranking: { icon: '📊', label: 'Ranking Change', color: 'bg-zinc-800 text-zinc-400 border-zinc-700', route: '/team-power-scores' },
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Feed() {
  const [filter, setFilter] = useState<string>('all');

  const { data: items = [], isLoading } = useQuery<FeedItem[]>({
    queryKey: ['/api/feed'],
    queryFn: () => fetch('/api/feed?limit=40').then(r => r.json()),
    refetchInterval: 60000,
  });

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'recap', label: '☕ Recaps' },
    { key: 'expert_pick', label: '🎯 Picks' },
    { key: 'newsletter', label: '📧 News' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground tracking-tight">Feed</h1>
        <p className="text-xs text-muted-foreground mt-1">Everything happening across ClearEdge Sports</p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex-shrink-0 ${filter === f.key ? 'bg-foreground text-background' : 'bg-zinc-900 text-zinc-400 hover:text-foreground'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Feed items */}
      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No activity yet.</div>
      ) : (
        <div className="space-y-1">
          {filtered.map((item, idx) => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.ranking;
            const prevItem = filtered[idx - 1];
            const showDateSeparator = !prevItem || new Date(item.timestamp).toDateString() !== new Date(prevItem.timestamp).toDateString();

            return (
              <FadeIn key={item.id}>
                {/* Date separator */}
                {showDateSeparator && (
                  <div className="flex items-center gap-2 py-3">
                    <div className="h-px bg-border/30 flex-1" />
                    <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium">
                      {new Date(item.timestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <div className="h-px bg-border/30 flex-1" />
                  </div>
                )}

                <Link href={config.route}>
                  <div className="flex gap-3 p-3 rounded-lg hover:bg-zinc-900/50 transition-colors cursor-pointer group">
                    {/* Left: type icon or image */}
                    <div className="flex-shrink-0 mt-0.5">
                      {item.type === 'recap' && item.image ? (
                        <div className="w-14 h-10 rounded overflow-hidden bg-zinc-900">
                          <img src={item.image} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-sm">
                          {config.icon}
                        </div>
                      )}
                    </div>

                    {/* Center: content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Badge className={`border text-[9px] px-1 py-0 ${config.color}`}>{config.label}</Badge>
                        <span className="text-[10px] text-zinc-600 flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />{timeAgo(item.timestamp)}
                        </span>
                      </div>

                      {item.type === 'recap' ? (
                        <>
                          <h3 className="text-sm font-medium text-foreground group-hover:text-amber-200 transition-colors line-clamp-2 leading-snug">{item.title}</h3>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                            <Pen className="h-2.5 w-2.5 text-amber-400/60" />
                            <span>{item.author}</span>
                            {item.subtitle && <><span>·</span><span>{item.subtitle}</span></>}
                          </div>
                        </>
                      ) : item.type === 'expert_pick' ? (
                        <>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{item.authorAvatar}</span>
                            <span className="text-sm font-medium text-foreground">{item.title}</span>
                            {item.meta?.confidence && (
                              <Badge className={`text-[9px] px-1 py-0 border tabular-nums ${item.meta.confidence >= 75 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>{item.meta.confidence}%</Badge>
                            )}
                            {item.meta?.result && item.meta.result !== 'pending' && (
                              <Badge className={`text-[9px] px-1 py-0 border ${item.meta.result === 'win' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-red-500/15 text-red-400 border-red-500/20'}`}>{item.meta.result.toUpperCase()}</Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{item.subtitle}</p>
                        </>
                      ) : item.type === 'newsletter' ? (
                        <>
                          <h3 className="text-sm font-medium text-foreground group-hover:text-blue-300 transition-colors">{item.title}</h3>
                          {item.subtitle && <p className="text-[11px] text-zinc-500 mt-0.5">{item.subtitle}</p>}
                        </>
                      ) : (
                        <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
                      )}
                    </div>

                    {/* Right: arrow */}
                    <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-zinc-400 flex-shrink-0 mt-1" />
                  </div>
                </Link>
              </FadeIn>
            );
          })}
        </div>
      )}
    </div>
  );
}
