import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Ticket, Crown, Award, Calendar } from "lucide-react";

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

export default function AdminReferrals() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    rewardTier: "pro",
    rewardDuration: 30,
    maxUses: 100,
    expiresAt: ""
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: referralCodes = [], isLoading } = useQuery<ReferralCode[]>({
    queryKey: ["/api/admin/referral-codes"],
  });

  const createReferralCodeMutation = useMutation({
    mutationFn: async (codeData: typeof formData) => {
      return apiRequest("POST", "/api/admin/referral-codes", codeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/referral-codes"] });
      setShowCreateForm(false);
      setFormData({
        code: "",
        rewardTier: "pro",
        rewardDuration: 30,
        maxUses: 100,
        expiresAt: ""
      });
      toast({
        title: "Success",
        description: "Referral code created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create referral code",
        variant: "destructive",
      });
    },
  });

  const handleCreateReferralCode = () => {
    if (!formData.code) {
      toast({
        title: "Error",
        description: "Please enter a referral code",
        variant: "destructive",
      });
      return;
    }
    createReferralCodeMutation.mutate(formData);
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

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/3"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Referral Code Management</h1>
          <p className="text-gray-400 mt-2">Create and manage referral codes for user acquisition</p>
        </div>
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Referral Code
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create Referral Code</DialogTitle>
              <DialogDescription className="text-gray-400">
                Create a new referral code with tier rewards and usage limits.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code" className="text-right text-gray-300">
                  Code
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="col-span-3 bg-gray-800 border-gray-600 text-white"
                  placeholder="PROMO2024"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rewardTier" className="text-right text-gray-300">
                  Reward Tier
                </Label>
                <Select value={formData.rewardTier} onValueChange={(value) => setFormData({ ...formData, rewardTier: value })}>
                  <SelectTrigger className="col-span-3 bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="pro">Pro (1 month)</SelectItem>
                    <SelectItem value="elite">Elite (1 month)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rewardDuration" className="text-right text-gray-300">
                  Duration (days)
                </Label>
                <Input
                  id="rewardDuration"
                  type="number"
                  value={formData.rewardDuration}
                  onChange={(e) => setFormData({ ...formData, rewardDuration: parseInt(e.target.value) || 30 })}
                  className="col-span-3 bg-gray-800 border-gray-600 text-white"
                  placeholder="30"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maxUses" className="text-right text-gray-300">
                  Max Uses
                </Label>
                <Input
                  id="maxUses"
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || 100 })}
                  className="col-span-3 bg-gray-800 border-gray-600 text-white"
                  placeholder="100"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expiresAt" className="text-right text-gray-300">
                  Expires (optional)
                </Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="col-span-3 bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleCreateReferralCode}
                disabled={createReferralCodeMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {createReferralCodeMutation.isPending ? "Creating..." : "Create Code"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Ticket className="w-5 h-5 mr-2" />
            Active Referral Codes
          </CardTitle>
          <CardDescription className="text-gray-400">
            Manage referral codes and track their usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referralCodes.length === 0 ? (
            <div className="text-center py-8">
              <Ticket className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-400">No referral codes created yet</p>
              <p className="text-gray-500 text-sm">Create your first referral code to start tracking user acquisitions</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Code</TableHead>
                  <TableHead className="text-gray-300">Reward</TableHead>
                  <TableHead className="text-gray-300">Usage</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Created</TableHead>
                  <TableHead className="text-gray-300">Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referralCodes.map((code) => (
                  <TableRow key={code.id} className="border-gray-700">
                    <TableCell className="text-white font-mono">{code.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTierBadge(code.rewardTier)}
                        <span className="text-gray-400 text-sm">
                          {code.rewardDuration} days
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {code.usageCount} / {code.maxUses}
                    </TableCell>
                    <TableCell>
                      {code.isActive ? (
                        <Badge className="bg-green-600 text-white">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span className="text-sm">
                          {new Date(code.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {code.expiresAt ? (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span className="text-sm">
                            {new Date(code.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">Never</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}