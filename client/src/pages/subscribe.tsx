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
    description: "Get started with basic MLB insights",
    features: [
      "Basic game odds",
      "Limited AI analysis",
      "3 daily picks",
      "Basic statistics",
    ],
    limitations: [
      "No consensus data",
      "No Kelly calculator",
      "Limited historical data",
    ],
    buttonText: "Current Plan",
    tier: "free",
    popular: false,
  },
  {
    name: "Pro",
    price: 9.99,
    period: "month",
    icon: Star,
    description: "Advanced analytics for serious bettors",
    features: [
      "Everything in Free",
      "Advanced AI analysis",
      "Unlimited daily picks",
      "Consensus data & trends",
      "Kelly calculator",
      "Detailed statistics",
      "Priority support",
    ],
    limitations: [],
    buttonText: "Upgrade to Pro",
    tier: "pro",
    popular: true,
  },
  {
    name: "Elite",
    price: 19.99,
    period: "month",
    icon: Crown,
    description: "Professional-grade tools & insights",
    features: [
      "Everything in Pro",
      "Admin dashboard access",
      "Performance analytics",
      "Custom betting strategies",
      "1-on-1 expert consultation",
      "Early access to new features",
      "White-label options",
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
      // For demo purposes, we'll simulate subscription
      // In a real app, this would integrate with Stripe
      const response = await apiRequest("POST", "/api/subscription/create", { tier });
      
      if (response.ok) {
        toast({
          title: "Subscription successful!",
          description: `Welcome to ${tier} tier! Your features are now active.`,
        });
        window.location.reload(); // Refresh to update user context
      } else {
        throw new Error("Subscription failed");
      }
    } catch (error) {
      toast({
        title: "Subscription failed",
        description: "Unable to process subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Betting Edge
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlock professional-grade MLB betting insights powered by AI. 
            Join thousands of successful bettors who trust our analytics.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = user?.subscriptionTier === plan.tier;
            const isUpgrade = user && user.subscriptionTier === "free" && plan.tier !== "free";
            
            return (
              <Card 
                key={plan.tier} 
                className={`relative ${
                  plan.popular 
                    ? "border-blue-500 shadow-lg scale-105" 
                    : "border-gray-200"
                } ${isCurrentPlan ? "bg-blue-50 border-blue-300" : ""}`}
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
                  
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-600 mt-2">
                    {plan.description}
                  </CardDescription>
                  
                  <div className="mt-6">
                    <span className="text-4xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-600 ml-1">/{plan.period}</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Limitations */}
                  {plan.limitations.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-gray-200">
                      {plan.limitations.map((limitation, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="h-5 w-5 flex-shrink-0 flex items-center justify-center">
                            <div className="h-1 w-3 bg-gray-300 rounded"></div>
                          </div>
                          <span className="text-sm text-gray-500">{limitation}</span>
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
                    variant={plan.tier === "free" ? "outline" : "default"}
                  >
                    {loading === plan.tier ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Processing...
                      </div>
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : (
                      plan.buttonText
                    )}
                  </Button>

                  {isUpgrade && (
                    <p className="text-center text-sm text-blue-600 mt-2">
                      Upgrade anytime, cancel anytime
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Comparison */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Our Platform?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">85%+ Accuracy</h3>
              <p className="text-gray-600">
                Our AI models consistently deliver industry-leading prediction accuracy
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Data</h3>
              <p className="text-gray-600">
                Live odds, injury reports, and market movements updated instantly
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Target className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Analysis</h3>
              <p className="text-gray-600">
                Deep insights from professional analysts and advanced algorithms
              </p>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mt-20 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Trusted by Professional Bettors
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-gray-50 rounded-lg">
              <p className="text-gray-700 mb-4">
                "Increased my win rate from 52% to 68% in just 3 months. The AI insights are incredible."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  M
                </div>
                <div>
                  <p className="font-semibold">Mike R.</p>
                  <p className="text-sm text-gray-600">Professional Bettor</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 rounded-lg">
              <p className="text-gray-700 mb-4">
                "The consensus data alone pays for the subscription. Best investment I've made."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                  S
                </div>
                <div>
                  <p className="font-semibold">Sarah T.</p>
                  <p className="text-sm text-gray-600">Sports Analyst</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}