import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, ChevronDown, ChevronUp, Clock, CheckCircle, XCircle, ArrowDownUp, Eye } from "lucide-react";

interface APICall {
  id: number;
  timestamp: string;
  service: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  success: boolean;
  error?: string;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
  responseHeaders?: Record<string, string>;
  contentType?: string;
}

interface APIStats {
  totalCalls: number;
  last24h: number;
  errorRate: number;
  avgResponseMs: number;
  byService: Record<string, { calls: number; errors: number; avgMs: number; lastCall: string; lastStatus: number }>;
}

export default function AdminAPILog() {
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: stats } = useQuery<APIStats>({
    queryKey: ['/api/admin/api-stats'],
    queryFn: () => fetch('/api/admin/api-stats', { credentials: 'include' }).then(r => r.json()),
    refetchInterval: 10000,
  });

  const queryParams = new URLSearchParams();
  if (serviceFilter !== 'all') queryParams.set('service', serviceFilter);
  if (statusFilter === 'errors') queryParams.set('success', 'false');
  if (statusFilter === 'success') queryParams.set('success', 'true');

  const { data: calls = [] } = useQuery<APICall[]>({
    queryKey: ['/api/admin/api-calls', serviceFilter, statusFilter],
    queryFn: () => fetch(`/api/admin/api-calls?${queryParams}`, { credentials: 'include' }).then(r => r.json()),
    refetchInterval: 10000,
  });

  // Detail fetch for expanded call
  const { data: callDetail } = useQuery<APICall>({
    queryKey: ['/api/admin/api-calls', expandedId],
    queryFn: () => fetch(`/api/admin/api-calls/${expandedId}`, { credentials: 'include' }).then(r => r.json()),
    enabled: !!expandedId,
  });

  const services = stats ? Object.keys(stats.byService).sort() : [];

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const statusColor = (code: number) => {
    if (code === 0) return 'text-red-400';
    if (code < 300) return 'text-emerald-400';
    if (code < 400) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Activity className="h-6 w-6 text-emerald-400" />
          API Call Log
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every external API call with full request/response payloads
        </p>
      </div>

      {/* Service stats cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-6">
          {Object.entries(stats.byService).map(([svc, s]) => (
            <Card key={svc} className={`border-border/30 cursor-pointer hover:border-zinc-600 transition-colors ${serviceFilter === svc ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`}
              onClick={() => setServiceFilter(serviceFilter === svc ? 'all' : svc)}>
              <CardContent className="p-3">
                <div className="text-xs font-medium text-foreground mb-1">{svc}</div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold tabular-nums">{s.calls}</span>
                  <div className="text-right text-[10px]">
                    {s.errors > 0 && <div className="text-red-400">{s.errors} errors</div>}
                    <div className="text-muted-foreground">{s.avgMs}ms avg</div>
                    <div className={statusColor(s.lastStatus)}>Last: {s.lastStatus || 'ERR'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-8 text-xs bg-zinc-900/50 border-border/50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="errors">Errors Only</SelectItem>
          </SelectContent>
        </Select>
        {serviceFilter !== 'all' && (
          <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs cursor-pointer" onClick={() => setServiceFilter('all')}>
            {serviceFilter} ×
          </Badge>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{calls.length} calls</span>
      </div>

      {/* Call list */}
      <Card className="border-border/30">
        <CardContent className="p-0">
          <div className="divide-y divide-border/10 max-h-[70vh] overflow-y-auto">
            {calls.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">No API calls recorded yet.</div>
            )}
            {calls.map(call => {
              const isExpanded = expandedId === call.id;
              const detail = isExpanded ? (callDetail?.id === call.id ? callDetail : call) : null;
              return (
                <div key={call.id}>
                  <button
                    className="w-full text-left p-3 hover:bg-zinc-800/20 transition-colors flex items-center gap-3"
                    onClick={() => setExpandedId(isExpanded ? null : call.id)}
                  >
                    {/* Status indicator */}
                    <div className="flex-shrink-0">
                      {call.success ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                    </div>

                    {/* Service + endpoint */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-[9px] flex-shrink-0">{call.service}</Badge>
                        <span className="text-xs text-foreground font-medium">{call.method}</span>
                        <span className="text-xs text-muted-foreground truncate">{call.endpoint.replace(/https?:\/\/[^/]+/, '')}</span>
                      </div>
                    </div>

                    {/* Status + timing */}
                    <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                      <span className={`font-bold tabular-nums ${statusColor(call.statusCode)}`}>{call.statusCode || 'ERR'}</span>
                      <span className="text-muted-foreground tabular-nums">{call.responseTimeMs}ms</span>
                      <span className="text-zinc-600 tabular-nums hidden sm:inline">{formatTime(call.timestamp)}</span>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-zinc-500" /> : <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && detail && (
                    <div className="px-4 pb-4 space-y-3 bg-zinc-900/30 border-t border-border/10">
                      {/* Full URL */}
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">URL</div>
                        <code className="text-xs text-foreground break-all bg-zinc-900 p-2 rounded block">{detail.endpoint}</code>
                      </div>

                      {/* Request Headers */}
                      {detail.requestHeaders && Object.keys(detail.requestHeaders).length > 0 && (
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Request Headers</div>
                          <pre className="text-[11px] text-zinc-400 bg-zinc-900 p-2 rounded overflow-x-auto max-h-32">{JSON.stringify(detail.requestHeaders, null, 2)}</pre>
                        </div>
                      )}

                      {/* Request Body */}
                      {detail.requestBody && (
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Request Body</div>
                          <pre className="text-[11px] text-zinc-400 bg-zinc-900 p-2 rounded overflow-x-auto max-h-40 whitespace-pre-wrap">{tryFormatJSON(detail.requestBody)}</pre>
                        </div>
                      )}

                      {/* Response Headers */}
                      {detail.responseHeaders && Object.keys(detail.responseHeaders).length > 0 && (
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                            Response Headers
                            {detail.contentType && <span className="text-zinc-600 ml-2 normal-case">{detail.contentType}</span>}
                          </div>
                          <pre className="text-[11px] text-zinc-400 bg-zinc-900 p-2 rounded overflow-x-auto max-h-32">{JSON.stringify(detail.responseHeaders, null, 2)}</pre>
                        </div>
                      )}

                      {/* Response Body */}
                      {detail.responseBody && (
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Response Body (first 2KB)</div>
                          <pre className="text-[11px] text-zinc-400 bg-zinc-900 p-2 rounded overflow-x-auto max-h-60 whitespace-pre-wrap">{tryFormatJSON(detail.responseBody)}</pre>
                        </div>
                      )}

                      {/* Error */}
                      {detail.error && (
                        <div>
                          <div className="text-[10px] text-red-400 uppercase tracking-wider mb-1">Error</div>
                          <code className="text-xs text-red-400 bg-red-500/10 p-2 rounded block">{detail.error}</code>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function tryFormatJSON(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}
