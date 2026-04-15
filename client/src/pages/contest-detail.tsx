import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Crown } from "lucide-react";
import { format } from "date-fns";

interface ContestDetailProps {
  id: string;
}

interface LeaderboardRow {
  entryId: number;
  userId: number;
  username: string | null;
  currentBalance: number;
  totalBets: number;
  wonBets: number;
  lostBets: number;
  rank: number;
}

interface ContestDetailData {
  id: number;
  name: string;
  description: string | null;
  status: string;
  startingBankroll: number;
  startDate: string;
  endDate: string;
  winnerId: number | null;
  groupId: number;
  leaderboard: LeaderboardRow[];
}

interface ContestBet {
  id: number;
  gameId: string;
  betType: string;
  selection: string;
  odds: number;
  stake: string;
  potentialWin: string;
  status: string;
  result: string | null;
  actualWin: string | null;
  placedAt: string;
}

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function ContestDetail({ id }: ContestDetailProps) {
  const { data, isLoading } = useQuery<ContestDetailData>({
    queryKey: [`/api/contests/${id}`],
  });

  const { data: myBets = [] } = useQuery<ContestBet[]>({
    queryKey: [`/api/contests/${id}/bets`],
  });

  if (isLoading) return <div className="p-8 text-center text-zinc-500">Loading...</div>;
  if (!data) return <div className="p-8 text-center text-zinc-500">Contest not found</div>;

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-5xl">
      <Link href="/contests">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" /> All Contests
        </Button>
      </Link>

      <Card className="bg-zinc-900/60 border-amber-500/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Trophy className="h-6 w-6 text-amber-400" />
                {data.name}
              </CardTitle>
              {data.description && (
                <p className="text-sm text-zinc-400 mt-1">{data.description}</p>
              )}
            </div>
            <Badge
              className={
                data.status === "active"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : data.status === "scheduled"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-zinc-700 text-zinc-400"
              }
            >
              {data.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-[10px] uppercase text-zinc-500">Bankroll</div>
              <div className="font-semibold">{fmt(data.startingBankroll)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-zinc-500">Starts</div>
              <div className="font-semibold">{format(start, "MMM d")}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-zinc-500">Ends</div>
              <div className="font-semibold">{format(end, "MMM d")}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-zinc-500">Entrants</div>
              <div className="font-semibold">{data.leaderboard.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {data.leaderboard.map((row) => {
              const delta = row.currentBalance - data.startingBankroll;
              const isWinner = data.winnerId === row.userId;
              return (
                <div
                  key={row.entryId}
                  className={`flex items-center justify-between py-2 px-3 rounded ${
                    isWinner ? "bg-amber-500/10 border border-amber-500/30" : "bg-zinc-900/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-500 w-6 text-right">#{row.rank}</span>
                    {isWinner && <Crown className="h-4 w-4 text-amber-400" />}
                    <span className="font-medium">{row.username || `User #${row.userId}`}</span>
                    <span className="text-xs text-zinc-500">
                      {row.wonBets}-{row.lostBets}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 tabular-nums">
                    <span className="font-semibold">{fmt(row.currentBalance)}</span>
                    <span
                      className={`text-xs w-16 text-right ${
                        delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-zinc-500"
                      }`}
                    >
                      {delta >= 0 ? "+" : ""}
                      {fmt(delta)}
                    </span>
                  </div>
                </div>
              );
            })}
            {data.leaderboard.length === 0 && (
              <div className="text-center py-6 text-zinc-500 text-sm">No entrants yet.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {myBets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Contest Bets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {myBets.map((bet) => (
                <div
                  key={bet.id}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded bg-zinc-900/40 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge
                      className={`text-[9px] ${
                        bet.result === "win"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : bet.result === "loss"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {bet.status === "settled" ? bet.result?.toUpperCase() : "PENDING"}
                    </Badge>
                    <span className="truncate">{bet.selection}</span>
                  </div>
                  <div className="flex items-center gap-3 tabular-nums text-zinc-500">
                    <span>${bet.stake}</span>
                    <span>{bet.odds > 0 ? `+${bet.odds}` : bet.odds}</span>
                    {bet.status === "settled" && bet.result === "win" && (
                      <span className="text-emerald-400">+${bet.actualWin}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
