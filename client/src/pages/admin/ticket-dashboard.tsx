import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { TicketIcon, TrendingUpIcon, DollarSignIcon, AlertTriangleIcon, CheckCircleIcon, XCircleIcon, EditIcon, TrashIcon, PlusIcon } from "lucide-react";

interface Ticket {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  source: string;
  metadata?: any;
  assignedTo?: number;
  createdBy?: number;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Bet {
  id: number;
  gameId: string;
  betType: string;
  selection: string;
  odds: number;
  stake: string;
  potentialWin: string;
  status: string;
  result?: string;
  actualWin?: string;
  placedAt?: string;
  userId?: number;
  confidence?: number;
}

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  highPriorityTickets: number;
  totalBets: number;
  activeBets: number;
  settledBets: number;
  totalStaked: number;
  totalWinnings: number;
}

export default function TicketDashboard() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    category: "analysis_insight",
    priority: "medium"
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [ticketFilter, setTicketFilter] = useState("all");
  const [betFilter, setBetFilter] = useState("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tickets with mock data for demonstration
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ["/api/admin/tickets", ticketFilter],
    queryFn: async () => {
      // Using test endpoint to demonstrate ticket system
      const response = await apiRequest("/api/admin/tickets/generate-test", { method: "POST" });
      
      // Convert the test ticket into the expected format
      const testTicket = response.ticketGenerated;
      return [{
        id: 1,
        title: testTicket.title,
        description: testTicket.description,
        category: testTicket.category,
        priority: testTicket.priority,
        status: "open",
        source: testTicket.source,
        metadata: testTicket.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }];
    }
  });

  // Fetch bets
  const { data: bets = [], isLoading: betsLoading } = useQuery({
    queryKey: ["/api/bets"],
    queryFn: () => apiRequest("/api/bets")
  });

  // Mock dashboard stats
  const stats: DashboardStats = {
    totalTickets: tickets.length,
    openTickets: tickets.filter((t: Ticket) => t.status === 'open').length,
    resolvedTickets: tickets.filter((t: Ticket) => t.status === 'resolved').length,
    highPriorityTickets: tickets.filter((t: Ticket) => t.priority === 'high' || t.priority === 'urgent').length,
    totalBets: bets.length,
    activeBets: bets.filter((b: Bet) => b.status === 'pending').length,
    settledBets: bets.filter((b: Bet) => b.status !== 'pending').length,
    totalStaked: bets.reduce((sum: number, bet: Bet) => sum + parseFloat(bet.stake || '0'), 0),
    totalWinnings: bets.filter((b: Bet) => b.status === 'won').reduce((sum: number, bet: Bet) => sum + parseFloat(bet.actualWin || '0'), 0)
  };

  // Mutations for demonstration
  const updateTicketMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<Ticket> }) => {
      // For demo purposes, just return success
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] });
      toast({ title: "Ticket updated successfully" });
      setEditingTicket(null);
    }
  });

  const deleteTicketMutation = useMutation({
    mutationFn: async (id: number) => {
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] });
      toast({ title: "Ticket deleted successfully" });
      setSelectedTicket(null);
    }
  });

  const createTicketMutation = useMutation({
    mutationFn: async (ticket: typeof newTicket) => {
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] });
      toast({ title: "Ticket created successfully" });
      setNewTicket({ title: "", description: "", category: "analysis_insight", priority: "medium" });
      setIsCreateDialogOpen(false);
    }
  });

  const resolveBetMutation = useMutation({
    mutationFn: async (data: { id: number; result: string }) => {
      return await apiRequest(`/api/bets/${data.id}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ result: data.result })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
      toast({ title: "Bet resolved successfully" });
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-500";
      case "in_progress": return "bg-yellow-500";
      case "resolved": return "bg-green-500";
      case "closed": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getBetStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "won": return "bg-green-500";
      case "lost": return "bg-red-500";
      case "push": return "bg-gray-500";
      default: return "bg-blue-500";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Page Header */}
      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
                <TicketIcon className="h-8 w-8 text-primary" />
                <span>Ticket Dashboard</span>
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage support tickets and monitor betting activity
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Create Ticket
                  </Button>
                </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
              <DialogDescription>Create a new support or analysis ticket</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter ticket title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter ticket description"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={newTicket.category} onValueChange={(value) => setNewTicket(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="analysis_insight">Analysis Insight</SelectItem>
                      <SelectItem value="market_update">Market Update</SelectItem>
                      <SelectItem value="feature_request">Feature Request</SelectItem>
                      <SelectItem value="bug_report">Bug Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={newTicket.priority} onValueChange={(value) => setNewTicket(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => createTicketMutation.mutate(newTicket)}
                disabled={!newTicket.title || !newTicket.description || createTicketMutation.isPending}
              >
                Create Ticket
              </Button>
            </DialogFooter>
          </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <TicketIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-muted-foreground">
              {stats.openTickets} open, {stats.resolvedTickets} resolved
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangleIcon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.highPriorityTickets}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bets</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeBets}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalBets} total bets placed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Winnings</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats.totalWinnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              ${stats.totalStaked.toFixed(2)} total staked
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="bets">Betting Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Support Tickets</h2>
            <Select value={ticketFilter} onValueChange={setTicketFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {ticketsLoading ? (
              <div>Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No tickets found</p>
                </CardContent>
              </Card>
            ) : (
              tickets.map((ticket: Ticket) => (
                <Card key={ticket.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{ticket.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{ticket.description}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Category: {ticket.category}</span>
                      <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-end space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedTicket(ticket)}>
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{selectedTicket?.title}</DialogTitle>
                            <DialogDescription>
                              {selectedTicket?.category} • Created {selectedTicket ? new Date(selectedTicket.createdAt).toLocaleDateString() : ''}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Description</Label>
                              <div className="mt-1 p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                                {selectedTicket?.description}
                              </div>
                            </div>
                            {selectedTicket?.metadata && (
                              <div>
                                <Label>Metadata</Label>
                                <pre className="mt-1 p-3 bg-gray-50 rounded-md text-sm overflow-auto">
                                  {JSON.stringify(selectedTicket.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                            <div className="flex items-center space-x-4">
                              <Badge className={getPriorityColor(selectedTicket?.priority || '')}>
                                {selectedTicket?.priority}
                              </Badge>
                              <Badge className={getStatusColor(selectedTicket?.status || '')}>
                                {selectedTicket?.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Source: {selectedTicket?.source}
                              </span>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingTicket(ticket)}
                      >
                        <EditIcon className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteTicketMutation.mutate(ticket.id)}
                      >
                        <TrashIcon className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="bets" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Betting Activity</h2>
            <Select value={betFilter} onValueChange={setBetFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bets</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="push">Push</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {betsLoading ? (
              <div>Loading bets...</div>
            ) : bets.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No bets found</p>
                </CardContent>
              </Card>
            ) : (
              bets.map((bet: Bet) => (
                <Card key={bet.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{bet.gameId}</CardTitle>
                        <CardDescription>
                          {bet.betType}: {bet.selection} @ {bet.odds > 0 ? '+' : ''}{bet.odds}
                        </CardDescription>
                      </div>
                      <Badge className={getBetStatusColor(bet.status)}>
                        {bet.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Stake</Label>
                        <p className="font-semibold">${bet.stake}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Potential Win</Label>
                        <p className="font-semibold text-green-600">${bet.potentialWin}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Confidence</Label>
                        <p className="font-semibold">{bet.confidence || 'N/A'}%</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Placed</Label>
                        <p className="text-sm">{bet.placedAt ? new Date(bet.placedAt).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                    
                    {bet.status === 'pending' && (
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => resolveBetMutation.mutate({ id: bet.id, result: 'won' })}
                        >
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Mark Won
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => resolveBetMutation.mutate({ id: bet.id, result: 'lost' })}
                        >
                          <XCircleIcon className="w-4 h-4 mr-1" />
                          Mark Lost
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Ticket Dialog */}
      <Dialog open={!!editingTicket} onOpenChange={(open) => !open && setEditingTicket(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Ticket</DialogTitle>
            <DialogDescription>Update ticket details</DialogDescription>
          </DialogHeader>
          {editingTicket && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingTicket.title}
                  onChange={(e) => setEditingTicket(prev => prev ? { ...prev, title: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingTicket.description}
                  onChange={(e) => setEditingTicket(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select 
                    value={editingTicket.status} 
                    onValueChange={(value) => setEditingTicket(prev => prev ? { ...prev, status: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select 
                    value={editingTicket.priority} 
                    onValueChange={(value) => setEditingTicket(prev => prev ? { ...prev, priority: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select 
                    value={editingTicket.category} 
                    onValueChange={(value) => setEditingTicket(prev => prev ? { ...prev, category: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="analysis_insight">Analysis Insight</SelectItem>
                      <SelectItem value="market_update">Market Update</SelectItem>
                      <SelectItem value="feature_request">Feature Request</SelectItem>
                      <SelectItem value="bug_report">Bug Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTicket(null)}>Cancel</Button>
            <Button 
              onClick={() => editingTicket && updateTicketMutation.mutate({ 
                id: editingTicket.id, 
                updates: editingTicket 
              })}
              disabled={updateTicketMutation.isPending}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}