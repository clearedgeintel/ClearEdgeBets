import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pen, BookOpen, Clock, Star, Quote } from "lucide-react";
import { BEAT_WRITERS, type BeatWriter } from "@shared/beat-writers";
import { useState } from "react";

interface BlogReview {
  id: number;
  author: string;
  title: string;
  gameDate: string;
  awayTeam: string;
  homeTeam: string;
  awayScore: number;
  homeScore: number;
}

const moodColors: Record<string, string> = {
  witty: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  grumpy: 'bg-red-500/15 text-red-400 border-red-500/20',
  dramatic: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  nerdy: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  folksy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
};

const moodLabels: Record<string, string> = {
  witty: 'Sharp & Witty',
  grumpy: 'Perpetually Grumpy',
  dramatic: 'Maximum Drama',
  nerdy: 'Stats & Nerdy',
  folksy: 'Folksy Charm',
};

export default function Writers() {
  const [selectedWriter, setSelectedWriter] = useState<BeatWriter | null>(null);

  // Fetch reviews to count per author
  const { data: reviews = [] } = useQuery<BlogReview[]>({
    queryKey: ['/api/blog/reviews'],
    queryFn: () => fetch('/api/blog/reviews', { credentials: 'include' }).then(r => r.json()),
  });

  const storyCountByAuthor = reviews.reduce<Record<string, number>>((acc, r) => {
    acc[r.author] = (acc[r.author] || 0) + 1;
    return acc;
  }, {});

  const authorReviews = selectedWriter
    ? reviews.filter(r => r.author === selectedWriter.name)
    : [];

  if (selectedWriter) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => setSelectedWriter(null)}
          className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1"
        >
          ← Back to all writers
        </button>

        {/* Writer profile hero */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{selectedWriter.avatar}</div>
          <h1 className="text-3xl font-bold text-foreground">{selectedWriter.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">{selectedWriter.title}</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge className={`border text-xs ${moodColors[selectedWriter.mood]}`}>
              {moodLabels[selectedWriter.mood]}
            </Badge>
            <Badge className="bg-zinc-800 text-zinc-400 border border-zinc-700 text-xs">
              {selectedWriter.yearsExperience} years
            </Badge>
            {selectedWriter.favoriteTeam && (
              <Badge className="bg-zinc-800 text-zinc-400 border border-zinc-700 text-xs">
                Secret fan: {selectedWriter.favoriteTeam}
              </Badge>
            )}
          </div>
        </div>

        {/* Bio */}
        <Card className="mb-6 border-border/30">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">About</h3>
            <p className="text-foreground leading-relaxed">{selectedWriter.bio}</p>
          </CardContent>
        </Card>

        {/* Writing style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="border-border/30">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Pen className="h-3.5 w-3.5" /> Writing Quirks
              </h3>
              <ul className="space-y-2">
                {selectedWriter.quirks.map((q, i) => (
                  <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    {q}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/30">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Star className="h-3.5 w-3.5" /> Fast Facts
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Specialty:</span>
                  <span className="text-foreground ml-2">{selectedWriter.specialty}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Style:</span>
                  <span className="text-foreground ml-2 capitalize">{selectedWriter.mood}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Stories filed:</span>
                  <span className="text-foreground ml-2">{storyCountByAuthor[selectedWriter.name] || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Catchphrase */}
        <Card className="mb-6 border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Quote className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-foreground italic text-lg leading-relaxed">"{selectedWriter.catchphrase}"</p>
                <p className="text-muted-foreground text-xs mt-2">— {selectedWriter.name}'s signature</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent stories by this writer */}
        {authorReviews.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5" /> Recent Stories
            </h3>
            <div className="space-y-2">
              {authorReviews.map(r => (
                <Card key={r.id} className="border-border/30">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.awayTeam.split(' ').pop()} {r.awayScore} - {r.homeScore} {r.homeTeam.split(' ').pop()} · {r.gameDate}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Writers Grid ──
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">The Newsroom</h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-lg mx-auto">
          Meet the ClearEdge Sports beat writers. 25 distinct voices. Zero filter. All AI, all the time.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {BEAT_WRITERS.map((writer) => {
          const stories = storyCountByAuthor[writer.name] || 0;
          return (
            <Card
              key={writer.name}
              className="card-glow border-border/30 cursor-pointer group overflow-hidden"
              onClick={() => setSelectedWriter(writer)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-3xl">{writer.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground group-hover:text-amber-200 transition-colors">
                      {writer.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{writer.title}</p>
                  </div>
                  <Badge className={`border text-[10px] flex-shrink-0 ${moodColors[writer.mood]}`}>
                    {writer.mood}
                  </Badge>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 mb-3">
                  {writer.bio}
                </p>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />{writer.yearsExperience}yr
                    </span>
                    {stories > 0 && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-2.5 w-2.5" />{stories} stories
                      </span>
                    )}
                  </div>
                  <span className="text-amber-400/60 italic truncate max-w-[150px]">
                    "{writer.catchphrase.slice(0, 30)}..."
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
