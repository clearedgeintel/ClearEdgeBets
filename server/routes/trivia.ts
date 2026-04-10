import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

// Get today's trivia questions
router.get('/api/trivia', async (req, res) => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const questions = await storage.getTriviaByDate(date);
    res.json(questions.map((q: any) => ({ id: q.id, question: q.question, options: q.options, difficulty: q.difficulty, category: q.category, coinReward: q.coinReward, gameDate: q.gameDate })));
  } catch { res.json([]); }
});

// Submit an answer
router.post('/api/trivia/answer', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const { questionId, answer } = req.body;
    if (!questionId || !answer) return res.status(400).json({ error: 'questionId and answer required' });

    const existing = await storage.getUserTriviaAnswers(userId, '');
    if (existing.some((a: any) => a.questionId === questionId)) {
      return res.json({ error: 'Already answered', alreadyAnswered: true });
    }

    const allQ = await storage.getTriviaByDate(new Date().toISOString().split('T')[0]);
    const question = allQ.find((q: any) => q.id === questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    const correct = answer === question.correctAnswer;
    const coinsEarned = correct ? (question.coinReward || 100) : 0;

    await storage.recordTriviaAnswer({ userId, questionId, answer, correct, coinsEarned });

    if (correct) {
      const user = await storage.getUser(userId);
      if (user) {
        const { db } = await import('../db');
        const { users } = await import('@shared/schema');
        const { eq, sql } = await import('drizzle-orm');
        await db.update(users).set({ virtualBalance: sql`${users.virtualBalance} + ${coinsEarned}` }).where(eq(users.id, userId));
      }
    }

    res.json({ correct, correctAnswer: question.correctAnswer, explanation: question.explanation, coinsEarned });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: generate trivia from yesterday's games
router.post('/api/admin/generate-trivia', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const user = await storage.getUser(userId);
    if (!user?.isAdmin) return res.status(403).json({ error: 'Admin access required' });

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const existing = await storage.getTriviaByDate(today);
    if (existing.length >= 5) return res.json({ alreadyExists: true, questions: existing });

    const { fetchTank01Scores, getTeamFullName } = await import('../services/tank01-mlb');
    const scores = await fetchTank01Scores(yesterday);
    const completed = Object.values(scores).filter((g: any) => g.gameStatusCode === '2');

    const scoreLines = completed.map((g: any) =>
      `${getTeamFullName(g.away)} ${g.lineScore?.away?.R || '0'} @ ${getTeamFullName(g.home)} ${g.lineScore?.home?.R || '0'}`
    ).join('\n');

    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: `Generate 5 fun baseball trivia questions based on yesterday's MLB games and general baseball knowledge.

Yesterday's results:
${scoreLines || 'No games yesterday'}

Create a mix: 2 questions about yesterday's games, 2 general baseball history/stats questions, 1 weird/fun baseball fact.

Each question should have exactly 4 options (A, B, C, D).

Return JSON: { "questions": [{ "question": "...", "options": ["A answer", "B answer", "C answer", "D answer"], "correctAnswer": "A answer", "explanation": "Brief explanation", "difficulty": "easy|medium|hard", "category": "yesterday|stats|history|fun" }] }` }],
      response_format: { type: 'json_object' },
      temperature: 0.9,
      max_tokens: 1500,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    const saved = [];
    for (const q of (result.questions || []).slice(0, 5)) {
      const s = await storage.createTriviaQuestion({
        gameDate: today,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty || 'medium',
        category: q.category || 'general',
        coinReward: q.difficulty === 'hard' ? 200 : q.difficulty === 'easy' ? 50 : 100,
      });
      saved.push(s);
    }

    res.json({ generated: saved.length, questions: saved });
  } catch (error: any) {
    console.error('Error generating trivia:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
