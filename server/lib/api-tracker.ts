/**
 * API Call Tracker — logs all external API calls with timing, status, and payloads.
 * Stores the last 500 calls in memory, accessible via /api/admin/api-calls.
 */

export interface APICallRecord {
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
  responseBody?: string;       // First 2KB of response
  responseHeaders?: Record<string, string>;
  contentType?: string;
}

const MAX_RECORDS = 500;
const MAX_BODY_SIZE = 2048;   // Cap stored bodies at 2KB
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

export function getAPICallLog(options?: { service?: string; success?: boolean; limit?: number }): APICallRecord[] {
  let results = callLog;
  if (options?.service) results = results.filter(c => c.service === options.service);
  if (options?.success !== undefined) results = results.filter(c => c.success === options.success);
  if (options?.limit) results = results.slice(0, options.limit);
  return results;
}

export function getAPICallById(id: number): APICallRecord | undefined {
  return callLog.find(c => c.id === id);
}

export function getAPICallStats(): {
  totalCalls: number;
  last24h: number;
  errorRate: number;
  avgResponseMs: number;
  byService: Record<string, { calls: number; errors: number; avgMs: number; lastCall: string; lastStatus: number }>;
} {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const recent = callLog.filter(c => now - new Date(c.timestamp).getTime() < day);

  const byService: Record<string, { calls: number; errors: number; totalMs: number; lastCall: string; lastStatus: number }> = {};
  for (const call of callLog) {
    if (!byService[call.service]) byService[call.service] = { calls: 0, errors: 0, totalMs: 0, lastCall: call.timestamp, lastStatus: call.statusCode };
    byService[call.service].calls++;
    if (!call.success) byService[call.service].errors++;
    byService[call.service].totalMs += call.responseTimeMs;
  }

  const serviceStats: Record<string, { calls: number; errors: number; avgMs: number; lastCall: string; lastStatus: number }> = {};
  for (const [svc, s] of Object.entries(byService)) {
    serviceStats[svc] = { calls: s.calls, errors: s.errors, avgMs: Math.round(s.totalMs / s.calls), lastCall: s.lastCall, lastStatus: s.lastStatus };
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

function truncate(str: string | undefined, max: number): string | undefined {
  if (!str) return undefined;
  return str.length > max ? str.slice(0, max) + `... [truncated, ${str.length} total]` : str;
}

function sanitizeHeaders(headers: HeadersInit | undefined): Record<string, string> | undefined {
  if (!headers) return undefined;
  const result: Record<string, string> = {};
  if (headers instanceof Headers) {
    headers.forEach((v, k) => { result[k] = k.toLowerCase().includes('key') || k.toLowerCase().includes('auth') ? '***' : v; });
  } else if (Array.isArray(headers)) {
    headers.forEach(([k, v]) => { result[k] = k.toLowerCase().includes('key') || k.toLowerCase().includes('auth') ? '***' : v; });
  } else {
    Object.entries(headers).forEach(([k, v]) => { result[k] = k.toLowerCase().includes('key') || k.toLowerCase().includes('auth') ? '***' : String(v); });
  }
  return result;
}

/**
 * Wrapper: fetch with automatic tracking including payloads.
 * Use instead of global fetch() for external API calls.
 */
export async function trackedFetch(
  url: string | URL,
  options: RequestInit & { _service?: string } = {}
): Promise<Response> {
  const service = options._service || guessService(url.toString());
  const method = options.method || 'GET';
  const start = performance.now();
  const reqHeaders = sanitizeHeaders(options.headers);
  const reqBody = truncate(typeof options.body === 'string' ? options.body : undefined, MAX_BODY_SIZE);

  try {
    const resp = await fetch(url, options);
    const ms = Math.round(performance.now() - start);
    const contentType = resp.headers.get('content-type') || '';

    // Clone response to read body without consuming it
    const clone = resp.clone();
    let responseBody: string | undefined;
    try {
      const text = await clone.text();
      responseBody = truncate(text, MAX_BODY_SIZE);
    } catch {}

    const respHeaders: Record<string, string> = {};
    resp.headers.forEach((v, k) => { respHeaders[k] = v; });

    recordAPICall({
      service, endpoint: url.toString().slice(0, 500), method,
      statusCode: resp.status, responseTimeMs: ms, success: resp.ok,
      requestHeaders: reqHeaders, requestBody: reqBody,
      responseBody, responseHeaders: respHeaders, contentType,
    });
    return resp;
  } catch (err: any) {
    const ms = Math.round(performance.now() - start);
    recordAPICall({
      service, endpoint: url.toString().slice(0, 500), method,
      statusCode: 0, responseTimeMs: ms, success: false, error: err.message,
      requestHeaders: reqHeaders, requestBody: reqBody,
    });
    throw err;
  }
}

function guessService(url: string): string {
  if (url.includes('tank01')) return 'Tank01 MLB';
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
