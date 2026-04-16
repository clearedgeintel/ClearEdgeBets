import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { HelpCircle, X, Coins } from "lucide-react";

const STORAGE_KEY = "clearedge_trivia_last_shown";

export function DailyTriviaBubble() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(true);
  const today = new Date().toISOString().split("T")[0];

  const { data: questions } = useQuery<any[]>({
    queryKey: ["/api/trivia", today],
    queryFn: () => fetch(`/api/trivia?date=${today}`).then((r) => (r.ok ? r.json() : [])),
    enabled: !!user,
    staleTime: 600_000,
  });

  useEffect(() => {
    if (!user) return;
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (lastShown === today) return;
    const timer = setTimeout(() => setDismissed(false), 2000);
    return () => clearTimeout(timer);
  }, [user, today]);

  const safeQuestions = Array.isArray(questions) ? questions : [];
  if (dismissed || !user || safeQuestions.length === 0) return null;

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, today);
  };

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 z-50 animate-fade-in-up">
      <div className="bg-zinc-900 border border-amber-500/40 rounded-xl shadow-lg shadow-black/40 p-4 max-w-[280px]">
        <button
          onClick={dismiss}
          className="absolute top-2 right-2 p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <HelpCircle className="h-5 w-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">Daily Trivia</div>
            <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
              <Coins className="h-3 w-3 text-amber-400" />
              Earn 100 coins · 30 seconds
            </div>
          </div>
        </div>
        <Link href="/trivia">
          <button
            onClick={dismiss}
            className="mt-3 w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-sm font-medium text-white transition-colors"
          >
            Play Now
          </button>
        </Link>
      </div>
    </div>
  );
}
