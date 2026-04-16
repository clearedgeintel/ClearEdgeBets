import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Plus, Crown } from "lucide-react";
import { format } from "date-fns";

interface Contest {
  id: number;
  groupId: number;
  createdBy: number;
  name: string;
  description: string | null;
  startingBankroll: number;
  startDate: string;
  endDate: string;
  status: "scheduled" | "active" | "completed" | "cancelled";
  winnerId: number | null;
  myEntry: { currentBalance: number; totalBets: number; wonBets: number; lostBets: number } | null;
}

interface Group {
  id: number;
  name: string;
}

function daysBetween(a: Date, b: Date) {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
}

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function Contests() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    groupId: "",
    name: "",
    description: "",
    startingBankroll: 1000,
    startDate: format(new Date(), "yyyy-MM-dd"),
    durationDays: 7,
    sport: "",
    scoringMode: "balance",
    allowParlays: true,
    minStake: "",
    maxStake: "",
    maxEntrants: "",
  });

  const { data: contests = [], isLoading } = useQuery<Contest[]>({
    queryKey: ["/api/contests"],
  });

  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  const createMutation = useMutation({
    mutationFn: async (body: any) => apiRequest("POST", "/api/contests", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/contests"] });
      setCreateOpen(false);
      toast({ title: "Contest created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const joinMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("POST", `/api/contests/${id}/join`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/contests"] });
      toast({ title: "Joined contest" });
    },
  });

  const byStatus = (statuses: string[]) => contests.filter((c) => statuses.includes(c.status));

  const ContestCard = ({ c }: { c: Contest }) => {
    const start = new Date(c.startDate);
    const end = new Date(c.endDate);
    const now = new Date();
    const totalDays = daysBetween(start, end);
    const elapsed = c.status === "scheduled" ? 0 : Math.min(totalDays, daysBetween(start, now));
    const groupName = groups.find((g) => g.id === c.groupId)?.name || `Group #${c.groupId}`;

    return (
      <Card className="play-card bg-zinc-900/50 border-border/30">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400" />
                {c.name}
              </CardTitle>
              <div className="text-xs text-zinc-500 mt-1">{groupName}</div>
            </div>
            <Badge
              className={
                c.status === "active"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : c.status === "scheduled"
                  ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                  : "bg-zinc-700 text-zinc-400"
              }
            >
              {c.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {c.description && <p className="text-sm text-zinc-400">{c.description}</p>}

          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] uppercase text-zinc-500">Bankroll</div>
              <div className="text-sm font-semibold">{fmt(c.startingBankroll)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-zinc-500">Length</div>
              <div className="text-sm font-semibold">{totalDays}d</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-zinc-500">Ends</div>
              <div className="text-sm font-semibold">{format(end, "MMM d")}</div>
            </div>
          </div>

          {c.status === "active" && (
            <div className="text-xs text-zinc-500">
              Day {elapsed} of {totalDays}
            </div>
          )}

          {c.myEntry ? (
            <div className="bg-zinc-800/50 rounded p-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Your balance</span>
                <span className="font-semibold tabular-nums">
                  {fmt(c.myEntry.currentBalance)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Record</span>
                <span>
                  {c.myEntry.wonBets}-{c.myEntry.lostBets} ({c.myEntry.totalBets} bets)
                </span>
              </div>
            </div>
          ) : (
            c.status !== "completed" && (
              <Button
                size="sm"
                className="w-full"
                onClick={() => joinMutation.mutate(c.id)}
                disabled={joinMutation.isPending}
              >
                Join Contest
              </Button>
            )
          )}

          {c.status === "completed" && c.winnerId && (
            <div className="flex items-center gap-2 text-sm text-amber-400">
              <Crown className="h-4 w-4" />
              Winner: User #{c.winnerId}
            </div>
          )}

          <Link href={`/contests/${c.id}`}>
            <Button size="sm" variant="outline" className="w-full">
              View Leaderboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-400" />
            Contests
          </h1>
          <p className="text-sm text-zinc-500">
            Finite group competitions — start with a fixed bankroll, highest balance at end wins.
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="h-4 w-4 mr-2" /> New Contest
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Contest</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Group</Label>
                <Select value={form.groupId} onValueChange={(v) => setForm({ ...form, groupId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {groups.length === 0 && (
                  <p className="text-xs text-zinc-500 mt-1">
                    You need to be in a group.{" "}
                    <Link href="/groups" className="text-amber-400 underline">
                      Create one
                    </Link>
                    .
                  </p>
                )}
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="April Madness"
                />
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Starting Bankroll</Label>
                  <Select
                    value={String(form.startingBankroll)}
                    onValueChange={(v) => setForm({ ...form, startingBankroll: Number(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500">$500</SelectItem>
                      <SelectItem value="1000">$1,000</SelectItem>
                      <SelectItem value="5000">$5,000</SelectItem>
                      <SelectItem value="10000">$10,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Duration</Label>
                  <Select
                    value={String(form.durationDays)}
                    onValueChange={(v) => setForm({ ...form, durationDays: Number(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>

              {/* v2 options */}
              <div className="pt-2 border-t border-border/20 space-y-3">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Contest Rules</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Sport</Label>
                    <Select value={form.sport} onValueChange={(v) => setForm({ ...form, sport: v })}>
                      <SelectTrigger><SelectValue placeholder="All sports" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All sports</SelectItem>
                        <SelectItem value="mlb">MLB</SelectItem>
                        <SelectItem value="nhl">NHL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Winner by</Label>
                    <Select value={form.scoringMode} onValueChange={(v) => setForm({ ...form, scoringMode: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="balance">Highest balance</SelectItem>
                        <SelectItem value="roi">Best ROI</SelectItem>
                        <SelectItem value="win_rate">Best win rate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Allow parlays</Label>
                  <Switch checked={form.allowParlays} onCheckedChange={(v) => setForm({ ...form, allowParlays: v })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Min stake ($)</Label>
                    <Input type="number" placeholder="No min" value={form.minStake} onChange={(e) => setForm({ ...form, minStake: e.target.value })} />
                  </div>
                  <div>
                    <Label>Max stake ($)</Label>
                    <Input type="number" placeholder="No max" value={form.maxStake} onChange={(e) => setForm({ ...form, maxStake: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Max entrants</Label>
                  <Input type="number" placeholder="Unlimited" value={form.maxEntrants} onChange={(e) => setForm({ ...form, maxEntrants: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!form.groupId || !form.name || createMutation.isPending}
                onClick={() =>
                  createMutation.mutate({
                    groupId: Number(form.groupId),
                    name: form.name,
                    description: form.description || undefined,
                    startingBankroll: form.startingBankroll,
                    startDate: form.startDate,
                    durationDays: form.durationDays,
                    sport: form.sport || undefined,
                    scoringMode: form.scoringMode,
                    allowParlays: form.allowParlays,
                    minStake: form.minStake ? Number(form.minStake) : undefined,
                    maxStake: form.maxStake ? Number(form.maxStake) : undefined,
                    maxEntrants: form.maxEntrants ? Number(form.maxEntrants) : undefined,
                  })
                }
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-zinc-900/50 border-border/30 animate-pulse">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="h-5 w-36 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted/70 rounded" />
                  </div>
                  <div className="h-5 w-16 bg-muted rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((k) => (
                    <div key={k} className="space-y-1">
                      <div className="h-2 w-12 bg-muted/70 rounded mx-auto" />
                      <div className="h-4 w-14 bg-muted rounded mx-auto" />
                    </div>
                  ))}
                </div>
                <div className="h-12 bg-muted/60 rounded" />
                <div className="h-8 bg-muted/60 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : contests.length === 0 ? (
        <Card className="bg-zinc-900/40 border-dashed">
          <CardContent className="py-12 text-center text-zinc-500">
            <Trophy className="h-10 w-10 mx-auto mb-3 text-zinc-700" />
            <p>No contests yet. Create one for your group to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active ({byStatus(["active"]).length})</TabsTrigger>
            <TabsTrigger value="scheduled">Upcoming ({byStatus(["scheduled"]).length})</TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({byStatus(["completed"]).length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
            {byStatus(["active"]).map((c) => (
              <ContestCard key={c.id} c={c} />
            ))}
          </TabsContent>
          <TabsContent value="scheduled" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
            {byStatus(["scheduled"]).map((c) => (
              <ContestCard key={c.id} c={c} />
            ))}
          </TabsContent>
          <TabsContent value="completed" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
            {byStatus(["completed"]).map((c) => (
              <ContestCard key={c.id} c={c} />
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
