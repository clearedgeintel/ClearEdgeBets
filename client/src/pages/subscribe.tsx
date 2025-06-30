import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Target, TrendingUp, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const plans = [
  {
    name: "Free",
    price: 0,
    period: "forever",
    icon: Target,
    description: "Get started with basic ClearEdge analysis",
    features: [
      "View daily MLB games",
      "Top 3 AI daily picks",
      "Basic game information",
      "Virtual sportsbook practice",
      "$1000 virtual balance",
      "Mobile-optimized interface",
    ],
    limitations: [
      "No full AI analysis access",
      "No consensus data",
      "No Kelly calculator",
      "Limited daily picks",
    ],
    buttonText: "Current Plan",
    tier: "free",
    popular: false,
  },
  {
    name: "Pro",
    price: 25,
    period: "month",
    icon: Star,
    description: "Advanced analytics for serious bettors",
    features: [
      "Everything in Free",
      "Full AI game analysis",
      "Unlimited daily picks",
      "Kelly calculator",
      "Hot trends & consensus data",
      "Player props analysis",
      "Betting performance tracking",
      "Historical game data",
    ],
    limitations: [],
    buttonText: "Upgrade to Pro",
    tier: "pro",
    popular: true,
  },
  {
    name: "Elite",
    price: 40,
    period: "month",
    icon: Crown,
    description: "Professional-grade tools & insights",
    features: [
      "Everything in Pro",
      "AI betting assistant chat",
      "Advanced parlay builder",
      "Performance analytics dashboard",
      "Custom betting strategies",
      "Admin panel access",
      "Multi-sport coverage (MLB, CFL)",
      "Priority customer support",
    ],
    limitations: [],
    buttonText: "Go Elite",
    tier: "elite",
    popular: false,
  },
];

export default function Subscribe() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (tier: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to subscribe to a plan.",
        variant: "destructive",
      });
      return;
    }

    if (user.subscriptionTier === tier) {
      toast({
        title: "Already subscribed",
        description: `You're already on the ${tier} plan.`,
      });
      return;
    }

    setLoading(tier);

    try {
      const response = await apiRequest("POST", "/api/subscription/change", { tier });
      
      if (response.ok) {
        const action = getTierAction(user.subscriptionTier, tier);
        toast({
          title: `Subscription ${action}!`,
          description: `Successfully ${action}d to ${tier} tier. Your features are now active.`,
        });
        window.location.reload(); // Refresh to update user context
      } else {
        throw new Error("Subscription change failed");
      }
    } catch (error) {
      toast({
        title: "Subscription change failed",
        description: "Unable to process subscription change. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  // Helper function to determine action type
  const getTierAction = (currentTier: string, newTier: string) => {
    const tierLevels = { free: 0, pro: 1, elite: 2 };
    const currentLevel = tierLevels[currentTier as keyof typeof tierLevels];
    const newLevel = tierLevels[newTier as keyof typeof tierLevels];
    
    if (newLevel > currentLevel) return "upgrade";
    if (newLevel < currentLevel) return "downgrade";
    return "change";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Get Your ClearEdge Advantage
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Unlock professional-grade MLB betting insights powered by AI. 
            Join thousands of successful bettors who trust ClearEdge Bets analytics.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = user?.subscriptionTier === plan.tier;
            
            // Determine button action based on tier hierarchy
            const tierLevels = { free: 0, pro: 1, elite: 2 };
            const currentLevel = tierLevels[user?.subscriptionTier as keyof typeof tierLevels] ?? 0;
            const planLevel = tierLevels[plan.tier as keyof typeof tierLevels];
            
            const isUpgrade = planLevel > currentLevel;
            const isDowngrade = planLevel < currentLevel;
            
            return (
              <Card 
                key={plan.tier} 
                className={`relative ${
                  plan.popular 
                    ? "border-primary shadow-lg scale-105" 
                    : "border-border"
                } ${isCurrentPlan ? "bg-primary/5 border-primary/50" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${
                      plan.tier === "free" 
                        ? "bg-gray-100" 
                        : plan.tier === "pro" 
                          ? "bg-blue-100" 
                          : "bg-yellow-100"
                    }`}>
                      <Icon className={`h-8 w-8 ${
                        plan.tier === "free" 
                          ? "text-gray-600" 
                          : plan.tier === "pro" 
                            ? "text-blue-600" 
                            : "text-yellow-600"
                      }`} />
                    </div>
                  </div>
                  
                  <CardTitle className="text-2xl font-bold text-foreground">{plan.name}</CardTitle>
                  <CardDescription className="text-muted-foreground mt-2">
                    {plan.description}
                  </CardDescription>
                  
                  <div className="mt-6">
                    <span className="text-4xl font-bold text-foreground">
                      ${plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground ml-1">/{plan.period}</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Limitations */}
                  {plan.limitations.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-border">
                      {plan.limitations.map((limitation, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="h-5 w-5 flex-shrink-0 flex items-center justify-center">
                            <div className="h-1 w-3 bg-muted-foreground rounded"></div>
                          </div>
                          <span className="text-sm text-muted-foreground">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    onClick={() => handleSubscribe(plan.tier)}
                    disabled={isCurrentPlan || loading === plan.tier}
                    className={`w-full mt-6 ${
                      plan.popular 
                        ? "bg-blue-600 hover:bg-blue-700" 
                        : plan.tier === "elite"
                          ? "bg-yellow-600 hover:bg-yellow-700"
                          : ""
                    } ${isCurrentPlan ? "bg-gray-400" : ""}`}
                    variant={plan.tier === "free" || isDowngrade ? "outline" : "default"}
                  >
                    {loading === plan.tier ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Processing...
                      </div>
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : isUpgrade ? (
                      `Upgrade to ${plan.name}`
                    ) : isDowngrade ? (
                      `Downgrade to ${plan.name}`
                    ) : (
                      plan.buttonText
                    )}
                  </Button>

                  {(isUpgrade || isDowngrade) && !isCurrentPlan && (
                    <p className="text-center text-sm text-primary mt-2">
                      {isUpgrade ? "Upgrade anytime, cancel anytime" : "Downgrade anytime, keep savings"}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Comparison */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Why Choose ClearEdge Bets?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-blue-600/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">AI-Powered Analytics</h3>
              <p className="text-muted-foreground">
                Advanced machine learning models analyze pitching matchups, team trends, and market data
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-600/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Live MLB Data</h3>
              <p className="text-muted-foreground">
                Real-time game data, authentic pitcher statistics, and up-to-date betting odds
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-600/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Target className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Multi-Sport Coverage</h3>
              <p className="text-muted-foreground">
                Comprehensive MLB and CFL analysis with NHL and NBA coming soon
              </p>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mt-20 bg-card rounded-2xl shadow-lg p-8 border border-border">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">
            Trusted by Sports Bettors
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-muted/50 rounded-lg">
              <p className="text-foreground mb-4">
                "The virtual sportsbook helped me practice before risking real money. Now I'm consistently profitable."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  M
                </div>
                <div>
                  <p className="font-semibold text-foreground">Mike R.</p>
                  <p className="text-sm text-muted-foreground">Sports Bettor</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-muted/50 rounded-lg">
              <p className="text-foreground mb-4">
                "The AI daily picks and Kelly calculator have completely changed my betting strategy."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                  S
                </div>
                <div>
                  <p className="font-semibold text-foreground">Sarah T.</p>
                  <p className="text-sm text-muted-foreground">Data Analyst</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}