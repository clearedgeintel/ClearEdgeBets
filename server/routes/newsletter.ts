import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

// Subscribe (public)
router.post('/api/newsletter/subscribe', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const existing = await storage.getSubscriberByEmail(email);
    if (existing?.status === 'active') return res.json({ success: true, message: 'Already subscribed' });
    const token = `unsub-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    if (existing) {
      // Resubscribe
      await storage.addSubscriber({ email, name, status: 'active', unsubscribeToken: token, source: 'website' });
    } else {
      await storage.addSubscriber({ email, name, status: 'active', unsubscribeToken: token, source: 'website' });
    }
    res.json({ success: true, message: 'Subscribed!' });
  } catch (error: any) {
    if (error.message?.includes('unique')) return res.json({ success: true, message: 'Already subscribed' });
    res.status(500).json({ error: error.message });
  }
});

// Unsubscribe (public, via token)
router.get('/api/newsletter/unsubscribe/:token', async (req, res) => {
  try {
    const success = await storage.unsubscribe(req.params.token);
    res.send(success ? '<html><body style="background:#09090b;color:#fafafa;font-family:sans-serif;text-align:center;padding:60px"><h2>Unsubscribed</h2><p>You have been removed from the ClearEdge Sports newsletter.</p></body></html>' : '<html><body style="background:#09090b;color:#fafafa;font-family:sans-serif;text-align:center;padding:60px"><h2>Link expired</h2></body></html>');
  } catch { res.status(500).send('Error'); }
});

// Newsletter archive (public)
router.get('/api/newsletter/archive', async (req, res) => {
  try {
    const all = await storage.getNewsletters(50);
    const sent = all.filter(n => n.status === 'sent' || n.status === 'draft');
    res.json(sent.map(n => ({ id: n.id, subject: n.subject, previewText: n.previewText, edition: n.edition, slug: n.slug, status: n.status, sentAt: n.sentAt, createdAt: n.createdAt })));
  } catch { res.json([]); }
});

// View single newsletter (public)
router.get('/api/newsletter/:slug', async (req, res) => {
  try {
    const nl = await storage.getNewsletterBySlug(req.params.slug);
    if (!nl) return res.status(404).json({ error: 'Not found' });
    res.json(nl);
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// Render newsletter HTML for browser viewing
router.get('/api/newsletter/:slug/view', async (req, res) => {
  try {
    const nl = await storage.getNewsletterBySlug(req.params.slug);
    if (!nl) return res.status(404).send('Not found');
    res.setHeader('Content-Type', 'text/html');
    res.send(nl.htmlContent);
  } catch { res.status(500).send('Error'); }
});

// Admin: subscriber list + metrics
router.get('/api/admin/newsletter/subscribers', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const user = await storage.getUser(userId);
    if (!user?.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    const subs = await storage.getAllSubscribers();
    const active = subs.filter(s => s.status === 'active').length;
    const unsubscribed = subs.filter(s => s.status === 'unsubscribed').length;
    res.json({ total: subs.length, active, unsubscribed, subscribers: subs });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// Admin: all newsletters with full metrics
router.get('/api/admin/newsletter/all', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const user = await storage.getUser(userId);
    if (!user?.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    res.json(await storage.getNewsletters(100));
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// Admin: generate newsletter
router.post('/api/admin/newsletter/generate', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const user = await storage.getUser(userId);
    if (!user?.isAdmin) return res.status(403).json({ error: 'Admin access required' });

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Fetch data
    const { fetchTank01Games, fetchTank01Scores, fetchTank01Odds, getConsensusOdds, parseMultiBookOdds, getTeamFullName } = await import('../services/tank01-mlb');
    const [todayGames, yesterdayScores, todayOdds] = await Promise.all([
      fetchTank01Games(today),
      fetchTank01Scores(yesterday),
      fetchTank01Odds(today),
    ]);

    const yScores = Object.values(yesterdayScores).filter((g: any) => g.gameStatusCode === '2' || g.gameStatus === 'Completed').map((g: any) => ({
      away: getTeamFullName(g.away),
      home: getTeamFullName(g.home),
      awayScore: parseInt(g.lineScore?.away?.R || '0'),
      homeScore: parseInt(g.lineScore?.home?.R || '0'),
    }));

    const tGames = todayGames.map(g => {
      const odds = todayOdds[g.gameID];
      const books = odds ? parseMultiBookOdds(odds) : [];
      const consensus = books.length > 0 ? getConsensusOdds(books) : { moneyline: null, total: null };
      return {
        away: getTeamFullName(g.away),
        home: getTeamFullName(g.home),
        gameTime: g.gameTime,
        moneyline: consensus.moneyline || undefined,
        total: consensus.total?.line || undefined,
      };
    });

    const { generateDailyNewsletter } = await import('../services/openai');
    const result = await generateDailyNewsletter({ date: today, yesterdayScores: yScores, todayGames: tGames });

    const slug = `newsletter-${today}`;
    const nl = await storage.createNewsletter({
      subject: result.subject,
      previewText: result.previewText,
      htmlContent: result.html,
      textContent: result.text,
      slug,
      edition: today,
      quickPicks: result.quickPicks,
      yesterdayRecap: yScores,
      status: 'draft',
      sentAt: null,
      recipientCount: 0,
      openCount: 0,
      clickCount: 0,
    });

    res.json({ success: true, newsletter: nl });
  } catch (error: any) {
    console.error('Error generating newsletter:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send newsletter to all active subscribers (admin)
router.post('/api/admin/newsletter/send/:id', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const user = await storage.getUser(userId);
    if (!user?.isAdmin) return res.status(403).json({ error: 'Admin access required' });

    const nlId = parseInt(req.params.id);
    const newsletters = await storage.getNewsletters(100);
    const nl = newsletters.find(n => n.id === nlId);
    if (!nl) return res.status(404).json({ error: 'Newsletter not found' });

    const subs = await storage.getActiveSubscribers();
    if (subs.length === 0) return res.json({ success: true, sent: 0, message: 'No active subscribers' });

    const { sendNewsletter, isEmailConfigured } = await import('../services/email');

    if (!isEmailConfigured()) {
      // Fallback: just mark as sent without emailing
      await storage.updateNewsletter(nlId, { status: 'sent', sentAt: new Date(), recipientCount: subs.length });
      return res.json({ success: true, sent: 0, message: 'Email not configured (RESEND_API_KEY missing). Marked as sent.', recipientCount: subs.length });
    }

    const result = await sendNewsletter(
      nl.subject,
      nl.htmlContent,
      nl.textContent || '',
      subs.map(s => ({ email: s.email, unsubscribeToken: s.unsubscribeToken })),
    );

    await storage.updateNewsletter(nlId, {
      status: 'sent',
      sentAt: new Date(),
      recipientCount: result.sent,
    });

    res.json({ success: result.success, sent: result.sent, failed: result.failed, errors: result.errors });
  } catch (error: any) {
    console.error('Newsletter send error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Legacy mark-sent (backward compat)
router.post('/api/admin/newsletter/mark-sent/:id', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const user = await storage.getUser(userId);
    if (!user?.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    const subs = await storage.getActiveSubscribers();
    const updated = await storage.updateNewsletter(parseInt(req.params.id), { status: 'sent', sentAt: new Date(), recipientCount: subs.length });
    res.json({ success: true, newsletter: updated });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

export default router;
