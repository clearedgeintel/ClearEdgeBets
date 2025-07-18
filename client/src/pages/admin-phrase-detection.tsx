import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Brain, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  Home,
  Settings,
  RefreshCw,
  Check,
  X
} from "lucide-react";
import Header from "@/components/header";
import { apiRequest } from "@/lib/queryClient";

interface PhraseDetectionRule {
  id: number;
  phrase: string;
  category: string;
  description?: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

const phraseRuleSchema = z.object({
  phrase: z.string().min(1, "Phrase is required"),
  category: z.enum(["under", "over", "away_team", "home_team"], {
    required_error: "Category is required"
  }),
  description: z.string().optional(),
  priority: z.number().min(1).max(10).default(1)
});

type PhraseRuleFormData = z.infer<typeof phraseRuleSchema>;

function AddPhraseDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<PhraseRuleFormData>({
    resolver: zodResolver(phraseRuleSchema),
    defaultValues: {
      phrase: "",
      category: "under",
      description: "",
      priority: 1
    }
  });

  const addPhraseMutation = useMutation({
    mutationFn: async (data: PhraseRuleFormData) => {
      return await apiRequest("/api/admin/phrase-rules", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Phrase detection rule added successfully"
      });
      setOpen(false);
      form.reset();
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add phrase detection rule",
        variant: "destructive"
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Phrase Rule
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Phrase Detection Rule</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => addPhraseMutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="phrase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phrase</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., may suppress scoring" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under">Under (Total Runs)</SelectItem>
                        <SelectItem value="over">Over (Total Runs)</SelectItem>
                        <SelectItem value="away_team">Away Team Favored</SelectItem>
                        <SelectItem value="home_team">Home Team Favored</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description of what this phrase indicates..."
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority (1-10)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="1"
                      max="10"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={addPhraseMutation.isPending}
              >
                {addPhraseMutation.isPending ? "Adding..." : "Add Rule"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function PhraseRuleRow({ rule, onToggle, onDelete }: { 
  rule: PhraseDetectionRule; 
  onToggle: (id: number, isActive: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'under': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'over': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'away_team': return <Users className="h-4 w-4 text-blue-500" />;
      case 'home_team': return <Home className="h-4 w-4 text-purple-500" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'under': return 'Under';
      case 'over': return 'Over';
      case 'away_team': return 'Away Team';
      case 'home_team': return 'Home Team';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'under': return 'bg-red-100 text-red-800 border-red-200';
      case 'over': return 'bg-green-100 text-green-800 border-green-200';
      case 'away_team': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'home_team': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <TableRow>
      <TableCell className="font-mono text-sm">"{rule.phrase}"</TableCell>
      <TableCell>
        <Badge variant="outline" className={getCategoryColor(rule.category)}>
          <div className="flex items-center gap-1">
            {getCategoryIcon(rule.category)}
            {getCategoryLabel(rule.category)}
          </div>
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
        {rule.description || "-"}
      </TableCell>
      <TableCell>
        <Badge variant="outline">{rule.priority}</Badge>
      </TableCell>
      <TableCell>
        <Switch
          checked={rule.isActive}
          onCheckedChange={(checked) => onToggle(rule.id, checked)}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(rule.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function AdminPhraseDetection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: phrases = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/phrase-rules"],
    retry: false
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return await apiRequest(`/api/admin/phrase-rules/${id}/toggle`, {
        method: "PATCH",
        body: JSON.stringify({ isActive })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/phrase-rules"] });
      toast({
        title: "Success",
        description: "Phrase rule status updated"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update phrase rule",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/admin/phrase-rules/${id}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/phrase-rules"] });
      toast({
        title: "Success",
        description: "Phrase rule deleted"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete phrase rule",
        variant: "destructive"
      });
    }
  });

  const filteredPhrases = phrases.filter((phrase: PhraseDetectionRule) => {
    const matchesSearch = phrase.phrase.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         phrase.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || phrase.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const phraseCounts = phrases.reduce((acc: any, phrase: PhraseDetectionRule) => {
    acc[phrase.category] = (acc[phrase.category] || 0) + 1;
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              Phrase Detection Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage AI analysis phrase detection rules for moneyline and total runs betting suggestions
            </p>
          </div>
          <AddPhraseDialog onSuccess={() => refetch()} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Rules</p>
                  <p className="text-2xl font-bold">{phrases.length}</p>
                </div>
                <Settings className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Under Rules</p>
                  <p className="text-2xl font-bold text-red-600">{phraseCounts.under || 0}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Over Rules</p>
                  <p className="text-2xl font-bold text-green-600">{phraseCounts.over || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Away Team</p>
                  <p className="text-2xl font-bold text-blue-600">{phraseCounts.away_team || 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Home Team</p>
                  <p className="text-2xl font-bold text-purple-600">{phraseCounts.home_team || 0}</p>
                </div>
                <Home className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search phrases or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="under">Under</SelectItem>
                  <SelectItem value="over">Over</SelectItem>
                  <SelectItem value="away_team">Away Team</SelectItem>
                  <SelectItem value="home_team">Home Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Phrase Rules Table */}
        <Card>
          <CardHeader>
            <CardTitle>Phrase Detection Rules ({filteredPhrases.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phrase</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPhrases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchTerm || selectedCategory !== "all" 
                          ? "No phrase rules match your filters" 
                          : "No phrase rules found. Add your first rule to get started."
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPhrases.map((phrase: PhraseDetectionRule) => (
                      <PhraseRuleRow
                        key={phrase.id}
                        rule={phrase}
                        onToggle={(id, isActive) => toggleMutation.mutate({ id, isActive })}
                        onDelete={(id) => deleteMutation.mutate(id)}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              How Phrase Detection Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  Under Phrases
                </h4>
                <p className="text-sm text-muted-foreground">
                  Phrases that indicate low-scoring games or pitching dominance. When detected, 
                  suggested bets will favor "Under" total runs.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Over Phrases
                </h4>
                <p className="text-sm text-muted-foreground">
                  Phrases that indicate high-scoring games or offensive advantages. When detected, 
                  suggested bets will favor "Over" total runs.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Away Team Phrases
                </h4>
                <p className="text-sm text-muted-foreground">
                  Phrases that indicate the away team has advantages. When detected, 
                  suggested bets will favor the away team moneyline.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Home className="h-4 w-4 text-purple-500" />
                  Home Team Phrases
                </h4>
                <p className="text-sm text-muted-foreground">
                  Phrases that indicate the home team has advantages. When detected, 
                  suggested bets will favor the home team moneyline.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}