/**
 * Alert Routes — user preferences + admin trigger for daily picks alert.
 */

import { Router } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { storage } from '../storage';
import { sendDailyPicksAlert } from '../services/alerts';

const router = Router();

// Default preferences for new/unset users
const DEFAULT_PREFS = { dailyPicks: false, settlements: false, lineMovements: false };

// ── GET /api/alerts/preferences ──────────────────────────────────────

router.get('/api/alerts/preferences', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const prefs = (user.alertPreferences as any) || DEFAULT_PREFS;
    res.json(prefs);
  } catch (error) {
    console.error('Error fetching alert preferences:', error);
    res.status(500).json({ error: 'Failed to fetch alert preferences' });
  }
});

// ── POST /api/alerts/preferences ─────────────────────────────────────

router.post('/api/alerts/preferences', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { dailyPicks, settlements, lineMovements } = req.body;

    // Validate booleans
    const prefs = {
      dailyPicks: dailyPicks === true,
      settlements: settlements === true,
      lineMovements: lineMovements === true,
    };

    await db.update(users)
      .set({ alertPreferences: prefs })
      .where(eq(users.id, userId));

    res.json(prefs);
  } catch (error) {
    console.error('Error updating alert preferences:', error);
    res.status(500).json({ error: 'Failed to update alert preferences' });
  }
});

// ── POST /api/admin/alerts/send-daily ────────────────────────────────

router.post('/api/admin/alerts/send-daily', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await storage.getUser(userId);
    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Fetch all users who have opted in to daily picks alerts
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      alertPreferences: users.alertPreferences,
    }).from(users);

    const subscribers = allUsers.filter(u => {
      const prefs = u.alertPreferences as any;
      return prefs?.dailyPicks === true && u.email;
    }).map(u => ({ email: u.email, userId: u.id }));

    if (subscribers.length === 0) {
      return res.json({ success: true, message: 'No subscribers opted in to daily picks alerts', sent: 0 });
    }

    const result = await sendDailyPicksAlert(subscribers);
    res.json({ ...result, subscriberCount: subscribers.length });
  } catch (error) {
    console.error('Error sending daily picks alert:', error);
    res.status(500).json({ error: 'Failed to send daily picks alert' });
  }
});

export default router;
