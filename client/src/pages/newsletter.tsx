import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, Calendar, ArrowRight, ExternalLink, CheckCircle, Send } from "lucide-react";

interface NewsletterSummary {
  id: number;
  subject: string;
  previewText: string;
  edition: string;
  slug: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

export default function Newsletter() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const { data: archive = [] } = useQuery<NewsletterSummary[]>({
    queryKey: ['/api/newsletter/archive'],
    queryFn: () => fetch('/api/newsletter/archive').then(r => r.json()),
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const resp = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      if (!resp.ok) throw new Error('Failed to subscribe');
      return resp.json();
    },
    onSuccess: () => {
      setSubscribed(true);
      toast({ title: 'Subscribed!', description: "You'll get the next edition in your inbox." });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Something went wrong. Try again.', variant: 'destructive' });
    },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Subscribe hero */}
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <Mail className="h-7 w-7 text-emerald-400" />
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">The Daily Brief</h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Yesterday's results, today's quick picks, and weather watch — delivered to your inbox every morning.
        </p>

        {subscribed ? (
          <div className="flex items-center justify-center gap-2 text-emerald-400">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">You're subscribed! Check your inbox.</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <Input
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-zinc-900/50 border-border/50 text-sm"
            />
            <Input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-900/50 border-border/50 text-sm flex-1"
            />
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!email || subscribeMutation.isPending}
              onClick={() => subscribeMutation.mutate()}
            >
              <Send className="h-4 w-4 mr-1" />
              {subscribeMutation.isPending ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </div>
        )}
        <p className="text-[10px] text-zinc-600 mt-3">Free. Unsubscribe anytime. No spam, just sports.</p>
      </div>

      {/* Archive */}
      {archive.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            Past Editions
          </h2>
          <div className="space-y-2">
            {archive.map((nl) => (
              <Card key={nl.id} className="border-border/30 hover:border-emerald-500/20 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground text-sm truncate">{nl.subject}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{nl.edition}</span>
                      {nl.previewText && <span className="truncate hidden sm:inline">{nl.previewText}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <Badge className={nl.status === 'sent' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px]' : 'bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px]'}>
                      {nl.status}
                    </Badge>
                    <a href={`/api/newsletter/${nl.slug}/view`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3 w-3 mr-1" /> View
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {archive.length === 0 && (
        <Card className="border-border/30 border-dashed">
          <CardContent className="p-10 text-center">
            <Mail className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No editions yet. The first one is coming soon.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
