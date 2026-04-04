import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { HelpCircle, CheckCircle, XCircle, Coins, Sparkles, Clock } from "lucide-react";

interface TriviaQuestion {
  id: number;
  question: string;
  options: string[];
  difficulty: string;
  category: string;
  coinReward: number;
  gameDate: string;
}

interface AnswerResult {
  correct: boolean;
  correctAnswer: string;
  explanation: string;
  coinsEarned: number;
  alreadyAnswered?: boolean;
}

export default function Trivia() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = user?.isAdmin;
  const [answers, setAnswers] = useState<Record<number, AnswerResult>>({});
  const [selected, setSelected] = useState<Record<number, string>>({});

  const today = new Date().toISOString().split('T')[0];

  const { data: questions = [], isLoading } = useQuery<TriviaQuestion[]>({
    queryKey: ['/api/trivia', today],
    queryFn: () => fetch(`/api/trivia?date=${today}`).then(r => r.json()),
  });

  const answerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: number; answer: string }) => {
      const resp = await fetch('/api/trivia/answer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ questionId, answer }),
      });
      return resp.json() as Promise<AnswerResult>;
    },
    onSuccess: (data, vars) => {
      setAnswers(prev => ({ ...prev, [vars.questionId]: data }));
      if (data.correct) toast({ title: `+${data.coinsEarned} coins!`, description: 'Correct answer!' });
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => fetch('/api/admin/generate-trivia', { method: 'POST', credentials: 'include' }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: 'Trivia generated!' });
      queryClient.invalidateQueries({ queryKey: ['/api/trivia'] });
    },
  });

  const totalCoins = Object.values(answers).reduce((s, a) => s + (a.coinsEarned || 0), 0);
  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter(a => a.correct).length;

  const diffColors: Record<string, string> = {
    easy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    hard: 'bg-red-500/15 text-red-400 border-red-500/20',
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-amber-400" />
            Daily Trivia
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Test your baseball knowledge. Earn virtual coins.</p>
        </div>
        <div className="flex items-center gap-3">
          {answeredCount > 0 && (
            <div className="text-right text-xs">
              <div className="flex items-center gap-1 text-amber-400"><Coins className="h-3 w-3" />{totalCoins} earned</div>
              <div className="text-muted-foreground">{correctCount}/{answeredCount} correct</div>
            </div>
          )}
          {isAdmin && (
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" disabled={generateMutation.isPending}
              onClick={() => generateMutation.mutate()}>
              {generateMutation.isPending ? <Clock className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-1" />Generate</>}
            </Button>
          )}
        </div>
      </div>

      {isLoading && <div className="text-center py-8 text-muted-foreground">Loading questions...</div>}

      {!isLoading && questions.length === 0 && (
        <Card className="border-border/30 border-dashed">
          <CardContent className="p-10 text-center">
            <HelpCircle className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No trivia today yet.{isAdmin && " Click Generate above."}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {questions.map((q, idx) => {
          const result = answers[q.id];
          const sel = selected[q.id];
          const answered = !!result;

          return (
            <Card key={q.id} className={`border-border/30 ${answered ? (result.correct ? 'border-emerald-500/20' : 'border-red-500/20') : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">Q{idx + 1}</span>
                    <Badge className={`border text-[10px] ${diffColors[q.difficulty] || diffColors.medium}`}>{q.difficulty}</Badge>
                    <Badge className="bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px]">{q.category}</Badge>
                  </div>
                  <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[10px]">
                    <Coins className="h-2.5 w-2.5 mr-0.5" />{q.coinReward}
                  </Badge>
                </div>

                <h3 className="text-sm font-medium text-foreground mb-3">{q.question}</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => {
                    const letter = ['A', 'B', 'C', 'D'][oi];
                    const isSelected = sel === opt;
                    const isCorrectAnswer = answered && opt === result.correctAnswer;
                    const isWrongSelection = answered && isSelected && !result.correct;

                    return (
                      <button
                        key={oi}
                        disabled={answered || answerMutation.isPending}
                        onClick={() => {
                          setSelected(prev => ({ ...prev, [q.id]: opt }));
                          answerMutation.mutate({ questionId: q.id, answer: opt });
                        }}
                        className={`p-2.5 rounded-lg text-left text-sm border transition-all ${
                          isCorrectAnswer ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                          isWrongSelection ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                          isSelected ? 'border-amber-500/30 bg-amber-500/10' :
                          'border-border/30 hover:border-zinc-600 text-zinc-400'
                        } ${answered ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <span className="font-medium mr-2 text-muted-foreground">{letter}.</span>
                        {opt}
                        {isCorrectAnswer && <CheckCircle className="h-3.5 w-3.5 inline ml-1 text-emerald-400" />}
                        {isWrongSelection && <XCircle className="h-3.5 w-3.5 inline ml-1 text-red-400" />}
                      </button>
                    );
                  })}
                </div>

                {answered && result.explanation && (
                  <div className="mt-3 p-2.5 bg-zinc-900/50 border border-border/30 rounded-lg text-xs text-muted-foreground">
                    {result.correct ? '✅' : '❌'} {result.explanation}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
