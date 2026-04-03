import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Link } from "wouter";
import {
  Play,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Brain,
  TrendingUp,
  Zap,
  BarChart3,
  CalendarCheck,
  AlertTriangle,
} from "lucide-react";

interface ScheduledTask {
  name: string;
  schedule: string;
  isRunning: boolean;
  nextRun?: string;
}

interface APIStats {
  totalCalls: number;
  last24h: number;
  errorRate: number;
  avgResponseMs: number;
  byService: Record<string, { calls: number; errors: number; avgMs: number }>;
}

const TASK_META: Record<string, { label: string; description: string; triggerKey: string; icon: any; color: string }> = {
  'daily-picks-generation': {
    label: 'Generate Daily Picks',
    description: 'AI analyzes all games and generates game predictions',
    triggerKey: 'daily-picks',
    icon: Brain,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  'daily-ai-ticket': {
    label: 'Generate AI Ticket',
    description: 'Creates daily AI analysis ticket with market insights',
    triggerKey: 'daily-ticket',
    icon: Zap,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  'weekly-summary': {
    label: 'Weekly Summary',
    description: 'Generates comprehensive weekly performance report',
    triggerKey: 'weekly-summary',
    icon: BarChart3,
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  'auto-bet-settlement': {
    label: 'Settle Bets',
    description: 'Syncs live scores and settles pending bets',
    triggerKey: 'settle-bets',
    icon: CalendarCheck,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  'odds-snapshot': {
    label: 'Odds Snapshot',
    description: 'Records current odds for line movement tracking',
    triggerKey: 'odds-snapshot',
    icon: TrendingUp,
    color: 'bg-sky-100 text-sky-800 border-sky-200',
  },
};

const SCHEDULE_LABELS: Record<string, string> = {
  '0 0 8 * * *': '8:00 AM CT daily',
  '0 0 9 * * *': '9:00 AM CT daily',
  '0 0 9 * * 1': 'Mondays 9:00 AM CT',
  '0 */15 * * * *': 'Every 15 minutes',
  '0 */30 * * * *': 'Every 30 minutes',
};

const QUICK_ACTIONS = [
  { label: 'Regenerate AI Summaries', endpoint: '/api/admin/generate-ai-summaries', method: 'POST', description: 'Re-analyze all games with fresh AI summaries', icon: Brain, color: 'bg-violet-600 hover:bg-violet-700' },
  { label: 'Sync Live Games', endpoint: '/api/admin/sync-live-games', method: 'POST', description: 'Pull latest scores and game statuses', icon: RefreshCw, color: 'bg-emerald-600 hover:bg-emerald-700' },
];

export default function AdminOperations() {
  const { toast } = useToast();
  const [triggeringTask, setTriggeringTask] = useState<string | null>(null);

  const { data: tasks = [], refetch: refetchTasks } = useQuery<ScheduledTask[]>({
    queryKey: ['/api/admin/scheduler-status'],
    queryFn: () => fetch('/api/admin/scheduler-status', { credentials: 'include' }).then(r => r.json()),
    refetchInterval: 10000,
  });

  const { data: apiStats } = useQuery<APIStats>({
    queryKey: ['/api/admin/api-stats'],
    queryFn: () => fetch('/api/admin/api-stats', { credentials: 'include' }).then(r => r.json()),
    refetchInterval: 15000,
  });

  const triggerMutation = useMutation({
    mutationFn: async (task: string) => {
      setTriggeringTask(task);
      const resp = await fetch('/api/admin/trigger-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ task }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed');
      }
      return resp.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Task triggered', description: `${data.task} completed at ${new Date(data.triggeredAt).toLocaleTimeString()}` });
      setTriggeringTask(null);
      refetchTasks();
    },
    onError: (err: any) => {
      toast({ title: 'Task failed', description: err.message, variant: 'destructive' });
      setTriggeringTask(null);
    },
  });

  const quickActionMutation = useMutation({
    mutationFn: async (action: typeof QUICK_ACTIONS[0]) => {
      const resp = await fetch(action.endpoint, {
        method: action.method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return resp.json();
    },
    onSuccess: (_, action) => {
      toast({ title: 'Action completed', description: action.label });
    },
    onError: (err: any, action) => {
      toast({ title: `${action.label} failed`, description: err.message, variant: 'destructive' });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              Operations Center
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Scheduled tasks, manual triggers, and system monitoring
            </p>
          </div>
          <Link href="/admin/api-playground">
            <Button variant="outline" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              API Playground
            </Button>
          </Link>
        </div>

        {/* API Health Summary */}
        {apiStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{apiStats.totalCalls}</div>
                <div className="text-sm text-muted-foreground">Total API Calls</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{apiStats.last24h}</div>
                <div className="text-sm text-muted-foreground">Last 24h</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${apiStats.errorRate > 20 ? 'text-red-600' : apiStats.errorRate > 5 ? 'text-orange-600' : 'text-green-600'}`}>
                  {apiStats.errorRate}%
                </div>
                <div className="text-sm text-muted-foreground">Error Rate</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{apiStats.avgResponseMs}ms</div>
                <div className="text-sm text-muted-foreground">Avg Response</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Service Breakdown */}
        {apiStats && Object.keys(apiStats.byService).length > 0 && (
          <Card className="mb-8">
            <CardHeader><CardTitle className="text-lg">External API Services</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(apiStats.byService).map(([svc, stats]) => (
                  <div key={svc} className="p-3 border rounded-lg">
                    <div className="font-medium text-sm">{svc}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {stats.calls} calls · {stats.errors} errors · {stats.avgMs}ms avg
                    </div>
                    {stats.errors > 0 && (
                      <Badge className="bg-red-100 text-red-800 text-xs mt-1">{Math.round((stats.errors / stats.calls) * 100)}% error rate</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scheduled Tasks */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Scheduled Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.map((task) => {
                const meta = TASK_META[task.name];
                if (!meta) return null;
                const Icon = meta.icon;
                const isTriggering = triggeringTask === meta.triggerKey;

                return (
                  <div key={task.name} className={`flex items-center justify-between p-4 border rounded-lg ${meta.color}`}>
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <div>
                        <div className="font-medium text-sm">{meta.label}</div>
                        <div className="text-xs opacity-75">{meta.description}</div>
                        <div className="text-xs opacity-60 mt-1">
                          Schedule: {SCHEDULE_LABELS[task.schedule] || task.schedule}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {task.isRunning ? (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Running
                        </Badge>
                      ) : (
                        <Badge className="bg-white/50 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" /> Idle
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/80"
                        disabled={isTriggering || task.isRunning}
                        onClick={() => triggerMutation.mutate(meta.triggerKey)}
                      >
                        {isTriggering ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        <span className="ml-1">Run Now</span>
                      </Button>
                    </div>
                  </div>
                );
              })}

              {tasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  <p>Could not load scheduler status. Are you logged in as admin?</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.endpoint}
                    className={`${action.color} text-white justify-start h-auto py-3 px-4`}
                    disabled={quickActionMutation.isPending}
                    onClick={() => quickActionMutation.mutate(action)}
                  >
                    <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">{action.label}</div>
                      <div className="text-xs opacity-80">{action.description}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
