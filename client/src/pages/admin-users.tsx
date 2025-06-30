import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, Crown, Award, Ticket, UserPlus, Calendar, Edit, Mail } from "lucide-react";

interface AdminUser {
  id: number;
  username: string;
  email: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  isAdmin: boolean;
  referralCode?: string;
  referredBy?: string;
  referralCount: number;
  createdAt: string;
  subscriptionEndDate?: string;
}

interface ReferralCode {
  id: number;
  code: string;
  createdBy: number;
  rewardTier: string;
  rewardDuration: number;
  usageCount: number;
  maxUses: number;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
}

interface AdminStats {
  totalUsers: number;
  freeUsers: number;
  proUsers: number;
  eliteUsers: number;
  totalReferrals: number;
  activeReferralCodes: number;
}

export default function AdminUsers() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    subscriptionTier: "free",
    isAdmin: false,
    referredBy: ""
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: referralCodes = [], isLoading: referralsLoading } = useQuery<ReferralCode[]>({
    queryKey: ["/api/admin/referral-codes"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof formData) => {
      return apiRequest("POST", "/api/admin/users", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setShowCreateForm(false);
      setFormData({
        username: "",
        email: "",
        password: "",
        subscriptionTier: "free",
        isAdmin: false,
        referredBy: ""
      });
      toast({
        title: "Success",
        description: "User created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateTierMutation = useMutation({
    mutationFn: async ({ userId, tier, isAdmin }: { userId: number; tier: string; isAdmin?: boolean }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/tier`, { tier, isAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Success",
        description: "User tier updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user tier",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = () => {
    if (!formData.username || !formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(formData);
  };

  const handleUpdateTier = (userId: number, tier: string, isAdmin?: boolean) => {
    updateTierMutation.mutate({ userId, tier, isAdmin });
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'pro':
        return <Badge className="bg-blue-600 text-white"><Crown className="w-3 h-3 mr-1" />Pro</Badge>;
      case 'elite':
        return <Badge className="bg-yellow-600 text-white"><Award className="w-3 h-3 mr-1" />Elite</Badge>;
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  if (statsLoading || usersLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Management</h1>
          <p className="text-gray-400 mt-2">Manage users, tiers, and referral codes</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Pro Users</CardTitle>
            <Crown className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.proUsers || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Elite Users</CardTitle>
            <Award className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.eliteUsers || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Referral Codes</CardTitle>
            <Ticket className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.activeReferralCodes || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
          <TabsTrigger value="users" className="data-[state=active]:bg-gray-700">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="referrals" className="data-[state=active]:bg-gray-700">
            <Ticket className="w-4 h-4 mr-2" />
            Referral Codes
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">User Management</h2>
            <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Create New User</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Add a new user to the platform with specified tier and permissions.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right text-gray-300">
                      Username
                    </Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="col-span-3 bg-gray-800 border-gray-600 text-white"
                      placeholder="Enter username"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right text-gray-300">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="col-span-3 bg-gray-800 border-gray-600 text-white"
                      placeholder="Enter email"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right text-gray-300">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="col-span-3 bg-gray-800 border-gray-600 text-white"
                      placeholder="Enter password"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="tier" className="text-right text-gray-300">
                      Tier
                    </Label>
                    <Select value={formData.subscriptionTier} onValueChange={(value) => setFormData({ ...formData, subscriptionTier: value })}>
                      <SelectTrigger className="col-span-3 bg-gray-800 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="elite">Elite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="referredBy" className="text-right text-gray-300">
                      Referred By
                    </Label>
                    <Input
                      id="referredBy"
                      value={formData.referredBy}
                      onChange={(e) => setFormData({ ...formData, referredBy: e.target.value })}
                      className="col-span-3 bg-gray-800 border-gray-600 text-white"
                      placeholder="Referral code (optional)"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right text-gray-300">
                      Admin
                    </Label>
                    <div className="col-span-3 flex items-center space-x-2">
                      <Checkbox
                        id="isAdmin"
                        checked={formData.isAdmin}
                        onCheckedChange={(checked) => setFormData({ ...formData, isAdmin: !!checked })}
                      />
                      <Label htmlFor="isAdmin" className="text-sm text-gray-300">
                        Grant admin privileges
                      </Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? "Creating..." : "Create User"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* User Table */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">All Users</CardTitle>
              <CardDescription className="text-gray-400">
                Manage user accounts and subscription tiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-400">No users found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">User</TableHead>
                      <TableHead className="text-gray-300">Tier</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Referrals</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-gray-700">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="flex flex-col">
                              <span className="text-white font-medium">{user.username}</span>
                              <span className="text-gray-400 text-sm flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getTierBadge(user.subscriptionTier)}
                            {user.isAdmin && (
                              <Badge variant="outline" className="text-red-400 border-red-400">
                                Admin
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={user.subscriptionStatus === 'active' ? 'bg-green-600' : 'bg-gray-600'}
                          >
                            {user.subscriptionStatus || 'inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          <div className="flex flex-col">
                            <span>{user.referralCount} referrals</span>
                            {user.referredBy && (
                              <span className="text-xs text-gray-500">by: {user.referredBy}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Select onValueChange={(tier) => handleUpdateTier(user.id, tier, user.isAdmin)}>
                              <SelectTrigger className="w-24 bg-gray-700 border-gray-600 text-white">
                                <SelectValue placeholder="Change" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-600">
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="pro">Pro</SelectItem>
                                <SelectItem value="elite">Elite</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referral Codes Tab */}
        <TabsContent value="referrals" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Referral Code Management</h2>
            <Button 
              onClick={() => window.location.href = "/admin/referrals"}
              className="bg-green-600 hover:bg-green-700"
            >
              <Ticket className="w-4 h-4 mr-2" />
              Manage Codes
            </Button>
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Active Referral Codes</CardTitle>
              <CardDescription className="text-gray-400">
                Quick overview of referral code performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {referralCodes.length === 0 ? (
                <div className="text-center py-8">
                  <Ticket className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-400">No referral codes created yet</p>
                  <Button 
                    onClick={() => window.location.href = "/admin/referrals"}
                    className="mt-4 bg-green-600 hover:bg-green-700"
                  >
                    Create First Code
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Code</TableHead>
                      <TableHead className="text-gray-300">Reward</TableHead>
                      <TableHead className="text-gray-300">Usage</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referralCodes.slice(0, 5).map((code) => (
                      <TableRow key={code.id} className="border-gray-700">
                        <TableCell className="text-white font-mono">{code.code}</TableCell>
                        <TableCell>
                          {getTierBadge(code.rewardTier)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {code.usageCount} / {code.maxUses}
                        </TableCell>
                        <TableCell>
                          <Badge className={code.isActive ? 'bg-green-600' : 'bg-gray-600'}>
                            {code.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}