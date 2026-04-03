/**
 * API Call Tracker — logs all external API calls with timing and status.
 * Stores the last 500 calls in memory, accessible via /api/admin/api-calls.
 */

export interface APICallRecord {
  id: number;
  timestamp: string;
  service: string;     // e.g. "ESPN", "Odds API", "OpenWeatherMap", "OpenAI", "MLB Stats API"
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  success: boolean;
  error?: string;
}

const MAX_RECORDS = 500;
let nextId = 1;
const callLog: APICallRecord[] = [];

export function recordAPICall(record: Omit<APICallRecord, 'id' | 'timestamp'>): void {
  callLog.unshift({
    id: nextId++,
    timestamp: new Date().toISOString(),
    ...record,
  });
  if (callLog.length > MAX_RECORDS) callLog.length = MAX_RECORDS;
}

export function getAPICallLog(): APICallRecord[] {
  return callLog;
}

export function getAPICallStats(): {
  totalCalls: number;
  last24h: number;
  errorRate: number;
  avgResponseMs: number;
  byService: Record<string, { calls: number; errors: number; avgMs: number }>;
} {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const recent = callLog.filter(c => now - new Date(c.timestamp).getTime() < day);

  const byService: Record<string, { calls: number; errors: number; totalMs: number }> = {};
  for (const call of callLog) {
    if (!byService[call.service]) byService[call.service] = { calls: 0, errors: 0, totalMs: 0 };
    byService[call.service].calls++;
    if (!call.success) byService[call.service].errors++;
    byService[call.service].totalMs += call.responseTimeMs;
  }

  const serviceStats: Record<string, { calls: number; errors: number; avgMs: number }> = {};
  for (const [svc, s] of Object.entries(byService)) {
    serviceStats[svc] = { calls: s.calls, errors: s.errors, avgMs: Math.round(s.totalMs / s.calls) };
  }

  const totalErrors = callLog.filter(c => !c.success).length;

  return {
    totalCalls: callLog.length,
    last24h: recent.length,
    errorRate: callLog.length > 0 ? Math.round((totalErrors / callLog.length) * 100) : 0,
    avgResponseMs: callLog.length > 0 ? Math.round(callLog.reduce((s, c) => s + c.responseTimeMs, 0) / callLog.length) : 0,
    byService: serviceStats,
  };
}

/**
 * Wrapper: fetch with automatic tracking.
 * Use instead of global fetch() for external API calls.
 */
export async function trackedFetch(
  url: string | URL,
  options: RequestInit & { _service?: string } = {}
): Promise<Response> {
  const service = options._service || guessService(url.toString());
  const method = options.method || 'GET';
  const start = performance.now();

  try {
    const resp = await fetch(url, options);
    const ms = Math.round(performance.now() - start);
    recordAPICall({ service, endpoint: url.toString().slice(0, 200), method, statusCode: resp.status, responseTimeMs: ms, success: resp.ok });
    return resp;
  } catch (err: any) {
    const ms = Math.round(performance.now() - start);
    recordAPICall({ service, endpoint: url.toString().slice(0, 200), method, statusCode: 0, responseTimeMs: ms, success: false, error: err.message });
    throw err;
  }
}

function guessService(url: string): string {
  if (url.includes('rapidapi.com')) return 'RapidAPI MLB';
  if (url.includes('espn.com')) return 'ESPN';
  if (url.includes('odds-api') || url.includes('the-odds-api')) return 'Odds API';
  if (url.includes('openweathermap.org')) return 'OpenWeatherMap';
  if (url.includes('openai.com')) return 'OpenAI';
  if (url.includes('statsapi.mlb.com')) return 'MLB Stats API';
  if (url.includes('stripe.com')) return 'Stripe';
  if (url.includes('baseball-reference')) return 'Baseball Reference';
  return 'Unknown';
}
