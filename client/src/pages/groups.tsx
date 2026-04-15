import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Users, Plus, Copy, Settings, UserCheck, Mail } from 'lucide-react';

interface Group {
  id: number;
  name: string;
  description: string | null;
  createdBy: number;
  isPrivate: boolean;
  maxMembers: number;
  currentMembers: number;
  inviteCode: string | null;
  createdAt: string;
  updatedAt: string;
  membership: {
    role: string;
    joinedAt: string;
  };
}

interface GroupMember {
  id: number;
  groupId: number;
  userId: number;
  role: string;
  joinedAt: string;
  isActive: boolean;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export default function Groups() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showMembers, setShowMembers] = useState<number | null>(null);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    isPrivate: false,
    maxMembers: 50
  });
  const [joinCode, setJoinCode] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['/api/groups'],
  });

  const { data: groupMembers } = useQuery({
    queryKey: ['/api/groups', showMembers, 'members'],
    enabled: !!showMembers,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (groupData: typeof newGroup) => {
      const res = await apiRequest('POST', '/api/groups', groupData);
      return await (res as any).json();
    },
    onSuccess: (created: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      setCreateDialogOpen(false);
      setNewGroup({ name: '', description: '', isPrivate: false, maxMembers: 50 });
      const code = created?.inviteCode;
      if (code) {
        navigator.clipboard.writeText(code).catch(() => {});
        toast({
          title: "Group created",
          description: `Invite code: ${code} (copied to clipboard) — share this to invite friends.`,
        });
      } else {
        toast({ title: "Success", description: "Group created successfully!" });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create group",
        variant: "destructive",
      });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      const res = await apiRequest('POST', '/api/groups/join-by-code', { inviteCode });
      return await (res as any).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      setJoinDialogOpen(false);
      setJoinCode('');
      toast({
        title: "Success",
        description: "Successfully joined the group!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join group",
        variant: "destructive",
      });
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      return await apiRequest(`/api/groups/${groupId}/leave`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      toast({
        title: "Success",
        description: "Left the group successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to leave group",
        variant: "destructive",
      });
    },
  });

  const generateInviteCodeMutation = useMutation({
    mutationFn: async (groupId: number) => {
      return await apiRequest(`/api/groups/${groupId}/invite-code`, {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      navigator.clipboard.writeText(data.inviteCode);
      toast({
        title: "Invite Code Generated",
        description: "New invite code copied to clipboard!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate invite code",
        variant: "destructive",
      });
    },
  });

  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }
    createGroupMutation.mutate(newGroup);
  };

  const handleJoinGroup = () => {
    if (!joinCode.trim()) {
      toast({
        title: "Error",
        description: "Invite code is required",
        variant: "destructive",
      });
      return;
    }
    joinGroupMutation.mutate(joinCode.trim());
  };

  const copyInviteCode = (inviteCode: string) => {
    navigator.clipboard.writeText(inviteCode);
    toast({
      title: "Copied",
      description: "Invite code copied to clipboard!",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading groups...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Groups</h1>
          <p className="text-muted-foreground mt-2">
            Create betting groups and compete with friends
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserCheck className="h-4 w-4 mr-2" />
                Join Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join a Group</DialogTitle>
                <DialogDescription>
                  Enter an invite code to join an existing group
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="joinCode">Invite Code</Label>
                  <Input
                    id="joinCode"
                    placeholder="Enter invite code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  />
                </div>
                <Button 
                  onClick={handleJoinGroup} 
                  disabled={joinGroupMutation.isPending}
                  className="w-full"
                >
                  {joinGroupMutation.isPending ? "Joining..." : "Join Group"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>
                  Create a new betting group to compete with friends
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter group name"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your group"
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxMembers">Max Members</Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    min="2"
                    max="100"
                    value={newGroup.maxMembers}
                    onChange={(e) => setNewGroup({ ...newGroup, maxMembers: parseInt(e.target.value) || 50 })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPrivate"
                    checked={newGroup.isPrivate}
                    onCheckedChange={(checked) => setNewGroup({ ...newGroup, isPrivate: checked })}
                  />
                  <Label htmlFor="isPrivate">Private Group</Label>
                </div>
                <Button 
                  onClick={handleCreateGroup} 
                  disabled={createGroupMutation.isPending}
                  className="w-full"
                >
                  {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Groups Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first group or join an existing one to start competing with friends
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
              <Button variant="outline" onClick={() => setJoinDialogOpen(true)}>
                <UserCheck className="h-4 w-4 mr-2" />
                Join Group
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {groups.map((group: Group) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {group.name}
                      <Badge variant={group.membership.role === 'admin' ? 'default' : 'secondary'}>
                        {group.membership.role}
                      </Badge>
                      {group.isPrivate && (
                        <Badge variant="outline">Private</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {group.description || "No description provided"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {group.membership.role === 'admin' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateInviteCodeMutation.mutate(group.id)}
                        disabled={generateInviteCodeMutation.isPending}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => leaveGroupMutation.mutate(group.id)}
                      disabled={leaveGroupMutation.isPending}
                    >
                      Leave
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{group.currentMembers} / {group.maxMembers} members</span>
                    <span>Joined {new Date(group.membership.joinedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {group.inviteCode && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyInviteCode(group.inviteCode!)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        {group.inviteCode}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMembers(showMembers === group.id ? null : group.id)}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Members
                    </Button>
                  </div>
                </div>

                {showMembers === group.id && groupMembers && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold mb-2">Group Members</h4>
                    <div className="space-y-2">
                      {groupMembers.map((member: GroupMember) => (
                        <div key={member.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div>
                            <span className="font-medium">{member.user.username}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              ({member.user.email})
                            </span>
                          </div>
                          <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                            {member.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}