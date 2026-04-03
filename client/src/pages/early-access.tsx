import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Zap, 
  Award, 
  Star,
  Rocket,
  Sparkles,
  Eye,
  Globe,
  Smartphone,
  BarChart3,
  TrendingUp,
  Bell,
  Settings
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

interface EarlyFeature {
  id: string;
  name: string;
  description: string;
  category: 'analytics' | 'ui' | 'ai' | 'integrations';
  status: 'coming-soon' | 'beta' | 'preview';
  progress: number;
  releaseDate: string;
  enabled: boolean;
  isNew: boolean;
  screenshots?: string[];
}

export default function EarlyAccess() {
  const { user, hasAccess } = useAuth();
  const { toast } = useToast();

  // Mock early access features
  const [features, setFeatures] = useState<EarlyFeature[]>([
    {
      id: "1",
      name: "NFL Integration",
      description: "Complete NFL sports analysis with advanced metrics, playoff predictions, and live injury updates.",
      category: "analytics",
      status: "beta",
      progress: 85,
      releaseDate: "2025-08-15",
      enabled: true,
      isNew: true
    },
    {
      id: "2",
      name: "Mobile App",
      description: "Native iOS and Android app with push notifications, offline analysis, and biometric authentication.",
      category: "ui",
      status: "preview",
      progress: 60,
      releaseDate: "2025-09-01",
      enabled: false,
      isNew: true
    },
    {
      id: "3",
      name: "Live Chat Support",
      description: "24/7 live chat with AI assistant and escalation to human experts for Elite members.",
      category: "integrations",
      status: "beta",
      progress: 75,
      releaseDate: "2025-07-20",
      enabled: true,
      isNew: false
    },
    {
      id: "4",
      name: "Advanced AI Models",
      description: "GPT-5 powered analysis with weather pattern recognition and injury impact predictions.",
      category: "ai",
      status: "coming-soon",
      progress: 40,
      releaseDate: "2025-10-15",
      enabled: false,
      isNew: false
    },
    {
      id: "5",
      name: "Social Trading",
      description: "Follow top predictors, copy strategies, and create prediction groups with friends.",
      category: "integrations",
      status: "preview",
      progress: 30,
      releaseDate: "2025-11-01",
      enabled: false,
      isNew: true
    },
    {
      id: "6", 
      name: "Dark Theme Plus",
      description: "Enhanced dark theme with customizable colors, animations, and accessibility options.",
      category: "ui",
      status: "beta",
      progress: 90,
      releaseDate: "2025-07-05",
      enabled: true,
      isNew: false
    }
  ]);

  if (!hasAccess('elite')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Award className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
            <h2 className="text-2xl font-bold mb-2">Elite Feature</h2>
            <p className="text-muted-foreground mb-4">
              Early Access to New Features is an Elite tier benefit. Get exclusive previews and beta access to upcoming platform features.
            </p>
            <Badge className="bg-yellow-600 text-white">
              <Award className="h-3 w-3 mr-1" />
              Elite Only
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  const toggleFeature = (featureId: string) => {
    setFeatures(prev => 
      prev.map(feature => 
        feature.id === featureId 
          ? { ...feature, enabled: !feature.enabled }
          : feature
      )
    );

    const feature = features.find(f => f.id === featureId);
    toast({
      title: `${feature?.name} ${feature?.enabled ? 'disabled' : 'enabled'}`,
      description: `Early access feature has been ${feature?.enabled ? 'turned off' : 'turned on'}.`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'beta': return 'bg-blue-600';
      case 'preview': return 'bg-purple-600';
      case 'coming-soon': return 'bg-gray-600';
      default: return 'bg-green-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'analytics': return <BarChart3 className="h-4 w-4" />;
      case 'ui': return <Smartphone className="h-4 w-4" />;
      case 'ai': return <Sparkles className="h-4 w-4" />;
      case 'integrations': return <Globe className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const categorizedFeatures = {
    analytics: features.filter(f => f.category === 'analytics'),
    ui: features.filter(f => f.category === 'ui'),
    ai: features.filter(f => f.category === 'ai'),
    integrations: features.filter(f => f.category === 'integrations')
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Zap className="h-8 w-8 text-yellow-600" />
            <h1 className="text-3xl font-bold text-foreground">Early Access Features</h1>
            <Badge className="bg-yellow-600 text-white">
              <Award className="h-3 w-3 mr-1" />
              Elite
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Get exclusive previews and beta access to upcoming ClearEdge Sports features before they're released to the public.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Beta Features</p>
                  <p className="text-2xl font-bold text-foreground">
                    {features.filter(f => f.status === 'beta').length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Rocket className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Enabled</p>
                  <p className="text-2xl font-bold text-green-600">
                    {features.filter(f => f.enabled).length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Coming Soon</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {features.filter(f => f.status === 'coming-soon').length}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Progress</p>
                  <p className="text-2xl font-bold text-foreground">
                    {Math.round(features.reduce((sum, f) => sum + f.progress, 0) / features.length)}%
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Categories */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Features</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="ui">Interface</TabsTrigger>
            <TabsTrigger value="ai">AI & ML</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="space-y-6">
              {features.map((feature) => (
                <Card key={feature.id} className={`${feature.enabled ? 'border-green-200 bg-green-50/30' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(feature.category)}
                          <CardTitle className="flex items-center space-x-2">
                            <span>{feature.name}</span>
                            {feature.isNew && (
                              <Badge className="bg-red-600 text-white text-xs">NEW</Badge>
                            )}
                          </CardTitle>
                        </div>
                        <Badge className={`${getStatusColor(feature.status)} text-white`}>
                          {feature.status.replace('-', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Release Date</p>
                          <p className="text-sm font-medium">{feature.releaseDate}</p>
                        </div>
                        <Switch
                          checked={feature.enabled}
                          onCheckedChange={() => toggleFeature(feature.id)}
                          disabled={feature.status === 'coming-soon'}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{feature.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Development Progress</span>
                        <span>{feature.progress}%</span>
                      </div>
                      <Progress value={feature.progress} className="h-2" />
                    </div>
                    
                    {feature.enabled && feature.status !== 'coming-soon' && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Bell className="h-4 w-4 text-green-600" />
                          <p className="text-sm text-green-800">
                            This feature is active in your account. You may experience bugs or changes.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {Object.entries(categorizedFeatures).map(([category, categoryFeatures]) => (
            <TabsContent key={category} value={category}>
              <div className="space-y-6">
                {categoryFeatures.map((feature) => (
                  <Card key={feature.id} className={`${feature.enabled ? 'border-green-200 bg-green-50/30' : ''}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <CardTitle className="flex items-center space-x-2">
                            <span>{feature.name}</span>
                            {feature.isNew && (
                              <Badge className="bg-red-600 text-white text-xs">NEW</Badge>
                            )}
                          </CardTitle>
                          <Badge className={`${getStatusColor(feature.status)} text-white`}>
                            {feature.status.replace('-', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        
                        <Switch
                          checked={feature.enabled}
                          onCheckedChange={() => toggleFeature(feature.id)}
                          disabled={feature.status === 'coming-soon'}
                        />
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{feature.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Development Progress</span>
                          <span>{feature.progress}%</span>
                        </div>
                        <Progress value={feature.progress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Feedback Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Beta Feedback</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Help us improve these features by sharing your feedback. Your input directly influences our development priorities.
            </p>
            <div className="flex items-center space-x-4">
              <Button variant="outline">
                Report Bug
              </Button>
              <Button variant="outline">
                Feature Request
              </Button>
              <Button className="bg-yellow-600 hover:bg-yellow-700">
                Send Feedback
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}