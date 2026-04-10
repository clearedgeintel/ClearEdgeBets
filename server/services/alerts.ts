/**
 * Alerts Service — sends automated email alerts via Resend.
 * Uses the same Resend instance pattern as email.ts.
 * Handles daily picks, settlement results, and line movement alerts.
 */

import { Resend } from 'resend';
import { storage } from '../storage';
import type { ExpertPick } from '@shared/schema';
import { EXPERT_PANEL } from '@shared/expert-panel';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.EMAIL_FROM || 'ClearEdge Sports <alerts@clearedgesports.ai>';
const BASE_URL = process.env.PUBLIC_URL || 'https://clearedgesports.ai';

export interface AlertSendResult {
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
}

function getExpertName(expertId: string): string {
  const expert = EXPERT_PANEL.find(e => e.id === expertId);
  return expert?.name || expertId;
}

function formatOdds(odds: number | null): string {
  if (odds === null || odds === undefined) return 'N/A';
  return odds > 0 ? `+${odds}` : `${odds}`;
}

function confidenceLabel(confidence: number): string {
  if (confidence >= 85) return '🔥 High';
  if (confidence >= 70) return '✅ Medium';
  return '⚠️ Low';
}

function wrapHtmlEmail(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;color:#e2e8f0;font-family:'Inter',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="color:#10b981;font-size:24px;margin:0;">ClearEdge Sports</h1>
      <p style="color:#94a3b8;font-size:14px;margin:4px 0 0;">${title}</p>
    </div>
    <div style="background-color:#1e293b;border-radius:12px;padding:24px;border:1px solid #334155;">
      ${bodyContent}
    </div>
    <div style="text-align:center;margin-top:24px;color:#64748b;font-size:12px;">
      <p>You're receiving this because you opted in to alerts on ClearEdge Sports.</p>
      <p><a href="${BASE_URL}/settings" style="color:#10b981;">Manage alert preferences</a></p>
    </div>
  </div>
</body>
</html>`;
}

function picksToPlainText(picks: ExpertPick[]): string {
  return picks.map((p, i) =>
    `${i + 1}. ${getExpertName(p.expertId)} — ${p.selection} (${formatOdds(p.odds)}) | Confidence: ${p.confidence}%\n   ${p.rationale.slice(0, 120)}...`
  ).join('\n\n');
}

// ── Daily Picks Alert ────────────────────────────────────────────────

/**
 * Send morning email with today's top expert picks.
 * Fetches today's picks from storage, picks the top 3-5 by confidence,
 * and sends a formatted HTML email to each subscriber.
 */
export async function sendDailyPicksAlert(
  subscribers: Array<{ email: string; userId?: number }>
): Promise<AlertSendResult> {
  if (!resend) {
    console.warn('[Alerts] Resend not configured — set RESEND_API_KEY');
    return { success: false, sent: 0, failed: 0, errors: ['RESEND_API_KEY not configured'] };
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const allPicks = await storage.getExpertPicksByDate(today);

  if (allPicks.length === 0) {
    console.log('[Alerts] No expert picks found for today, skipping daily alert');
    return { success: true, sent: 0, failed: 0, errors: [] };
  }

  // Sort by confidence descending, take top 5
  const topPicks = [...allPicks]
    .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
    .slice(0, 5);

  const subject = `Today's Top Expert Picks — ${today}`;

  const picksHtml = topPicks.map(pick => `
    <div style="margin-bottom:16px;padding:16px;background-color:#0f172a;border-radius:8px;border-left:4px solid #10b981;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <strong style="color:#f8fafc;font-size:16px;">${pick.selection}</strong>
        <span style="color:#94a3b8;font-size:13px;">${formatOdds(pick.odds)}</span>
      </div>
      <div style="color:#94a3b8;font-size:13px;margin-bottom:8px;">
        ${getExpertName(pick.expertId)} &middot; ${pick.pickType} &middot; ${confidenceLabel(pick.confidence)}
      </div>
      <p style="color:#cbd5e1;font-size:14px;margin:0;line-height:1.5;">
        ${pick.rationale.length > 200 ? pick.rationale.slice(0, 200) + '...' : pick.rationale}
      </p>
    </div>
  `).join('');

  const htmlContent = wrapHtmlEmail(subject, `
    <h2 style="color:#f8fafc;font-size:18px;margin-top:0;">Top ${topPicks.length} Picks for Today</h2>
    ${picksHtml}
    <div style="text-align:center;margin-top:20px;">
      <a href="${BASE_URL}/experts" style="display:inline-block;padding:12px 24px;background-color:#10b981;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">View All Picks</a>
    </div>
  `);

  const textContent = `ClearEdge Sports — Today's Top Expert Picks (${today})\n\n${picksToPlainText(topPicks)}\n\nView all picks: ${BASE_URL}/experts`;

  return sendBatchEmails(subscribers.map(s => s.email), subject, htmlContent, textContent);
}

// ── Settlement Alert ─────────────────────────────────────────────────

export interface SettlementResult {
  pickId: number;
  selection: string;
  expertId: string;
  result: 'win' | 'loss' | 'push';
  odds: number | null;
  units: string | null;
}

/**
 * After bets settle, email the user with their results.
 * Only call this for users who have opted in (alertPreferences.settlements).
 */
export async function sendSettlementAlert(
  userId: number,
  results: SettlementResult[]
): Promise<AlertSendResult> {
  if (!resend) {
    return { success: false, sent: 0, failed: 0, errors: ['RESEND_API_KEY not configured'] };
  }

  const user = await storage.getUser(userId);
  if (!user?.email) {
    return { success: false, sent: 0, failed: 0, errors: ['User not found or no email'] };
  }

  const prefs = user.alertPreferences as any;
  if (!prefs?.settlements) {
    return { success: true, sent: 0, failed: 0, errors: ['User has not opted in to settlement alerts'] };
  }

  const wins = results.filter(r => r.result === 'win').length;
  const losses = results.filter(r => r.result === 'loss').length;
  const pushes = results.filter(r => r.result === 'push').length;

  const subject = `Settlement Results: ${wins}W-${losses}L${pushes > 0 ? `-${pushes}P` : ''}`;

  const resultColor = (r: string) => {
    if (r === 'win') return '#10b981';
    if (r === 'loss') return '#ef4444';
    return '#eab308';
  };

  const resultsHtml = results.map(r => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #334155;">
      <div>
        <strong style="color:#f8fafc;">${r.selection}</strong>
        <span style="color:#94a3b8;font-size:13px;margin-left:8px;">${getExpertName(r.expertId)} &middot; ${formatOdds(r.odds)}</span>
      </div>
      <span style="color:${resultColor(r.result)};font-weight:600;text-transform:uppercase;">${r.result}</span>
    </div>
  `).join('');

  const htmlContent = wrapHtmlEmail(subject, `
    <h2 style="color:#f8fafc;font-size:18px;margin-top:0;">Your Picks Have Settled</h2>
    <div style="display:flex;gap:16px;margin-bottom:20px;">
      <div style="flex:1;text-align:center;padding:12px;background:#064e3b;border-radius:8px;">
        <div style="font-size:24px;font-weight:700;color:#10b981;">${wins}</div>
        <div style="color:#6ee7b7;font-size:12px;">WINS</div>
      </div>
      <div style="flex:1;text-align:center;padding:12px;background:#7f1d1d;border-radius:8px;">
        <div style="font-size:24px;font-weight:700;color:#ef4444;">${losses}</div>
        <div style="color:#fca5a5;font-size:12px;">LOSSES</div>
      </div>
      ${pushes > 0 ? `
      <div style="flex:1;text-align:center;padding:12px;background:#713f12;border-radius:8px;">
        <div style="font-size:24px;font-weight:700;color:#eab308;">${pushes}</div>
        <div style="color:#fde047;font-size:12px;">PUSHES</div>
      </div>` : ''}
    </div>
    ${resultsHtml}
    <div style="text-align:center;margin-top:20px;">
      <a href="${BASE_URL}/experts" style="display:inline-block;padding:12px 24px;background-color:#10b981;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">View Full Results</a>
    </div>
  `);

  const textContent = `ClearEdge Sports — Settlement Results\n\n${wins} Wins, ${losses} Losses${pushes > 0 ? `, ${pushes} Pushes` : ''}\n\n${results.map(r => `${r.result.toUpperCase()}: ${r.selection} (${getExpertName(r.expertId)}) ${formatOdds(r.odds)}`).join('\n')}\n\nView results: ${BASE_URL}/experts`;

  return sendBatchEmails([user.email], subject, htmlContent, textContent);
}

// ── Line Movement Alert ──────────────────────────────────────────────

export interface LineMovement {
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  gameTime: string;
  previousLine: number;
  currentLine: number;
  shift: number;       // absolute difference
  direction: 'up' | 'down';
  bookmaker?: string;
}

/**
 * When a line moves significantly (>10 points ML shift), email subscribers.
 */
export async function sendLineMovementAlert(
  subscribers: Array<{ email: string; userId?: number }>,
  movements: LineMovement[]
): Promise<AlertSendResult> {
  if (!resend) {
    return { success: false, sent: 0, failed: 0, errors: ['RESEND_API_KEY not configured'] };
  }

  // Only include significant movements (>10 point shift)
  const significant = movements.filter(m => Math.abs(m.shift) > 10);
  if (significant.length === 0) {
    return { success: true, sent: 0, failed: 0, errors: [] };
  }

  const subject = `Line Alert: ${significant.length} significant line movement${significant.length > 1 ? 's' : ''}`;

  const movementsHtml = significant.map(m => {
    const arrow = m.direction === 'up' ? '↑' : '↓';
    const color = m.direction === 'up' ? '#10b981' : '#ef4444';
    return `
      <div style="margin-bottom:12px;padding:16px;background-color:#0f172a;border-radius:8px;border-left:4px solid ${color};">
        <div style="color:#f8fafc;font-size:16px;font-weight:600;margin-bottom:4px;">
          ${m.awayTeam} @ ${m.homeTeam}
        </div>
        <div style="color:#94a3b8;font-size:13px;margin-bottom:8px;">${m.gameTime}${m.bookmaker ? ` &middot; ${m.bookmaker}` : ''}</div>
        <div style="font-size:15px;">
          <span style="color:#94a3b8;">ML: ${formatOdds(m.previousLine)}</span>
          <span style="color:${color};font-weight:700;margin:0 8px;">${arrow} ${formatOdds(m.currentLine)}</span>
          <span style="color:${color};font-size:13px;">(${m.shift > 0 ? '+' : ''}${m.shift} shift)</span>
        </div>
      </div>
    `;
  }).join('');

  const htmlContent = wrapHtmlEmail(subject, `
    <h2 style="color:#f8fafc;font-size:18px;margin-top:0;">Significant Line Movements Detected</h2>
    <p style="color:#94a3b8;margin-bottom:16px;">These lines have shifted more than 10 points — possible sharp action or injury news.</p>
    ${movementsHtml}
    <div style="text-align:center;margin-top:20px;">
      <a href="${BASE_URL}/odds" style="display:inline-block;padding:12px 24px;background-color:#10b981;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">View Live Odds</a>
    </div>
  `);

  const textContent = `ClearEdge Sports — Line Movement Alert\n\n${significant.map(m => `${m.awayTeam} @ ${m.homeTeam}: ML moved from ${formatOdds(m.previousLine)} to ${formatOdds(m.currentLine)} (${m.shift > 0 ? '+' : ''}${m.shift})`).join('\n')}\n\nView odds: ${BASE_URL}/odds`;

  return sendBatchEmails(subscribers.map(s => s.email), subject, htmlContent, textContent);
}

// ── Shared batch sender ──────────────────────────────────────────────

async function sendBatchEmails(
  emails: string[],
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<AlertSendResult> {
  if (!resend) {
    return { success: false, sent: 0, failed: 0, errors: ['RESEND_API_KEY not configured'] };
  }

  const result: AlertSendResult = { success: true, sent: 0, failed: 0, errors: [] };

  // Send in batches of 10 to avoid rate limits
  for (let i = 0; i < emails.length; i += 10) {
    const batch = emails.slice(i, i + 10);

    await Promise.all(batch.map(async (email) => {
      try {
        await resend!.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject,
          html: htmlContent,
          text: textContent,
        });
        result.sent++;
      } catch (err: any) {
        result.failed++;
        result.errors.push(`${email}: ${err.message}`);
      }
    }));

    // Small delay between batches
    if (i + 10 < emails.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  if (result.failed > 0) result.success = false;
  console.log(`[Alerts] ${subject}: sent ${result.sent}/${emails.length}, ${result.failed} failed`);
  return result;
}
