import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Users, Target, Plus, X, Check, ChevronDown } from "lucide-react";

interface ExpertRow {
  id: string; name: string; title: string; avatar: string; bio: string;
  style: string; approach: string; specialty: string; pickTypes: string[];
  voiceDirective: string; riskLevel: string; maxPicksPerDay: number; isActive: boolean;
}

interface WriterRow {
  id: number; name: string; mood: string; title: string; bio: string;
  quirks: string[]; catchphrase: string; avatar: string; favoriteTeam: string | null;
  beatTeams: string[]; region: string | null; yearsExperience: number;
  specialty: string; isActive: boolean;
}

type Tab = 'experts' | 'writers';

export default function AdminRoster() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('experts');
  const [showExpertForm, setShowExpertForm] = useState(false);
  const [showWriterForm, setShowWriterForm] = useState(false);
  const [editingExpert, setEditingExpert] = useState<Partial<ExpertRow> | null>(null);
  const [editingWriter, setEditingWriter] = useState<Partial<WriterRow> | null>(null);
  const [expandedExpert, setExpandedExpert] = useState<string | null>(null);
  const [expandedWriter, setExpandedWriter] = useState<number | null>(null);

  const { data: experts = [] } = useQuery<ExpertRow[]>({
    queryKey: ['/api/admin/expert-analysts'],
    queryFn: () => fetch('/api/admin/expert-analysts', { credentials: 'include' }).then(r => r.json()),
  });

  const { data: writers = [] } = useQuery<WriterRow[]>({
    queryKey: ['/api/admin/beat-writers'],
    queryFn: () => fetch('/api/admin/beat-writers', { credentials: 'include' }).then(r => r.json()),
  });

  const toggleExpert = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/expert-analysts/${id}/toggle`, { method: 'PATCH', credentials: 'include' }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/admin/expert-analysts'] }); toast({ title: 'Expert updated' }); },
  });

  const toggleWriter = useMutation({
    mutationFn: (id: number) => fetch(`/api/admin/beat-writers/${id}/toggle`, { method: 'PATCH', credentials: 'include' }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/admin/beat-writers'] }); toast({ title: 'Writer updated' }); },
  });

  const saveExpert = useMutation({
    mutationFn: (data: any) => fetch('/api/admin/expert-analysts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(data),
    }).then(r => { if (!r.ok) throw new Error('Save failed'); return r.json(); }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/admin/expert-analysts'] });
      setShowExpertForm(false); setEditingExpert(null);
      toast({ title: 'Expert saved' });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const saveWriter = useMutation({
    mutationFn: (data: any) => fetch('/api/admin/beat-writers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(data),
    }).then(r => { if (!r.ok) throw new Error('Save failed'); return r.json(); }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/admin/beat-writers'] });
      setShowWriterForm(false); setEditingWriter(null);
      toast({ title: 'Writer saved' });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const activeExperts = experts.filter(e => e.isActive).length;
  const activeWriters = writers.filter(w => w.isActive).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Roster Management</h1>
        <p className="text-xs text-muted-foreground mt-1">Activate, deactivate, create and edit AI experts and beat writers</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <Button size="sm" variant={tab === 'experts' ? 'default' : 'outline'} onClick={() => setTab('experts')} className="text-xs">
          <Target className="h-3 w-3 mr-1" /> Experts ({activeExperts}/{experts.length})
        </Button>
        <Button size="sm" variant={tab === 'writers' ? 'default' : 'outline'} onClick={() => setTab('writers')} className="text-xs">
          <Users className="h-3 w-3 mr-1" /> Writers ({activeWriters}/{writers.length})
        </Button>
      </div>

      {/* ── Experts Tab ── */}
      {tab === 'experts' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" className="text-xs" onClick={() => { setEditingExpert({}); setShowExpertForm(true); }}>
              <Plus className="h-3 w-3 mr-1" /> New Expert
            </Button>
          </div>

          {experts.map(expert => (
            <Card key={expert.id} className={`border ${expert.isActive ? 'border-zinc-700/60' : 'border-zinc-800/40 opacity-60'}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setExpandedExpert(expandedExpert === expert.id ? null : expert.id)}>
                    <span className="text-2xl">{expert.avatar}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{expert.name}</span>
                        <Badge className={`text-[9px] ${expert.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-700 text-zinc-500'}`}>
                          {expert.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge className="text-[9px] bg-zinc-800 text-zinc-400 border-zinc-700">{expert.riskLevel}</Badge>
                      </div>
                      <p className="text-[10px] text-zinc-500">{expert.title} — {expert.specialty}</p>
                    </div>
                    <ChevronDown className={`h-3 w-3 text-zinc-600 ml-auto transition-transform ${expandedExpert === expert.id ? 'rotate-180' : ''}`} />
                  </div>
                  <div className="flex gap-1.5 ml-3">
                    <Button size="sm" variant="outline" className="h-7 text-[10px] px-2"
                      onClick={() => { setEditingExpert(expert); setShowExpertForm(true); }}>Edit</Button>
                    <Button size="sm" variant={expert.isActive ? 'destructive' : 'default'}
                      className="h-7 text-[10px] px-2"
                      onClick={() => toggleExpert.mutate(expert.id)}>
                      {expert.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
                {expandedExpert === expert.id && (
                  <div className="mt-3 pt-3 border-t border-border/20 text-xs text-zinc-400 space-y-1">
                    <p><span className="text-zinc-500">ID:</span> {expert.id}</p>
                    <p><span className="text-zinc-500">Pick Types:</span> {expert.pickTypes.join(', ')}</p>
                    <p><span className="text-zinc-500">Max Picks:</span> {expert.maxPicksPerDay}/day</p>
                    <p><span className="text-zinc-500">Style:</span> {expert.style}</p>
                    <p className="text-[11px] text-zinc-500 mt-2">{expert.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Expert Form Modal */}
          {showExpertForm && editingExpert && (
            <ExpertForm
              initial={editingExpert}
              onSave={(data) => saveExpert.mutate(data)}
              onCancel={() => { setShowExpertForm(false); setEditingExpert(null); }}
              saving={saveExpert.isPending}
            />
          )}
        </div>
      )}

      {/* ── Writers Tab ── */}
      {tab === 'writers' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" className="text-xs" onClick={() => { setEditingWriter({}); setShowWriterForm(true); }}>
              <Plus className="h-3 w-3 mr-1" /> New Writer
            </Button>
          </div>

          {writers.map(writer => (
            <Card key={writer.id} className={`border ${writer.isActive ? 'border-zinc-700/60' : 'border-zinc-800/40 opacity-60'}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setExpandedWriter(expandedWriter === writer.id ? null : writer.id)}>
                    <span className="text-2xl">{writer.avatar}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{writer.name}</span>
                        <Badge className={`text-[9px] ${writer.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-700 text-zinc-500'}`}>
                          {writer.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge className="text-[9px] bg-zinc-800 text-zinc-400 border-zinc-700">{writer.mood}</Badge>
                      </div>
                      <p className="text-[10px] text-zinc-500">{writer.title} — {writer.region || 'National'}</p>
                    </div>
                    <ChevronDown className={`h-3 w-3 text-zinc-600 ml-auto transition-transform ${expandedWriter === writer.id ? 'rotate-180' : ''}`} />
                  </div>
                  <div className="flex gap-1.5 ml-3">
                    <Button size="sm" variant="outline" className="h-7 text-[10px] px-2"
                      onClick={() => { setEditingWriter(writer); setShowWriterForm(true); }}>Edit</Button>
                    <Button size="sm" variant={writer.isActive ? 'destructive' : 'default'}
                      className="h-7 text-[10px] px-2"
                      onClick={() => toggleWriter.mutate(writer.id)}>
                      {writer.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
                {expandedWriter === writer.id && (
                  <div className="mt-3 pt-3 border-t border-border/20 text-xs text-zinc-400 space-y-1">
                    <p><span className="text-zinc-500">Beat Teams:</span> {writer.beatTeams.join(', ')}</p>
                    <p><span className="text-zinc-500">Experience:</span> {writer.yearsExperience} years</p>
                    <p><span className="text-zinc-500">Catchphrase:</span> "{writer.catchphrase}"</p>
                    <p><span className="text-zinc-500">Specialty:</span> {writer.specialty}</p>
                    <p className="text-[11px] text-zinc-500 mt-2">{writer.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {showWriterForm && editingWriter && (
            <WriterForm
              initial={editingWriter}
              onSave={(data) => saveWriter.mutate(data)}
              onCancel={() => { setShowWriterForm(false); setEditingWriter(null); }}
              saving={saveWriter.isPending}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ── Expert Create/Edit Form ── */
function ExpertForm({ initial, onSave, onCancel, saving }: {
  initial: Partial<ExpertRow>; onSave: (data: any) => void; onCancel: () => void; saving: boolean;
}) {
  const isNew = !initial.id || !initial.name;
  const [form, setForm] = useState({
    id: initial.id || '', name: initial.name || '', title: initial.title || '',
    avatar: initial.avatar || '🎯', bio: initial.bio || '', style: initial.style || '',
    approach: initial.approach || '', specialty: initial.specialty || '',
    pickTypes: initial.pickTypes?.join(', ') || 'moneyline',
    voiceDirective: initial.voiceDirective || '', riskLevel: initial.riskLevel || 'moderate',
    maxPicksPerDay: initial.maxPicksPerDay || 4,
  });

  const handleSubmit = () => {
    onSave({ ...form, pickTypes: form.pickTypes.split(',').map(s => s.trim()).filter(Boolean), maxPicksPerDay: Number(form.maxPicksPerDay) });
  };

  return (
    <Card className="border-emerald-500/30 mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          {isNew ? 'Create New Expert' : `Edit: ${initial.name}`}
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onCancel}><X className="h-3 w-3" /></Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Input placeholder="ID (slug)" value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} disabled={!isNew} className="text-xs h-8" />
          <Input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="text-xs h-8" />
          <Input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="text-xs h-8" />
          <Input placeholder="Avatar emoji" value={form.avatar} onChange={e => setForm({ ...form, avatar: e.target.value })} className="text-xs h-8 w-20" />
          <select value={form.riskLevel} onChange={e => setForm({ ...form, riskLevel: e.target.value })} className="text-xs h-8 bg-background border border-border rounded px-2">
            <option value="conservative">Conservative</option>
            <option value="moderate">Moderate</option>
            <option value="aggressive">Aggressive</option>
          </select>
          <Input type="number" placeholder="Max picks/day" value={form.maxPicksPerDay} onChange={e => setForm({ ...form, maxPicksPerDay: Number(e.target.value) })} className="text-xs h-8" />
        </div>
        <Input placeholder="Pick types (comma separated)" value={form.pickTypes} onChange={e => setForm({ ...form, pickTypes: e.target.value })} className="text-xs h-8" />
        <Input placeholder="Style (one-line)" value={form.style} onChange={e => setForm({ ...form, style: e.target.value })} className="text-xs h-8" />
        <Input placeholder="Specialty" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} className="text-xs h-8" />
        <Textarea placeholder="Bio" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className="text-xs min-h-[60px]" />
        <Textarea placeholder="Voice directive (prompt injection for AI)" value={form.voiceDirective} onChange={e => setForm({ ...form, voiceDirective: e.target.value })} className="text-xs min-h-[80px]" />
        <Button size="sm" className="w-full h-8 text-xs" onClick={handleSubmit} disabled={saving || !form.id || !form.name}>
          <Check className="h-3 w-3 mr-1" /> {saving ? 'Saving...' : isNew ? 'Create Expert' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ── Writer Create/Edit Form ── */
function WriterForm({ initial, onSave, onCancel, saving }: {
  initial: Partial<WriterRow>; onSave: (data: any) => void; onCancel: () => void; saving: boolean;
}) {
  const isNew = !initial.id;
  const [form, setForm] = useState({
    id: initial.id || undefined, name: initial.name || '', mood: initial.mood || 'witty',
    title: initial.title || '', bio: initial.bio || '', quirks: initial.quirks?.join(', ') || '',
    catchphrase: initial.catchphrase || '', avatar: initial.avatar || '✍️',
    favoriteTeam: initial.favoriteTeam || '', beatTeams: initial.beatTeams?.join(', ') || '',
    region: initial.region || '', yearsExperience: initial.yearsExperience || 10,
    specialty: initial.specialty || '',
  });

  const handleSubmit = () => {
    onSave({
      ...form,
      quirks: form.quirks.split(',').map(s => s.trim()).filter(Boolean),
      beatTeams: form.beatTeams.split(',').map(s => s.trim()).filter(Boolean),
      yearsExperience: Number(form.yearsExperience),
      favoriteTeam: form.favoriteTeam || null,
      region: form.region || null,
    });
  };

  return (
    <Card className="border-emerald-500/30 mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          {isNew ? 'Create New Writer' : `Edit: ${initial.name}`}
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onCancel}><X className="h-3 w-3" /></Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="text-xs h-8" />
          <Input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="text-xs h-8" />
          <Input placeholder="Avatar emoji" value={form.avatar} onChange={e => setForm({ ...form, avatar: e.target.value })} className="text-xs h-8 w-20" />
          <select value={form.mood} onChange={e => setForm({ ...form, mood: e.target.value })} className="text-xs h-8 bg-background border border-border rounded px-2">
            <option value="witty">Witty</option>
            <option value="grumpy">Grumpy</option>
            <option value="dramatic">Dramatic</option>
            <option value="nerdy">Nerdy</option>
            <option value="folksy">Folksy</option>
          </select>
          <Input type="number" placeholder="Years exp" value={form.yearsExperience} onChange={e => setForm({ ...form, yearsExperience: Number(e.target.value) })} className="text-xs h-8" />
          <Input placeholder="Region" value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} className="text-xs h-8" />
        </div>
        <Input placeholder="Beat teams (comma separated, e.g. NYY, BOS)" value={form.beatTeams} onChange={e => setForm({ ...form, beatTeams: e.target.value })} className="text-xs h-8" />
        <Input placeholder="Favorite team" value={form.favoriteTeam} onChange={e => setForm({ ...form, favoriteTeam: e.target.value })} className="text-xs h-8" />
        <Input placeholder="Specialty" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} className="text-xs h-8" />
        <Input placeholder="Catchphrase" value={form.catchphrase} onChange={e => setForm({ ...form, catchphrase: e.target.value })} className="text-xs h-8" />
        <Input placeholder="Quirks (comma separated)" value={form.quirks} onChange={e => setForm({ ...form, quirks: e.target.value })} className="text-xs h-8" />
        <Textarea placeholder="Bio" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className="text-xs min-h-[60px]" />
        <Button size="sm" className="w-full h-8 text-xs" onClick={handleSubmit} disabled={saving || !form.name}>
          <Check className="h-3 w-3 mr-1" /> {saving ? 'Saving...' : isNew ? 'Create Writer' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
}
