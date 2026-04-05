/**
 * Email Service — sends newsletters via Resend.
 * Free tier: 100 emails/day, 3,000/month.
 * Set RESEND_API_KEY in .env to enable.
 */

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.EMAIL_FROM || 'ClearEdge Sports <newsletter@clearedgesports.ai>';

export interface SendResult {
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
}

/**
 * Send a newsletter to all active subscribers.
 */
export async function sendNewsletter(
  subject: string,
  htmlContent: string,
  textContent: string,
  subscribers: Array<{ email: string; unsubscribeToken: string }>,
): Promise<SendResult> {
  if (!resend) {
    console.warn('Email not configured — set RESEND_API_KEY in .env');
    return { success: false, sent: 0, failed: 0, errors: ['RESEND_API_KEY not configured'] };
  }

  const result: SendResult = { success: true, sent: 0, failed: 0, errors: [] };
  const baseUrl = process.env.PUBLIC_URL || 'https://clearedgesports.ai';

  // Send in batches of 10 to avoid rate limits
  for (let i = 0; i < subscribers.length; i += 10) {
    const batch = subscribers.slice(i, i + 10);

    await Promise.all(batch.map(async (sub) => {
      try {
        const personalizedHtml = htmlContent.replace(
          /\{\{unsubscribe_url\}\}/g,
          `${baseUrl}/api/newsletter/unsubscribe/${sub.unsubscribeToken}`
        );
        const personalizedText = textContent.replace(
          /\{\{unsubscribe_url\}\}/g,
          `${baseUrl}/api/newsletter/unsubscribe/${sub.unsubscribeToken}`
        );

        await resend.emails.send({
          from: FROM_EMAIL,
          to: sub.email,
          subject,
          html: personalizedHtml,
          text: personalizedText,
        });

        result.sent++;
      } catch (err: any) {
        result.failed++;
        result.errors.push(`${sub.email}: ${err.message}`);
      }
    }));

    // Small delay between batches
    if (i + 10 < subscribers.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  if (result.failed > 0) result.success = false;
  console.log(`Email: sent ${result.sent}/${subscribers.length}, ${result.failed} failed`);
  return result;
}

export function isEmailConfigured(): boolean {
  return !!resend;
}
