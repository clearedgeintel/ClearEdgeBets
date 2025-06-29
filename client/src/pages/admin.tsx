import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Users, 
  Crown, 
  Star,
  Settings,
  Search,
  UserCog,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import Header from "@/components/header";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface User {
  id: number;
  username: string;
  email: string;
  subscriptionTier: string;
  subscriptionStatus: string | null;
  subscriptionEndDate: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: Date | null;
}

interface AdminStats {
  totalUsers: number;
  freeUsers: number;
  proUsers: number;
  eliteUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
}

function UserCard({ user, onUpdateTier }: { user: User; onUpdateTier: (userId: number, tier: string) => void }) {
  const [selectedTier, setSelectedTier] = useState(user.subscriptionTier);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'elite': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'pro': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'canceled': return 'text-orange-600';
      case 'past_due': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'canceled': return <XCircle className="h-4 w-4" />;
      case 'past_due': return <AlertCircle className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{user.username}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              ID: {user.id} • Joined {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'Unknown'}
            </p>
          </div>
          
          <div className="text-right">
            <Badge variant="outline" className={getTierColor(user.subscriptionTier)}>
              {user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1)}
            </Badge>
            
            {user.subscriptionStatus && (
              <div className={`flex items-center gap-1 text-sm mt-2 ${getStatusColor(user.subscriptionStatus)}`}>
                {getStatusIcon(user.subscriptionStatus)}
                {user.subscriptionStatus.charAt(0).toUpperCase() + user.subscriptionStatus.slice(1)}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {user.subscriptionEndDate && (
            <div className="text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Ends: {format(new Date(user.subscriptionEndDate), 'MMM d, yyyy')}
              </span>
            </div>
          )}

          {user.stripeCustomerId && (
            <div className="text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Customer: {user.stripeCustomerId.slice(0, 20)}...
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="elite">Elite</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              size="sm"
              onClick={() => onUpdateTier(user.id, selectedTier)}
              disabled={selectedTier === user.subscriptionTier}
              variant={selectedTier !== user.subscriptionTier ? "default" : "outline"}
            >
              Update
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch admin stats
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    enabled: true
  });

  // Fetch all users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: true
  });

  // Update user tier mutation
  const updateTierMutation = useMutation({
    mutationFn: ({ userId, tier }: { userId: number; tier: string }) =>
      apiRequest('POST', '/api/admin/update-tier', { userId, tier }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Tier Updated",
        description: "User subscription tier has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update user tier. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateTier = (userId: number, tier: string) => {
    updateTierMutation.mutate({ userId, tier });
  };

  // Filter users based on search and filter criteria
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toString().includes(searchTerm);

    const matchesFilter = filterBy === "all" || user.subscriptionTier === filterBy;

    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Page Header */}
      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
                <Shield className="h-8 w-8 text-primary" />
                <span>Admin Panel</span>
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage users, subscriptions, and system settings
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{stats.totalUsers}</div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-600">{stats.freeUsers}</div>
                <div className="text-sm text-muted-foreground">Free</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{stats.proUsers}</div>
                <div className="text-sm text-muted-foreground">Pro</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Crown className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{stats.eliteUsers}</div>
                <div className="text-sm text-muted-foreground">Elite</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{stats.activeSubscriptions}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <CreditCard className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-emerald-600">${stats.totalRevenue}</div>
                <div className="text-sm text-muted-foreground">Revenue</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by username, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="elite">Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Grid */}
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <UserCog className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterBy !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "No users in the system"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <UserCard 
                key={user.id} 
                user={user} 
                onUpdateTier={handleUpdateTier}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}