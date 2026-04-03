import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, Users, Send, Sparkles, Clock, CheckCircle, ExternalLink, BarChart3, UserMinus } from "lucide-react";
import { format } from "date-fns";

interface Subscriber {
  id: number;
  email: string;
  name: string | null;
  status: string;
  source: string;
  subscribedAt: string;
  unsubscribedAt: string | null;
}

interface Newsletter {
  id: number;
  subject: string;
  previewText: string;
  edition: string;
  slug: string;
  status: string;
  sentAt: string | null;
  recipientCount: number;
  openCount: number;
  clickCount: number;
  createdAt: string;
}

export default function AdminNewsletter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subData } = useQuery<{ total: number; active: number; unsubscribed: number; subscribers: Subscriber[] }>({
    queryKey: ['/api/admin/newsletter/subscribers'],
    queryFn: () => fetch('/api/admin/newsletter/subscribers', { credentials: 'include' }).then(r => r.json()),
  });

  const { data: newsletters = [] } = useQuery<Newsletter[]>({
    queryKey: ['/api/admin/newsletter/all'],
    queryFn: () => fetch('/api/admin/newsletter/all', { credentials: 'include' }).then(r => r.json()),
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const resp = await fetch('/api/admin/newsletter/generate', { method: 'POST', credentials: 'include' });
      if (!resp.ok) throw new Error((await resp.json()).error || 'Failed');
      return resp.json();
    },
    onSuccess: () => {
      toast({ title: 'Newsletter generated!', description: 'Draft ready for review.' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/newsletter/all'] });
    },
    onError: (err: any) => toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  });

  const markSentMutation = useMutation({
    mutationFn: async (id: number) => {
      const resp = await fetch(`/api/admin/newsletter/mark-sent/${id}`, { method: 'POST', credentials: 'include' });
      if (!resp.ok) throw new Error('Failed');
      return resp.json();
    },
    onSuccess: () => {
      toast({ title: 'Marked as sent' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/newsletter/all'] });
    },
  });

  const totalSent = newsletters.filter(n => n.status === 'sent').length;
  const totalRecipients = newsletters.reduce((s, n) => s + (n.recipientCount || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Mail className="h-6 w-6 text-emerald-400" />
            Newsletter Admin
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Generate, review, and track your daily newsletter.</p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={generateMutation.isPending}
          onClick={() => generateMutation.mutate()}
        >
          {generateMutation.isPending ? <><Clock className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Today's Edition</>}
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <Card className="border-border/30">
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
            <div className="text-2xl font-bold tabular-nums">{subData?.active || 0}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Active Subs</div>
          </CardContent>
        </Card>
        <Card className="border-border/30">
          <CardContent className="p-4 text-center">
            <UserMinus className="h-5 w-5 text-red-400 mx-auto mb-1" />
            <div className="text-2xl font-bold tabular-nums">{subData?.unsubscribed || 0}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Unsubscribed</div>
          </CardContent>
        </Card>
        <Card className="border-border/30">
          <CardContent className="p-4 text-center">
            <Send className="h-5 w-5 text-blue-400 mx-auto mb-1" />
            <div className="text-2xl font-bold tabular-nums">{totalSent}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Editions Sent</div>
          </CardContent>
        </Card>
        <Card className="border-border/30">
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-5 w-5 text-amber-400 mx-auto mb-1" />
            <div className="text-2xl font-bold tabular-nums">{totalRecipients}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Sends</div>
          </CardContent>
        </Card>
        <Card className="border-border/30">
          <CardContent className="p-4 text-center">
            <Mail className="h-5 w-5 text-purple-400 mx-auto mb-1" />
            <div className="text-2xl font-bold tabular-nums">{newsletters.length}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Editions</div>
          </CardContent>
        </Card>
      </div>

      {/* Newsletters */}
      <Card className="mb-8 border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Editions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {newsletters.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No editions yet. Click "Generate Today's Edition" to create one.</div>
          ) : (
            <div className="divide-y divide-border/20">
              {newsletters.map(nl => (
                <div key={nl.id} className="flex items-center justify-between p-4 hover:bg-zinc-800/20">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground">{nl.subject}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {nl.edition} · {nl.previewText}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {nl.recipientCount > 0 && (
                      <span className="text-[10px] text-muted-foreground tabular-nums">{nl.recipientCount} recipients</span>
                    )}
                    <Badge className={
                      nl.status === 'sent' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px]'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[10px]'
                    }>{nl.status}</Badge>
                    <a href={`/api/newsletter/${nl.slug}/view`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost" className="h-7 text-xs"><ExternalLink className="h-3 w-3 mr-1" />Preview</Button>
                    </a>
                    {nl.status === 'draft' && (
                      <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-500/30 text-emerald-400" disabled={markSentMutation.isPending}
                        onClick={() => markSentMutation.mutate(nl.id)}>
                        <CheckCircle className="h-3 w-3 mr-1" />Mark Sent
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscriber List */}
      <Card className="border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Subscribers ({subData?.total || 0})</span>
            <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs">{subData?.active || 0} active</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!subData?.subscribers?.length ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No subscribers yet.</div>
          ) : (
            <div className="divide-y divide-border/20 max-h-80 overflow-y-auto">
              {subData.subscribers.map(sub => (
                <div key={sub.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <div>
                    <span className="text-foreground">{sub.email}</span>
                    {sub.name && <span className="text-muted-foreground ml-2">({sub.name})</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{sub.source}</span>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(sub.subscribedAt), 'MMM d')}</span>
                    <Badge className={sub.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[9px]' : 'bg-red-500/15 text-red-400 border border-red-500/20 text-[9px]'}>
                      {sub.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
