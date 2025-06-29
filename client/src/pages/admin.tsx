import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import { 
  Users, 
  TrendingUp, 
  Target, 
  DollarSign, 
  Activity,
  Calendar,
  BarChart3,
  PieChart
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  subscriptions: {
    free: number;
    pro: number;
    elite: number;
  };
  revenue: {
    monthly: number;
    total: number;
  };
  aiAnalysis: {
    totalGenerated: number;
    accuracy: number;
    avgConfidence: number;
  };
  bettingActivity: {
    totalBets: number;
    avgBetSize: number;
    winRate: number;
  };
}

interface UserActivity {
  id: number;
  username: string;
  email: string;
  subscriptionTier: string;
  lastActive: string;
  totalBets: number;
  subscriptionStatus: string;
  joinedDate: string;
}

interface SystemActivity {
  id: number;
  action: string;
  userId?: number;
  username?: string;
  details: string;
  timestamp: string;
  type: "user" | "subscription" | "bet" | "analysis";
}

export default function AdminDashboard() {
  const { user, hasAccess } = useAuth();
  const [, setLocation] = useLocation();

  // Only allow elite users to access admin dashboard
  if (!user || !hasAccess("elite")) {
    setLocation("/");
    return null;
  }

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const { data: userActivity, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { data: systemActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["/api/admin/activity"],
  });

  const { data: performance, isLoading: performanceLoading } = useQuery({
    queryKey: ["/api/admin/performance"],
  });

  if (statsLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and analytics</p>
        </div>
        <Badge variant="secondary" className="text-yellow-600 bg-yellow-100">
          Elite Access
        </Badge>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeUsers || 0} active this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.revenue?.monthly?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              ${stats?.revenue?.total?.toLocaleString() || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.aiAnalysis?.accuracy?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.aiAnalysis?.totalGenerated || 0} analyses generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Betting Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.bettingActivity?.winRate?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.bettingActivity?.totalBets || 0} total bets
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="activity">System Activity</TabsTrigger>
          <TabsTrigger value="performance">AI Performance</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
              <CardDescription>Recent user registrations and activity</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  {userActivity?.map((user: UserActivity) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.username}</span>
                          <Badge 
                            variant={user.subscriptionTier === "elite" ? "default" : user.subscriptionTier === "pro" ? "secondary" : "outline"}
                          >
                            {user.subscriptionTier}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined: {new Date(user.joinedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{user.totalBets} bets</p>
                        <p className="text-xs text-muted-foreground">
                          Last active: {new Date(user.lastActive).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Activity Log</CardTitle>
              <CardDescription>Recent system events and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="space-y-3">
                  {systemActivity?.map((activity: SystemActivity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="p-2 rounded-full bg-primary/10">
                        {activity.type === "user" && <Users className="h-4 w-4" />}
                        {activity.type === "subscription" && <DollarSign className="h-4 w-4" />}
                        {activity.type === "bet" && <Target className="h-4 w-4" />}
                        {activity.type === "analysis" && <BarChart3 className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{activity.action}</span>
                          {activity.username && (
                            <Badge variant="outline">{activity.username}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{activity.details}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Performance Analytics</CardTitle>
              <CardDescription>Detailed breakdown of AI prediction accuracy</CardDescription>
            </CardHeader>
            <CardContent>
              {performanceLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium">Pitching Analysis</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {performance?.pitchingAccuracy?.toFixed(1) || 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">Accuracy Rate</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium">Spread Predictions</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {performance?.spreadAccuracy?.toFixed(1) || 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">Accuracy Rate</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium">Total Predictions</h4>
                      <p className="text-2xl font-bold text-purple-600">
                        {performance?.totalAccuracy?.toFixed(1) || 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">Overall Accuracy</p>
                    </div>
                  </div>
                  
                  {performance?.monthlyBreakdown && (
                    <div>
                      <h4 className="font-medium mb-3">Monthly Performance</h4>
                      <div className="space-y-2">
                        {performance.monthlyBreakdown.map((month: any) => (
                          <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium">{month.month}</span>
                            <div className="text-right">
                              <span className="text-lg font-bold">{month.accuracy.toFixed(1)}%</span>
                              <p className="text-sm text-muted-foreground">{month.games} games</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Overview</CardTitle>
              <CardDescription>Breakdown of subscription tiers and revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-600">Free Users</h4>
                  <p className="text-3xl font-bold">{stats?.subscriptions?.free || 0}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-blue-600">Pro Subscribers</h4>
                  <p className="text-3xl font-bold">{stats?.subscriptions?.pro || 0}</p>
                  <p className="text-sm text-muted-foreground">
                    ${((stats?.subscriptions?.pro || 0) * 9.99).toLocaleString()}/mo
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-yellow-600">Elite Subscribers</h4>
                  <p className="text-3xl font-bold">{stats?.subscriptions?.elite || 0}</p>
                  <p className="text-sm text-muted-foreground">
                    ${((stats?.subscriptions?.elite || 0) * 19.99).toLocaleString()}/mo
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}