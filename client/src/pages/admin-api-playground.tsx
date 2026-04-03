import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Activity, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";

interface APITestResult {
  name: string;
  endpoint: string;
  status: "idle" | "loading" | "success" | "error";
  responseTime?: number;
  statusCode?: number;
  itemCount?: number;
  error?: string;
  preview?: string;
}

const API_ENDPOINTS: { name: string; endpoint: string; description: string; category: string }[] = [
  // Game Data
  { name: "Today's Games (full)", endpoint: "/api/games", description: "MLB games with odds, weather, park factors, AI analysis", category: "Game Data" },
  { name: "MLB Injuries", endpoint: "/api/mlb/injuries", description: "Current MLB injury report", category: "Game Data" },
  { name: "Weather Summary", endpoint: "/api/weather/summary", description: "Weather for all today's games", category: "Game Data" },
  // Tank01 API (Direct)
  { name: "Tank01: Games", endpoint: "/api/admin/tank01/games", description: "Raw game data with pitcher IDs from Tank01", category: "Tank01 API" },
  { name: "Tank01: Multi-Book Odds", endpoint: "/api/admin/tank01/odds", description: "DraftKings, FanDuel, BetMGM, Caesars, bet365 + more", category: "Tank01 API" },
  { name: "Tank01: Teams/Standings", endpoint: "/api/admin/tank01/teams", description: "All 30 teams with W-L, runs scored/allowed", category: "Tank01 API" },
  { name: "Tank01: Player (Sonny Gray)", endpoint: "/api/admin/tank01/player/543243", description: "Player info + season pitching stats", category: "Tank01 API" },
  { name: "Tank01: Player (Aaron Nola)", endpoint: "/api/admin/tank01/player/605400", description: "Player info + season pitching stats", category: "Tank01 API" },
  // AI & Picks
  { name: "Daily Picks", endpoint: "/api/daily-picks", description: "AI-generated daily picks", category: "AI & Picks" },
  { name: "AI Suggested Picks", endpoint: "/api/ai-suggested-bets", description: "AI bet suggestions per game", category: "AI & Picks" },
  { name: "Game Evaluations", endpoint: "/api/game-evaluations", description: "AI evaluations of games", category: "AI & Picks" },
  // User & Admin
  { name: "Admin Stats", endpoint: "/api/admin/stats", description: "Platform statistics", category: "Admin" },
  { name: "Admin Users", endpoint: "/api/admin/users", description: "User list", category: "Admin" },
  { name: "Admin Bets", endpoint: "/api/admin/bets", description: "All bets placed", category: "Admin" },
  { name: "API Call Log", endpoint: "/api/admin/api-calls", description: "Recent external API calls with timing", category: "Admin" },
  { name: "API Stats", endpoint: "/api/admin/api-stats", description: "API usage stats by service", category: "Admin" },
  { name: "Scheduler Status", endpoint: "/api/admin/scheduler-status", description: "All scheduled tasks and run status", category: "Admin" },
  // External API Health
  { name: "Pitcher Recent (Gerrit Cole)", endpoint: "/api/pitcher-recent/Gerrit Cole", description: "MLB Stats API - pitcher L5 starts", category: "External APIs" },
  { name: "Pitcher Recent (Aaron Nola)", endpoint: "/api/pitcher-recent/Aaron Nola", description: "MLB Stats API - pitcher L5 starts", category: "External APIs" },
];

export default function AdminAPIPlayground() {
  const [results, setResults] = useState<APITestResult[]>(
    API_ENDPOINTS.map(ep => ({ name: ep.name, endpoint: ep.endpoint, status: "idle" as const }))
  );
  const [apiLog, setApiLog] = useState<{ time: string; name: string; status: number; ms: number }[]>([]);

  const testEndpoint = async (index: number) => {
    const ep = API_ENDPOINTS[index];
    setResults(prev => prev.map((r, i) => i === index ? { ...r, status: "loading" as const } : r));

    const start = performance.now();
    try {
      const resp = await fetch(ep.endpoint, { credentials: "include" });
      const ms = Math.round(performance.now() - start);
      const data = await resp.json().catch(() => null);

      const itemCount = Array.isArray(data) ? data.length : data?.events?.length ?? data?.users?.length ?? undefined;
      const preview = JSON.stringify(data, null, 2).slice(0, 500);

      setResults(prev => prev.map((r, i) => i === index ? {
        ...r,
        status: resp.ok ? "success" : "error",
        responseTime: ms,
        statusCode: resp.status,
        itemCount,
        preview,
        error: resp.ok ? undefined : `HTTP ${resp.status}`,
      } : r));

      setApiLog(prev => [{ time: new Date().toLocaleTimeString(), name: ep.name, status: resp.status, ms }, ...prev].slice(0, 100));
    } catch (err: any) {
      const ms = Math.round(performance.now() - start);
      setResults(prev => prev.map((r, i) => i === index ? {
        ...r,
        status: "error",
        responseTime: ms,
        error: err.message,
      } : r));
      setApiLog(prev => [{ time: new Date().toLocaleTimeString(), name: ep.name, status: 0, ms }, ...prev].slice(0, 100));
    }
  };

  const testAll = async () => {
    for (let i = 0; i < API_ENDPOINTS.length; i++) {
      await testEndpoint(i);
    }
  };

  const categories = [...new Set(API_ENDPOINTS.map(ep => ep.category))];
  const successCount = results.filter(r => r.status === "success").length;
  const errorCount = results.filter(r => r.status === "error").length;

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              API Test Playground
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Test all live API endpoints and monitor response times</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {successCount > 0 && <Badge className="bg-green-100 text-green-800 mr-2">{successCount} OK</Badge>}
              {errorCount > 0 && <Badge className="bg-red-100 text-red-800 mr-2">{errorCount} Failed</Badge>}
            </div>
            <Button onClick={testAll} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Test All
            </Button>
          </div>
        </div>

        {/* Endpoints by category */}
        {categories.map(cat => (
          <div key={cat} className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-muted-foreground">{cat}</h2>
            <div className="space-y-2">
              {API_ENDPOINTS.map((ep, i) => {
                if (ep.category !== cat) return null;
                const r = results[i];
                return (
                  <Card key={ep.endpoint} className="overflow-hidden">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3 flex-1">
                        {r.status === "idle" && <Clock className="h-4 w-4 text-muted-foreground" />}
                        {r.status === "loading" && <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />}
                        {r.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {r.status === "error" && <XCircle className="h-4 w-4 text-red-500" />}
                        <div>
                          <span className="font-medium text-sm">{ep.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{ep.description}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{ep.endpoint}</code>
                        {r.responseTime !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            {r.responseTime}ms
                          </Badge>
                        )}
                        {r.statusCode && (
                          <Badge className={r.statusCode < 400 ? "bg-green-100 text-green-800 text-xs" : "bg-red-100 text-red-800 text-xs"}>
                            {r.statusCode}
                          </Badge>
                        )}
                        {r.itemCount !== undefined && (
                          <Badge variant="secondary" className="text-xs">{r.itemCount} items</Badge>
                        )}
                        {r.error && <span className="text-xs text-red-600">{r.error}</span>}
                        <Button size="sm" variant="outline" onClick={() => testEndpoint(i)} disabled={r.status === "loading"}>
                          Test
                        </Button>
                        {r.preview && (
                          <Button size="sm" variant="ghost" onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}>
                            {expandedIndex === i ? "Hide" : "View"}
                          </Button>
                        )}
                      </div>
                    </div>
                    {expandedIndex === i && r.preview && (
                      <div className="border-t bg-muted/50 p-4">
                        <pre className="text-xs overflow-auto max-h-60 whitespace-pre-wrap">{r.preview}</pre>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {/* API Call Log */}
        {apiLog.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                API Call Log ({apiLog.length} calls)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground border-b">
                    <tr><th className="text-left p-2">Time</th><th className="text-left p-2">Endpoint</th><th className="text-left p-2">Status</th><th className="text-left p-2">Response</th></tr>
                  </thead>
                  <tbody>
                    {apiLog.map((log, i) => (
                      <tr key={i} className="border-b border-muted">
                        <td className="p-2 text-muted-foreground">{log.time}</td>
                        <td className="p-2">{log.name}</td>
                        <td className="p-2">
                          <Badge className={log.status > 0 && log.status < 400 ? "bg-green-100 text-green-800 text-xs" : "bg-red-100 text-red-800 text-xs"}>
                            {log.status || "ERR"}
                          </Badge>
                        </td>
                        <td className="p-2 text-muted-foreground">{log.ms}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}
