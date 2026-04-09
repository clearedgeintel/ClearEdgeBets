import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Pen, Send, Clock, ChevronDown, ChevronUp, Sparkles, CheckCircle, Quote, Newspaper, Upload, User, MessageSquare, Ruler, Flame, CalendarCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BEAT_WRITERS, type BeatWriter } from "@shared/beat-writers";
import { format, subDays } from "date-fns";

interface AvailableGame {
  gameID: string;
  away: string;
  home: string;
  awayScore: number;
  homeScore: number;
  date: string;
}

interface EditorialColumn {
  id: number;
  assignmentId: string;
  topic: string;
  gameId?: string;
  author: string;
  authorMood?: string;
  title: string;
  content: string;
  slug: string;
  createdAt: string;
}

const moodColors: Record<string, string> = {
  witty: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  grumpy: 'bg-red-500/15 text-red-400 border-red-500/20',
  dramatic: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  nerdy: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  folksy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
};

function teamLogo(code: string) {
  const c = code.toUpperCase() === 'WAS' ? 'wsh' : code.toLowerCase();
  return `https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/${c}.png`;
}

export default function EditorsDesk() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [topic, setTopic] = useState('');
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [selectedWriters, setSelectedWriters] = useState<Set<string>>(new Set());
  const [showWriterPicker, setShowWriterPicker] = useState(false);
  const [expandedColumn, setExpandedColumn] = useState<number | null>(null);
  const [playerFocus, setPlayerFocus] = useState('');
  const [storyLength, setStoryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [tone, setTone] = useState<'sarcastic' | 'analytical' | 'dramatic' | 'heartfelt'>('sarcastic');
  const [angle, setAngle] = useState<'recap' | 'opinion' | 'breakdown' | 'human-interest' | 'rivalry' | 'what-if'>('recap');

  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');
  const dayAfter = format(new Date(Date.now() + 86400000 * 2), 'yyyy-MM-dd');

  type SlateGame = {
    gameID: string; away: string; home: string; awayName: string; homeName: string;
    gameTime: string; venue: string; awayPitcher: string; homePitcher: string;
    moneyline?: { away: number; home: number } | null; total?: string;
    beatWriter: string | null; beatWriterAvatar: string | null;
    hasReview: boolean; hasAssignment: boolean; status: string;
  };
  type SlateResponse = { date: string; games: number; slate: SlateGame[] };

  // Multi-day editorial slate
  const { data: slateData } = useQuery<SlateResponse>({
    queryKey: ['/api/editorial/slate', today],
    queryFn: () => fetch(`/api/editorial/slate?date=${today}`, { credentials: 'include' }).then(r => r.json()),
  });
  const { data: tomorrowSlate } = useQuery<SlateResponse>({
    queryKey: ['/api/editorial/slate', tomorrow],
    queryFn: () => fetch(`/api/editorial/slate?date=${tomorrow}`, { credentials: 'include' }).then(r => r.json()),
  });
  const { data: dayAfterSlate } = useQuery<SlateResponse>({
    queryKey: ['/api/editorial/slate', dayAfter],
    queryFn: () => fetch(`/api/editorial/slate?date=${dayAfter}`, { credentials: 'include' }).then(r => r.json()),
  });

  // Yesterday's games for game picker
  const { data: availableData } = useQuery<{ games: AvailableGame[] }>({
    queryKey: ['/api/blog/available-games', yesterday],
    queryFn: () => fetch(`/api/blog/available-games?date=${yesterday}`, { credentials: 'include' }).then(r => r.json()),
  });

  // Past editorial columns
  const { data: pastColumns = [] } = useQuery<EditorialColumn[]>({
    queryKey: ['/api/editorial/columns'],
    queryFn: () => fetch('/api/editorial/columns', { credentials: 'include' }).then(r => r.json()),
  });

  const toggleWriter = (name: string) => {
    setSelectedWriters(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectAllWriters = () => setSelectedWriters(new Set(BEAT_WRITERS.map(w => w.name)));
  const clearWriters = () => setSelectedWriters(new Set());

  const assignMutation = useMutation({
    mutationFn: async () => {
      const resp = await fetch('/api/editorial/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          topic,
          writerNames: [...selectedWriters],
          gameID: selectedGame || undefined,
          playerFocus: playerFocus || undefined,
          storyLength,
          tone,
          angle,
        }),
      });
      if (!resp.ok) throw new Error((await resp.json()).error || 'Failed');
      return resp.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Assignment complete!', description: `${data.columns.length} columns generated` });
      queryClient.invalidateQueries({ queryKey: ['/api/editorial/columns'] });
      setTopic('');
      setSelectedGame(null);
      setSelectedWriters(new Set());
    },
    onError: (err: any) => {
      toast({ title: 'Assignment failed', description: err.message, variant: 'destructive' });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (columnId: number) => {
      const resp = await fetch('/api/admin/editorial-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ columnId }),
      });
      if (!resp.ok) throw new Error((await resp.json()).error || 'Failed');
      return resp.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Published!', description: `"${data.review.title}" is now on The Morning Roast` });
      queryClient.invalidateQueries({ queryKey: ['/api/blog/reviews'] });
    },
    onError: (err: any) => {
      toast({ title: 'Publish failed', description: err.message, variant: 'destructive' });
    },
  });

  // Group past columns by assignment
  const assignments = pastColumns.reduce<Record<string, EditorialColumn[]>>((acc, col) => {
    (acc[col.assignmentId] = acc[col.assignmentId] || []).push(col);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Newspaper className="h-6 w-6 text-amber-400" />
          Editor's Desk
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Assign topics to writers. Pick a game, type a topic, select your newsroom — hit send.
        </p>
      </div>

      {/* ── Today's Editorial Slate ── */}
      {slateData?.slate && slateData.slate.length > 0 && (
        <Card className="mb-8 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
                <CalendarCheck className="h-3.5 w-3.5 text-emerald-400" />
                Today's Slate — {slateData.games} games
              </h3>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Published</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Assigned</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-600"></span>Unassigned</span>
              </div>
            </div>
            <div className="space-y-1">
              {slateData.slate.map(game => (
                <div key={game.gameID} className="flex items-center justify-between p-2.5 bg-zinc-900/30 border border-border/20 rounded-lg hover:border-border/40 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Status dot */}
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${game.status === 'published' ? 'bg-emerald-500' : game.status === 'assigned' ? 'bg-amber-500' : 'bg-zinc-600'}`} />

                    {/* Teams */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img src={teamLogo(game.away)} alt="" className="h-4 w-4 flex-shrink-0" />
                      <span className="text-xs font-medium text-foreground">{game.away}</span>
                      <span className="text-[10px] text-zinc-600">@</span>
                      <span className="text-xs font-medium text-foreground">{game.home}</span>
                      <img src={teamLogo(game.home)} alt="" className="h-4 w-4 flex-shrink-0" />
                    </div>

                    {/* Game info */}
                    <span className="text-[10px] text-zinc-600 flex-shrink-0">{game.gameTime}</span>
                    <span className="text-[10px] text-zinc-700 hidden sm:inline truncate">{game.awayPitcher} vs {game.homePitcher}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {/* Beat writer — always visible */}
                    {game.beatWriter && (
                      <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] flex items-center gap-1">
                        <span>{game.beatWriterAvatar}</span>
                        {game.beatWriter}
                      </Badge>
                    )}

                    {/* Status badge */}
                    {game.status === 'published' && (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[9px]">Published</Badge>
                    )}
                    {game.status === 'assigned' && (
                      <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[9px]">In Progress</Badge>
                    )}
                    {game.status === 'unassigned' && (
                      <Button size="sm" variant="outline" className="h-6 text-[10px] border-amber-500/30 text-amber-400"
                        onClick={() => { setSelectedGame(game.gameID); setTopic(`Recap of ${game.awayName} @ ${game.homeName}`); if (game.beatWriter) setSelectedWriters(new Set([game.beatWriter])); }}>
                        Assign
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Upcoming Schedule (Tomorrow + Day After) ── */}
      {(tomorrowSlate?.slate?.length || dayAfterSlate?.slate?.length) ? (
        <Card className="mb-8 border-border/30">
          <CardContent className="p-4">
            {[
              { label: `Tomorrow — ${format(new Date(tomorrow), 'EEE, MMM d')}`, data: tomorrowSlate },
              { label: format(new Date(dayAfter), 'EEE, MMM d'), data: dayAfterSlate },
            ].map(({ label, data }) => data?.slate && data.slate.length > 0 ? (
              <div key={label} className="mb-4 last:mb-0">
                <h4 className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-2">{label} · {data.games} games</h4>
                <div className="space-y-1">
                  {data.slate.map(game => (
                    <div key={game.gameID} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-zinc-900/30">
                      <div className="flex items-center gap-2 flex-1 min-w-0 text-xs">
                        <img src={teamLogo(game.away)} alt="" className="h-4 w-4" />
                        <span className="font-medium text-foreground">{game.away}</span>
                        <span className="text-zinc-600">@</span>
                        <span className="font-medium text-foreground">{game.home}</span>
                        <img src={teamLogo(game.home)} alt="" className="h-4 w-4" />
                        <span className="text-zinc-600 text-[10px]">{game.gameTime}</span>
                        <span className="text-zinc-700 text-[10px] hidden sm:inline">{game.awayPitcher} vs {game.homePitcher}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {game.beatWriter && (
                          <span className="text-[10px] text-zinc-500 flex items-center gap-0.5">
                            <span>{game.beatWriterAvatar}</span>
                            <span className="hidden sm:inline">{game.beatWriter}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null)}
          </CardContent>
        </Card>
      ) : null}

      {/* Assignment Form */}
      <Card className="mb-8 border-amber-500/20">
        <CardContent className="p-5 space-y-4">

          {/* Step 1: Topic or Game */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium block mb-2">
              1. What's the story?
            </label>
            <Input
              placeholder="e.g. 'Which AL team is most likely to collapse in June?' or 'Write about yesterday's blowout'"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="bg-zinc-900/50 border-border/50"
            />
          </div>

          {/* Optional: Link a game — today's upcoming + yesterday's completed */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium block mb-2">
              2. Link a game (optional)
            </label>

            {/* Today's games from slate */}
            {slateData?.slate && slateData.slate.length > 0 && (
              <div className="mb-2">
                <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Today's Games</span>
                <div className="flex gap-1.5 overflow-x-auto pb-1 mt-1">
                  {slateData.slate.map(g => (
                    <Button
                      key={g.gameID}
                      size="sm"
                      variant={selectedGame === g.gameID ? "default" : "outline"}
                      onClick={() => { setSelectedGame(g.gameID); if (!topic) setTopic(`Preview: ${g.awayName} @ ${g.homeName}`); if (g.beatWriter) setSelectedWriters(new Set([g.beatWriter])); }}
                      className="flex-shrink-0 text-xs"
                    >
                      <img src={teamLogo(g.away)} alt="" className="h-3.5 w-3.5 mr-1" />
                      {g.away}@{g.home}
                      <img src={teamLogo(g.home)} alt="" className="h-3.5 w-3.5 ml-1" />
                      <span className="text-zinc-500 ml-1">{g.gameTime}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Yesterday's completed games */}
            <div>
              <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Yesterday's Results</span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 mt-1">
                <Button
                  size="sm"
                  variant={selectedGame === null ? "default" : "outline"}
                  onClick={() => setSelectedGame(null)}
                  className="flex-shrink-0 text-xs"
                >
                  No game
                </Button>
              {(availableData?.games || []).map(g => (
                <Button
                  key={g.gameID}
                  size="sm"
                  variant={selectedGame === g.gameID ? "default" : "outline"}
                  onClick={() => setSelectedGame(g.gameID)}
                  className="flex-shrink-0 text-xs"
                >
                  <img src={teamLogo(g.away)} alt="" className="h-3.5 w-3.5 mr-1" />
                  {g.away} {g.awayScore}-{g.homeScore} {g.home}
                  <img src={teamLogo(g.home)} alt="" className="h-3.5 w-3.5 ml-1" />
                </Button>
              ))}
              </div>
            </div>
          </div>

          {/* Story options row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium block mb-1.5">
                <Ruler className="h-3 w-3 inline mr-1" />Length
              </label>
              <Select value={storyLength} onValueChange={(v: any) => setStoryLength(v)}>
                <SelectTrigger className="h-8 text-xs bg-zinc-900/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (2-3 paragraphs)</SelectItem>
                  <SelectItem value="medium">Medium (4-5 paragraphs)</SelectItem>
                  <SelectItem value="long">Long (6-8 paragraphs)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium block mb-1.5">
                <Flame className="h-3 w-3 inline mr-1" />Tone Override
              </label>
              <Select value={tone} onValueChange={(v: any) => setTone(v)}>
                <SelectTrigger className="h-8 text-xs bg-zinc-900/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sarcastic">Sarcastic (default)</SelectItem>
                  <SelectItem value="analytical">Analytical</SelectItem>
                  <SelectItem value="dramatic">Dramatic</SelectItem>
                  <SelectItem value="heartfelt">Heartfelt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium block mb-1.5">
                <MessageSquare className="h-3 w-3 inline mr-1" />Story Angle
              </label>
              <Select value={angle} onValueChange={(v: any) => setAngle(v)}>
                <SelectTrigger className="h-8 text-xs bg-zinc-900/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recap">Game Recap</SelectItem>
                  <SelectItem value="opinion">Hot Take / Opinion</SelectItem>
                  <SelectItem value="breakdown">Statistical Breakdown</SelectItem>
                  <SelectItem value="human-interest">Human Interest</SelectItem>
                  <SelectItem value="rivalry">Rivalry / History</SelectItem>
                  <SelectItem value="what-if">What If / Hypothetical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium block mb-1.5">
                <User className="h-3 w-3 inline mr-1" />Player Focus (optional)
              </label>
              <Input
                placeholder="e.g. Aaron Judge, Shohei Ohtani"
                value={playerFocus}
                onChange={(e) => setPlayerFocus(e.target.value)}
                className="h-8 text-xs bg-zinc-900/50 border-border/50"
              />
            </div>
          </div>

          {/* Step 3: Pick writers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                3. Assign writers ({selectedWriters.size} selected)
              </label>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="text-xs h-6" onClick={selectAllWriters}>All</Button>
                <Button size="sm" variant="ghost" className="text-xs h-6" onClick={clearWriters}>None</Button>
                <Button size="sm" variant="ghost" className="text-xs h-6" onClick={() => setShowWriterPicker(!showWriterPicker)}>
                  {showWriterPicker ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </div>
            </div>

            {/* Quick select: selected writers as badges */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {BEAT_WRITERS.filter(w => selectedWriters.has(w.name)).map(w => (
                <Badge
                  key={w.name}
                  className={`cursor-pointer text-xs ${moodColors[w.mood]} border`}
                  onClick={() => toggleWriter(w.name)}
                >
                  {w.avatar} {w.name} ×
                </Badge>
              ))}
              {selectedWriters.size === 0 && (
                <span className="text-xs text-zinc-600 italic">Click writers below to assign them</span>
              )}
            </div>

            {/* Full writer grid */}
            {showWriterPicker && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 max-h-64 overflow-y-auto p-1">
                {BEAT_WRITERS.map(w => {
                  const selected = selectedWriters.has(w.name);
                  return (
                    <button
                      key={w.name}
                      onClick={() => toggleWriter(w.name)}
                      className={`p-2 rounded-lg text-left text-xs transition-all border ${
                        selected
                          ? 'bg-amber-500/10 border-amber-500/30 text-foreground'
                          : 'bg-zinc-900/30 border-border/30 text-muted-foreground hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{w.avatar}</span>
                        <span className="font-medium truncate">{w.name}</span>
                        {selected && <CheckCircle className="h-3 w-3 text-amber-400 flex-shrink-0 ml-auto" />}
                      </div>
                      <div className="text-[10px] text-zinc-600 mt-0.5 capitalize">{w.mood}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submit */}
          <Button
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            disabled={assignMutation.isPending || (!topic && !selectedGame) || selectedWriters.size === 0}
            onClick={() => assignMutation.mutate()}
          >
            {assignMutation.isPending ? (
              <><Clock className="h-4 w-4 mr-2 animate-spin" />Writing {selectedWriters.size} columns...</>
            ) : (
              <><Send className="h-4 w-4 mr-2" />Send to {selectedWriters.size} writer{selectedWriters.size !== 1 ? 's' : ''}</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Past Assignments */}
      {Object.keys(assignments).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Pen className="h-3.5 w-3.5" />
            Past Assignments
          </h2>

          <div className="space-y-4">
            {Object.entries(assignments).reverse().map(([assignmentId, cols]) => (
              <Card key={assignmentId} className="border-border/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-medium text-foreground">{cols[0]?.topic?.slice(0, 80)}</CardTitle>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {cols.length} writer{cols.length !== 1 ? 's' : ''} · {format(new Date(cols[0]?.createdAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <Badge className="bg-zinc-800 text-zinc-400 border border-zinc-700 text-xs">{cols.length} takes</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {cols.map((col) => {
                    const writer = BEAT_WRITERS.find(w => w.name === col.author);
                    const isExpanded = expandedColumn === col.id;
                    return (
                      <div key={col.id} className="border border-border/20 rounded-lg overflow-hidden">
                        <button
                          className="w-full p-3 flex items-center justify-between hover:bg-zinc-800/30 transition-colors text-left"
                          onClick={() => setExpandedColumn(isExpanded ? null : col.id)}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-lg">{writer?.avatar || '✍️'}</span>
                            <div className="min-w-0">
                              <span className="text-sm font-medium text-foreground">{col.author}</span>
                              <span className="text-xs text-muted-foreground ml-2 truncate">— {col.title}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {col.authorMood && (
                              <Badge className={`border text-[9px] ${moodColors[col.authorMood] || ''}`}>{col.authorMood}</Badge>
                            )}
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-zinc-500" /> : <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-border/20">
                            <h3 className="text-base font-bold text-foreground mt-3 mb-1">{col.title}</h3>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs text-muted-foreground">{col.author}</span>
                              {writer && (
                                <span className="text-[10px] text-zinc-600 italic">"{writer.catchphrase}"</span>
                              )}
                            </div>
                            <div className="space-y-3">
                              {col.content.split('\n').map((p, i) => {
                                const t = p.trim();
                                if (!t) return null;
                                if (t.toLowerCase().includes('final verdict')) {
                                  return <div key={i} className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-emerald-400 font-medium italic text-sm">{t.replace(/\*\*/g, '')}</div>;
                                }
                                const html = t.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
                                return <p key={i} className="text-sm text-zinc-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
                              })}
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                              <div className="text-[10px] text-zinc-600 flex items-center gap-1">
                                <Sparkles className="h-2.5 w-2.5 text-amber-400" />
                                Written by {col.author} · {format(new Date(col.createdAt), 'MMM d, h:mm a')}
                              </div>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7"
                                disabled={publishMutation.isPending}
                                onClick={(e) => { e.stopPropagation(); publishMutation.mutate(col.id); }}
                              >
                                <Upload className="h-3 w-3 mr-1" />
                                {publishMutation.isPending && publishMutation.variables === col.id ? 'Publishing...' : 'Publish to Morning Roast'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
