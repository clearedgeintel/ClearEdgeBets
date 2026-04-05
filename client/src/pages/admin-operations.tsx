import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Play, RefreshCw, Clock, CheckCircle, Activity, Brain, TrendingUp,
  Zap, BarChart3, CalendarCheck, AlertTriangle, Target, Newspaper, Trophy,
} from "lucide-react";

interface ScheduledTask {
  name: string;
  schedule: string;
  isRunning: boolean;
}

interface APIStats {
  totalCalls: number;
  last24h: number;
  errorRate: number;
  avgResponseMs: number;
  byService: Record<string, { calls: number; errors: number; avgMs: number }>;
}

// Complete task registry — matches scheduler + trigger endpoint
const ALL_TASKS = [
  { name: 'daily-picks-generation', triggerKey: 'daily-picks', label: 'Daily Picks', description: 'AI generates game predictions', schedule: '8:00 AM CT', icon: Brain, group: 'morning' },
  { name: 'expert-picks-generation', triggerKey: 'expert-picks', label: 'Expert Panel Picks', description: '5 experts analyze the slate', schedule: '8:30 AM CT', icon: Target, group: 'morning' },
  { name: 'daily-ai-ticket', triggerKey: 'daily-ticket', label: 'AI Daily Ticket', description: 'Market insights analysis', schedule: '9:00 AM CT', icon: Zap, group: 'morning' },
  { name: 'daily-newsletter', triggerKey: 'newsletter', label: 'Daily Newsletter', description: 'Generate + send to subscribers', schedule: '9:15 AM CT', icon: Newspaper, group: 'morning' },
  { name: 'weekly-summary', triggerKey: 'weekly-summary', label: 'Weekly Summary', description: 'Performance report', schedule: 'Mon 9:00 AM CT', icon: BarChart3, group: 'morning' },
  { name: 'auto-bet-settlement', triggerKey: 'settle-bets', label: 'Settle Predictions', description: 'Sync scores, settle bets', schedule: 'Every 15 min', icon: CalendarCheck, group: 'recurring' },
  { name: 'expert-pick-grading', triggerKey: 'expert-grading', label: 'Grade Expert Picks', description: 'Auto-grade completed picks', schedule: 'Every 30 min', icon: Trophy, group: 'recurring' },
  { name: 'auto-morning-roast', triggerKey: 'morning-roast', label: 'Morning Roast', description: 'Generate recaps for finished games', schedule: 'Every 15 min', icon: Newspaper, group: 'recurring' },
  { name: 'odds-snapshot', triggerKey: 'odds-snapshot', label: 'Odds Snapshot', description: 'Record line movement data', schedule: 'Every 30 min', icon: TrendingUp, group: 'recurring' },
];

export default function AdminOperations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [triggeringTask, setTriggeringTask] = useState<string | null>(null);

  const { data: liveTasks = [] } = useQuery<ScheduledTask[]>({
    queryKey: ['/api/admin/scheduler-status'],
    queryFn: () => fetch('/api/admin/scheduler-status', { credentials: 'include' }).then(r => r.json()),
    refetchInterval: 5000,
  });

  const { data: apiStats } = useQuery<APIStats>({
    queryKey: ['/api/admin/api-stats'],
    queryFn: () => fetch('/api/admin/api-stats', { credentials: 'include' }).then(r => r.json()),
    refetchInterval: 15000,
  });

  const triggerMutation = useMutation({
    mutationFn: async (triggerKey: string) => {
      setTriggeringTask(triggerKey);
      const resp = await fetch('/api/admin/trigger-task', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ task: triggerKey }),
      });
      if (!resp.ok) throw new Error((await resp.json()).error || 'Failed');
      return resp.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Task completed', description: `${data.task} finished` });
      setTriggeringTask(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/scheduler-status'] });
    },
    onError: (err: any) => {
      toast({ title: 'Task failed', description: err.message, variant: 'destructive' });
      setTriggeringTask(null);
    },
  });

  // Merge live status with our task registry
  const getTaskStatus = (name: string) => liveTasks.find(t => t.name === name);

  const morningTasks = ALL_TASKS.filter(t => t.group === 'morning');
  const recurringTasks = ALL_TASKS.filter(t => t.group === 'recurring');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-6 w-6 text-amber-400" />
            Operations Center
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Automated tasks, manual triggers, system health</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/api-log">
            <Button variant="outline" size="sm" className="text-xs">API Log</Button>
          </Link>
          <Link href="/admin/api-playground">
            <Button variant="outline" size="sm" className="text-xs">Playground</Button>
          </Link>
        </div>
      </div>

      {/* API Health Summary */}
      {apiStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          <Card className="border-border/30"><CardContent className="p-3 text-center">
            <div className="text-xl font-bold tabular-nums">{apiStats.totalCalls}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">API Calls</div>
          </CardContent></Card>
          <Card className="border-border/30"><CardContent className="p-3 text-center">
            <div className="text-xl font-bold tabular-nums">{apiStats.last24h}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Last 24h</div>
          </CardContent></Card>
          <Card className="border-border/30"><CardContent className="p-3 text-center">
            <div className={`text-xl font-bold tabular-nums ${apiStats.errorRate > 10 ? 'text-red-400' : 'text-emerald-400'}`}>{apiStats.errorRate}%</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Error Rate</div>
          </CardContent></Card>
          <Card className="border-border/30"><CardContent className="p-3 text-center">
            <div className="text-xl font-bold tabular-nums">{apiStats.avgResponseMs}ms</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Response</div>
          </CardContent></Card>
        </div>
      )}

      {/* Morning Schedule */}
      <Card className="mb-4 border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            Daily Schedule (Central Time)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/10">
            {morningTasks.map(task => {
              const live = getTaskStatus(task.name);
              const isRunning = live?.isRunning || triggeringTask === task.triggerKey;
              const Icon = task.icon;
              return (
                <div key={task.name} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{task.label}</div>
                      <div className="text-[10px] text-muted-foreground">{task.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] tabular-nums">{task.schedule}</Badge>
                    {isRunning ? (
                      <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[10px]">
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />Running
                      </Badge>
                    ) : live ? (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px]">
                        <CheckCircle className="h-3 w-3 mr-1" />Ready
                      </Badge>
                    ) : (
                      <Badge className="bg-zinc-800 text-zinc-500 border border-zinc-700 text-[10px]">—</Badge>
                    )}
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" disabled={isRunning}
                      onClick={() => triggerMutation.mutate(task.triggerKey)}>
                      <Play className="h-3 w-3 mr-1" />Run
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recurring Tasks */}
      <Card className="mb-6 border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-blue-400" />
            Recurring Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/10">
            {recurringTasks.map(task => {
              const live = getTaskStatus(task.name);
              const isRunning = live?.isRunning || triggeringTask === task.triggerKey;
              const Icon = task.icon;
              return (
                <div key={task.name} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{task.label}</div>
                      <div className="text-[10px] text-muted-foreground">{task.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] tabular-nums">{task.schedule}</Badge>
                    {isRunning ? (
                      <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[10px]">
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />Running
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px]">
                        <CheckCircle className="h-3 w-3 mr-1" />Active
                      </Badge>
                    )}
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" disabled={isRunning}
                      onClick={() => triggerMutation.mutate(task.triggerKey)}>
                      <Play className="h-3 w-3 mr-1" />Run
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Reference */}
      <Card className="border-border/30 bg-zinc-900/30">
        <CardContent className="p-4">
          <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Daily Timeline</h4>
          <div className="text-xs text-zinc-500 space-y-1 font-mono">
            <div><span className="text-zinc-400">08:00</span> Daily AI picks generated</div>
            <div><span className="text-zinc-400">08:30</span> Expert panel analyzes slate (5 experts × 2-3 picks each)</div>
            <div><span className="text-zinc-400">09:00</span> AI daily ticket published</div>
            <div><span className="text-zinc-400">09:00</span> Weekly summary (Mondays only)</div>
            <div className="border-t border-border/20 pt-1 mt-1">
              <span className="text-zinc-400">:00 :15 :30 :45</span> Settle predictions + grade expert picks + auto Morning Roast
            </div>
            <div><span className="text-zinc-400">:00 :30</span> Odds snapshot for line movement</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
