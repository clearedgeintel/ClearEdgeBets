import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExpertAvatar } from "@/components/expert-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Swords, TrendingUp, Target } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface Expert {
  id: string;
  name: string;
  avatar: string;
  riskLevel: string;
  record: { wins: number; losses: number; roi: number };
}

interface UserPerf {
  totalBets: number;
  totalStaked: number;
  totalWinnings: number;
  netProfit: number;
  winRate: number;
  roi: number;
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <div className="text-[10px] uppercase text-zinc-500 tracking-wider">{label}</div>
      <div className={`text-lg font-bold tabular-nums ${highlight ? "text-amber-400" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

export default function H2H() {
  const { user } = useAuth();

  const { data: experts = [], isLoading: expertsLoading } = useQuery<Expert[]>({
    queryKey: ["/api/experts"],
    queryFn: () => fetch("/api/experts").then((r) => r.json()),
  });

  const { data: userPerf, isLoading: perfLoading } = useQuery<UserPerf>({
    queryKey: ["/api/virtual/performance"],
    queryFn: () => fetch("/api/virtual/performance", { credentials: "include" }).then((r) => r.json()),
    enabled: !!user,
  });

  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

  const safeExperts = Array.isArray(experts) ? experts : [];
  const isLoading = expertsLoading || perfLoading;

  const userWins = userPerf?.totalWinnings ? Math.round(userPerf.totalWinnings) : 0;
  const userWinRate = userPerf?.winRate ?? 0;
  const userROI = userPerf?.roi ?? 0;
  const userBets = userPerf?.totalBets ?? 0;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Swords className="h-6 w-6 text-amber-400" />
          Beat the Experts
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Compare your prediction record against our 5 AI analysts. Think you can do better? Challenge them.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {safeExperts.map((expert) => {
            const total = expert.record.wins + expert.record.losses;
            const expertWinRate = total > 0 ? (expert.record.wins / total) * 100 : 0;
            const expertROI = expert.record.roi ?? 0;

            const userAhead = userWinRate > expertWinRate;
            const tied = Math.abs(userWinRate - expertWinRate) < 0.5;

            return (
              <Card key={expert.id} className="play-card bg-zinc-900/50 border-border/30 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* You */}
                    <div className={`flex-1 p-4 ${userAhead && !tied ? "bg-amber-500/5" : ""}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-8 w-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-sm font-bold text-amber-300">
                          {user?.username?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{user?.username || "You"}</div>
                          <div className="text-[10px] text-zinc-500">Your record</div>
                        </div>
                        {userAhead && !tied && (
                          <Badge className="ml-auto bg-amber-500/20 text-amber-300 border-amber-500/40 text-[9px]">AHEAD</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <StatBox label="Win %" value={`${userWinRate.toFixed(1)}%`} highlight={userAhead && !tied} />
                        <StatBox label="ROI" value={`${userROI >= 0 ? "+" : ""}${userROI.toFixed(1)}%`} />
                        <StatBox label="Bets" value={String(userBets)} />
                      </div>
                    </div>

                    {/* VS divider */}
                    <div className="flex items-center justify-center px-3 py-2 sm:py-0 bg-zinc-950/40">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-bold text-zinc-600">VS</span>
                        {tied ? (
                          <Badge className="bg-zinc-700 text-zinc-400 text-[9px]">TIED</Badge>
                        ) : null}
                      </div>
                    </div>

                    {/* Expert */}
                    <div className={`flex-1 p-4 ${!userAhead && !tied ? "bg-blue-500/5" : ""}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <ExpertAvatar avatar={expert.avatar} name={expert.name} size="sm" className="h-8 w-8" />
                        <div>
                          <div className="text-sm font-semibold">{expert.name}</div>
                          <div className="text-[10px] text-zinc-500">{expert.riskLevel}</div>
                        </div>
                        {!userAhead && !tied && (
                          <Badge className="ml-auto bg-blue-500/20 text-blue-300 border-blue-500/40 text-[9px]">AHEAD</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <StatBox label="Win %" value={`${expertWinRate.toFixed(1)}%`} highlight={!userAhead && !tied} />
                        <StatBox label="ROI" value={`${expertROI >= 0 ? "+" : ""}${expertROI.toFixed(1)}%`} />
                        <StatBox label="Record" value={`${expert.record.wins}-${expert.record.losses}`} />
                      </div>
                    </div>
                  </div>

                  {/* Challenge CTA */}
                  <div className="border-t border-border/20 px-4 py-2.5 flex items-center justify-between bg-zinc-950/30">
                    <span className="text-xs text-zinc-500">
                      {userAhead && !tied
                        ? `You're beating ${expert.name.split(" ").pop()} — keep it up!`
                        : tied
                        ? "Dead even — settle it with a contest."
                        : `${expert.name.split(" ").pop()} has the edge. Can you flip it?`}
                    </span>
                    <Link href={`/contests?challenge=${expert.id}`}>
                      <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-sm h-7">
                        <Trophy className="h-3 w-3 mr-1" />
                        Challenge
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="text-center text-xs text-zinc-600 pt-4">
        Stats reflect your all-time virtual prediction record vs each expert's tracked picks.
      </div>
    </div>
  );
}
