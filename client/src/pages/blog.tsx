import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Newspaper, ChevronLeft, Pen, Sparkles, Calendar, Clock, MapPin, Users, ArrowRight, CloudRain, Share2, Copy, Check, BookOpen } from "lucide-react";
import { format, subDays } from "date-fns";

interface BlogReview {
  id: number;
  gameId: string;
  gameDate: string;
  awayTeam: string;
  homeTeam: string;
  awayScore: number;
  homeScore: number;
  title: string;
  content: string;
  slug: string;
  author: string;
  authorMood?: string;
  venue?: string;
  weather?: string;
  attendance?: string;
  heroImage?: string;
  awayLogo?: string;
  homeLogo?: string;
  espnRecap?: string;
  createdAt: string;
}

interface AvailableGame {
  gameID: string;
  away: string;
  home: string;
  awayScore: number;
  homeScore: number;
  hasReview: boolean;
  date: string;
}

export default function Blog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedReview, setSelectedReview] = useState<BlogReview | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [copied, setCopied] = useState(false);
  const isAdmin = user?.isAdmin;

  const { data: reviews = [], isLoading } = useQuery<BlogReview[]>({
    queryKey: ['/api/blog/reviews'],
    queryFn: () => fetch('/api/blog/reviews', { credentials: 'include' }).then(r => r.json()),
  });

  const { data: relatedFromApi = [] } = useQuery<BlogReview[]>({
    queryKey: ['/api/blog/related', selectedReview?.slug],
    queryFn: () => {
      if (!selectedReview) return Promise.resolve([]);
      const params = new URLSearchParams({
        slug: selectedReview.slug,
        author: selectedReview.author,
        gameDate: selectedReview.gameDate || '',
        limit: '4',
      });
      return fetch(`/api/blog/related?${params}`).then(r => r.ok ? r.json() : []);
    },
    enabled: !!selectedReview,
    staleTime: 300_000,
  });

  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const { data: availableData } = useQuery<{ date: string; games: AvailableGame[]; reviewedCount: number; totalCompleted: number }>({
    queryKey: ['/api/blog/available-games', yesterday],
    queryFn: () => fetch(`/api/blog/available-games?date=${yesterday}`, { credentials: 'include' }).then(r => r.json()),
    enabled: !!isAdmin && showAdmin,
  });

  const generateMutation = useMutation({
    mutationFn: async (game: AvailableGame) => {
      const resp = await fetch('/api/blog/generate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ gameID: game.gameID, date: game.date }),
      });
      if (!resp.ok) throw new Error((await resp.json()).error || 'Failed');
      return resp.json();
    },
    onSuccess: (data) => {
      toast({ title: data.alreadyExisted ? 'Review exists' : 'Review generated!', description: data.review.title });
      queryClient.invalidateQueries({ queryKey: ['/api/blog/reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog/available-games'] });
    },
    onError: (err: any) => {
      toast({ title: 'Generation failed', description: err.message, variant: 'destructive' });
    },
  });

  // ── Single Article View ──
  if (selectedReview) {
    // Reading time estimate
    const wordCount = selectedReview.content.split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // Auto-detect category tags from content + score
    const scoreDiff = Math.abs(selectedReview.awayScore - selectedReview.homeScore);
    const tags: string[] = [];
    if (scoreDiff >= 6) tags.push('Blowout');
    if (selectedReview.awayScore === 0 || selectedReview.homeScore === 0) tags.push('Shutout');
    if (selectedReview.content.toLowerCase().includes('walk-off') || selectedReview.content.toLowerCase().includes('walkoff')) tags.push('Walk-Off');
    if (selectedReview.content.toLowerCase().includes('extra inning')) tags.push('Extras');
    if (scoreDiff <= 1) tags.push('Nail-Biter');

    // Related stories — from dedicated endpoint (broader pool, server-deduped)
    const fallbackByAuthor = reviews.filter(r => r.id !== selectedReview.id && r.author === selectedReview.author).slice(0, 2);
    const fallbackByDate = reviews.filter(r => r.id !== selectedReview.id && r.gameDate === selectedReview.gameDate && !fallbackByAuthor.find(ra => ra.id === r.id)).slice(0, 2);
    const fallback = [...fallbackByAuthor, ...fallbackByDate].slice(0, 4);
    const relatedStories = relatedFromApi.length > 0 ? relatedFromApi : fallback;
    const relatedByAuthor = fallbackByAuthor;

    const shareUrl = `${window.location.origin}/blog#${selectedReview.slug}`;
    const copyLink = () => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(selectedReview.title)}&url=${encodeURIComponent(shareUrl)}`;

    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-foreground" onClick={() => setSelectedReview(null)}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to The Morning Roast
        </Button>

        <article>
          {/* Hero image */}
          {selectedReview.heroImage && (
            <div className="relative rounded-xl overflow-hidden mb-6 aspect-video bg-zinc-900">
              <img src={selectedReview.heroImage} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-3">
                  {selectedReview.awayLogo && <img src={selectedReview.awayLogo} alt="" className="h-8 w-8" />}
                  <span className="text-white/80 text-sm font-bold tabular-nums">{selectedReview.awayScore} - {selectedReview.homeScore}</span>
                  {selectedReview.homeLogo && <img src={selectedReview.homeLogo} alt="" className="h-8 w-8" />}
                </div>
              </div>
            </div>
          )}

          {/* Category tags */}
          {tags.length > 0 && (
            <div className="flex items-center gap-1.5 mb-3">
              {tags.map(tag => (
                <Badge key={tag} className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">{tag}</Badge>
              ))}
            </div>
          )}

          {/* Headline */}
          <h1 className="text-3xl font-bold text-foreground mb-4 leading-tight">{selectedReview.title}</h1>

          {/* Byline + reading time + share */}
          <div className="flex items-center gap-3 mb-2 pb-4 border-b border-border/30">
            <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
              <Pen className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{selectedReview.author}</span>
                {selectedReview.authorMood === 'grumpy' && <Badge className="bg-red-500/15 text-red-400 border border-red-500/20 text-[10px] px-1.5 py-0">Grumpy</Badge>}
                <WriterFollowButton author={selectedReview.author} />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{selectedReview.gameDate}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{readingTime} min read</span>
                {selectedReview.venue && <><span>·</span><span>{selectedReview.venue}</span></>}
              </div>
            </div>
            {/* Share buttons */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <a href={tweetUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-zinc-800 transition-colors text-muted-foreground hover:text-foreground" title="Share on X">
                <Share2 className="h-3.5 w-3.5" />
              </a>
              <button onClick={copyLink} className="p-1.5 rounded hover:bg-zinc-800 transition-colors text-muted-foreground hover:text-foreground" title="Copy link">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Game context bar */}
          <div className="flex flex-wrap items-center gap-3 py-3 mb-6 text-xs text-muted-foreground">
            <span>{selectedReview.awayTeam} @ {selectedReview.homeTeam}</span>
            {selectedReview.weather && <span className="flex items-center gap-1"><CloudRain className="h-3 w-3" />{selectedReview.weather}</span>}
            {selectedReview.attendance && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{selectedReview.attendance}</span>}
          </div>

          {/* Article body */}
          <div className="space-y-4 article-body">
            {selectedReview.content.split('\n').map((paragraph, i) => {
              const trimmed = paragraph.trim();
              if (!trimmed) return null;
              if (trimmed.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold text-foreground mt-6 mb-2">{trimmed.replace(/^###\s*/, '')}</h3>;
              if (trimmed.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-foreground mt-8 mb-3">{trimmed.replace(/^##\s*/, '')}</h2>;
              if (trimmed.toLowerCase().includes('final verdict')) {
                return <div key={i} className="mt-8 p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl"><p className="text-amber-400 font-semibold text-base italic">{trimmed.replace(/\*\*/g, '').replace(/\*/g, '')}</p></div>;
              }
              const html = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
              return <p key={i} className="text-[15px] text-zinc-400 leading-[1.7]" dangerouslySetInnerHTML={{ __html: html }} />;
            })}
          </div>

          {/* Related stories */}
          {relatedStories.length > 0 && (
            <div className="mt-10 pt-6 border-t border-border/30">
              <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">
                {relatedByAuthor.length > 0 ? `More from ${selectedReview.author}` : 'More from this day'}
              </h3>
              <div className="space-y-3">
                {relatedStories.map(r => (
                  <button key={r.id} onClick={() => setSelectedReview(r)} className="flex items-center gap-3 w-full text-left group">
                    {r.heroImage ? (
                      <img src={r.heroImage} alt="" className="w-16 h-10 rounded object-cover flex-shrink-0 bg-zinc-900" />
                    ) : (
                      <div className="w-16 h-10 rounded bg-zinc-900 flex-shrink-0 flex items-center justify-center">
                        {r.awayLogo && <img src={r.awayLogo} alt="" className="h-4 w-4 opacity-40" />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground group-hover:text-amber-200 transition-colors line-clamp-1">{r.title}</div>
                      <div className="text-[10px] text-muted-foreground">{r.author} · {r.awayTeam.split(' ').pop()} {r.awayScore}-{r.homeScore} {r.homeTeam.split(' ').pop()}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-border/30 text-xs text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-amber-400" />
            Written by {selectedReview.author} | AI-assisted sarcastic recap | For entertainment purposes only
          </div>

          <ArticleComments reviewId={selectedReview.id} />
        </article>
      </div>
    );
  }

  // ── Blog Feed ──
  const featured = reviews[0];
  const rest = reviews.slice(1);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">The Morning Roast</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Yesterday's games. Today's hot takes. AI-powered sarcasm at its finest.
          </p>
        </div>
        {isAdmin && (
          <Button variant="outline" onClick={() => setShowAdmin(!showAdmin)}
            className={showAdmin ? 'border-amber-500/30 text-amber-400' : ''}>
            <Pen className="h-4 w-4 mr-2" />
            {showAdmin ? 'Hide Admin' : 'Generate'}
          </Button>
        )}
      </div>

      {/* Admin panel */}
      {isAdmin && showAdmin && (
        <Card className="mb-8 border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Yesterday's Games ({yesterday})
              </h3>
              {availableData && (
                <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs">
                  {availableData.reviewedCount}/{availableData.totalCompleted} done
                </Badge>
              )}
            </div>
            {availableData?.games?.length ? (
              <>
                <div className="space-y-1.5 mb-3">
                  {availableData.games.map((game) => (
                    <div key={game.gameID} className="flex items-center justify-between p-2.5 bg-zinc-900/50 border border-border/50 rounded-lg text-sm">
                      <span className="font-medium tabular-nums">{game.away} {game.awayScore} - {game.homeScore} {game.home}</span>
                      <Button size="sm" variant="outline" disabled={game.hasReview || generateMutation.isPending}
                        onClick={() => generateMutation.mutate(game)}
                        className={game.hasReview ? 'opacity-50' : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'}>
                        {generateMutation.isPending && generateMutation.variables?.gameID === game.gameID
                          ? <><Clock className="h-3 w-3 mr-1 animate-spin" />Writing...</>
                          : game.hasReview ? 'Done' : <><Sparkles className="h-3 w-3 mr-1" />Write</>}
                      </Button>
                    </div>
                  ))}
                </div>
                <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white" disabled={generateMutation.isPending || !availableData.games.some(g => !g.hasReview)}
                  onClick={async () => { for (const g of availableData.games.filter(g => !g.hasReview)) await generateMutation.mutateAsync(g); }}>
                  <Sparkles className="h-4 w-4 mr-2" />Write All Remaining
                </Button>
              </>
            ) : <p className="text-sm text-muted-foreground">Loading games...</p>}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && reviews.length === 0 && (
        <Card>
          <CardContent className="p-16 text-center">
            <Newspaper className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No stories yet</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {isAdmin ? "Hit 'Generate' above to put your beat writers to work on yesterday's games." : "Check back tomorrow for sarcastic game recaps from our AI beat writers."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Featured story (first review) */}
      {featured && (
        <div className="mb-8 cursor-pointer group" onClick={() => setSelectedReview(featured)}>
          <div className="relative rounded-xl overflow-hidden aspect-video sm:aspect-[21/9] bg-zinc-900 mb-4">
            {featured.heroImage ? (
              <img src={featured.heroImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                <div className="flex items-center gap-6">
                  {featured.awayLogo && <img src={featured.awayLogo} alt="" className="h-20 w-20 opacity-60" />}
                  <span className="text-4xl font-bold text-zinc-600 tabular-nums">{featured.awayScore} - {featured.homeScore}</span>
                  {featured.homeLogo && <img src={featured.homeLogo} alt="" className="h-20 w-20 opacity-60" />}
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <Badge className="bg-amber-500/90 text-black text-[10px] font-bold mb-3 uppercase tracking-wider">Featured</Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-2 group-hover:text-amber-200 transition-colors">
                {featured.title}
              </h2>
              <div className="flex items-center gap-3 text-white/70 text-sm">
                <span className="flex items-center gap-1"><Pen className="h-3 w-3 text-amber-400" />{featured.author}</span>
                <span>{featured.awayTeam.split(' ').pop()} {featured.awayScore} - {featured.homeScore} {featured.homeTeam.split(' ').pop()}</span>
                {featured.venue && <span className="hidden sm:inline">{featured.venue}</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rest of stories — grid layout */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rest.map((review) => (
            <Card key={review.id} className="card-glow cursor-pointer border-border/30 overflow-hidden group" onClick={() => setSelectedReview(review)}>
              {/* Card hero */}
              <div className="relative aspect-video bg-zinc-900 overflow-hidden">
                {review.heroImage ? (
                  <img src={review.heroImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                    <div className="flex items-center gap-3">
                      {review.awayLogo && <img src={review.awayLogo} alt="" className="h-10 w-10 opacity-50" />}
                      <span className="text-lg font-bold text-zinc-600 tabular-nums">{review.awayScore}-{review.homeScore}</span>
                      {review.homeLogo && <img src={review.homeLogo} alt="" className="h-10 w-10 opacity-50" />}
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-2 left-3 right-3">
                  <span className="text-white/70 text-xs">
                    {review.awayTeam.split(' ').pop()} {review.awayScore} - {review.homeScore} {review.homeTeam.split(' ').pop()}
                  </span>
                </div>
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-2 leading-snug line-clamp-2 group-hover:text-amber-200 transition-colors">
                  {review.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {review.content.replace(/[#*]/g, '').slice(0, 120)}...
                </p>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Pen className="h-3 w-3 text-amber-400/70" />
                    {review.author}
                    {review.authorMood === 'grumpy' && <span className="text-red-400">(grumpy)</span>}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground/60">
                    Read <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse overflow-hidden">
              <div className="aspect-video bg-muted" />
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full mb-1"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface ArticleCommentRow {
  id: number;
  reviewId: number;
  userId: number;
  parentId: number | null;
  body: string;
  username: string | null;
  createdAt: string;
}

function ArticleComments({ reviewId }: { reviewId: number }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const { data: comments = [], isLoading } = useQuery<ArticleCommentRow[]>({
    queryKey: ["/api/blog/comments", reviewId],
    queryFn: () => fetch(`/api/blog/comments?reviewId=${reviewId}`).then((r) => (r.ok ? r.json() : [])),
    staleTime: 30_000,
  });

  const postMutation = useMutation({
    mutationFn: async ({ body, parentId }: { body: string; parentId: number | null }) => {
      const res = await fetch("/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reviewId, body, parentId }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/blog/comments", reviewId] });
      setDraft("");
      setReplyingTo(null);
    },
  });

  const safe = Array.isArray(comments) ? comments : [];
  const topLevel = safe.filter((c) => !c.parentId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const repliesFor = (parentId: number) =>
    safe.filter((c) => c.parentId === parentId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <section className="mt-10 pt-6 border-t border-border/30">
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
        Comments ({safe.length})
      </h3>

      {user ? (
        <form
          className="mb-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) postMutation.mutate({ body: draft.trim(), parentId: null });
          }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Share a take..."
            maxLength={2000}
            rows={3}
            className="w-full p-3 text-sm bg-zinc-900 border border-border/30 rounded-lg resize-none focus:outline-none focus:border-amber-500/40"
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={!draft.trim() || postMutation.isPending}
              className="px-4 py-1.5 text-xs font-medium rounded-md bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white transition-colors"
            >
              {postMutation.isPending ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground mb-6">Sign in to join the discussion.</p>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-zinc-900/40 rounded animate-pulse" />
          ))}
        </div>
      ) : topLevel.length === 0 ? (
        <p className="text-xs text-muted-foreground">Be the first to comment.</p>
      ) : (
        <div className="space-y-4">
          {topLevel.map((c) => (
            <div key={c.id} className="bg-zinc-900/40 border border-border/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-6 w-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[10px] font-bold text-amber-300">
                  {(c.username || "?").charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-foreground">{c.username || `User #${c.userId}`}</span>
                <span className="text-[10px] text-zinc-600">{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{c.body}</p>
              {user && (
                <button
                  onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                  className="text-[10px] text-zinc-500 hover:text-amber-400 mt-2 transition-colors"
                >
                  {replyingTo === c.id ? "Cancel" : "Reply"}
                </button>
              )}
              {replyingTo === c.id && user && (
                <form
                  className="mt-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (draft.trim()) postMutation.mutate({ body: draft.trim(), parentId: c.id });
                  }}
                >
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Reply..."
                    rows={2}
                    maxLength={2000}
                    className="w-full p-2 text-xs bg-zinc-950 border border-border/30 rounded focus:outline-none focus:border-amber-500/40"
                  />
                  <div className="flex justify-end mt-1">
                    <button
                      type="submit"
                      disabled={!draft.trim() || postMutation.isPending}
                      className="px-3 py-1 text-[11px] font-medium rounded bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white"
                    >
                      Reply
                    </button>
                  </div>
                </form>
              )}
              {repliesFor(c.id).length > 0 && (
                <div className="mt-3 pl-4 border-l-2 border-border/20 space-y-2">
                  {repliesFor(c.id).map((r) => (
                    <div key={r.id} className="text-xs">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-foreground">{r.username || `User #${r.userId}`}</span>
                        <span className="text-[10px] text-zinc-600">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-zinc-400 whitespace-pre-wrap">{r.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function WriterFollowButton({ author }: { author: string }) {
  const qc = useQueryClient();
  const { data: follows = [] } = useQuery<Array<{ author: string }>>({
    queryKey: ["/api/blog/writer-follows"],
    queryFn: () => fetch("/api/blog/writer-follows", { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
    staleTime: 60_000,
  });
  const isFollowing = follows.some((f) => f.author === author);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/blog/writer-follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ author, action: isFollowing ? "unfollow" : "follow" }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/blog/writer-follows"] }),
  });

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
        isFollowing
          ? "bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/10"
          : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200"
      }`}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
