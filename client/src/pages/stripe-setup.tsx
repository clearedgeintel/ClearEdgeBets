import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Copy,
  ExternalLink,
  Key,
  Webhook,
  DollarSign
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context";

interface StripeConfig {
  stripeSecretKey: string;
  proPriceId: string;
  elitePriceId: string;
  webhookSecret: string;
  isConfigured: boolean;
}

export default function StripeSetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [config, setConfig] = useState<StripeConfig>({
    stripeSecretKey: '',
    proPriceId: '',
    elitePriceId: '',
    webhookSecret: '',
    isConfigured: false
  });

  // For now, allow any logged-in user to access Stripe setup
  if (!user) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto h-16 w-16 text-red-400 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Authentication Required</h1>
        <p className="text-gray-400">
          Please log in to access Stripe configuration settings.
        </p>
      </div>
    );
  }

  // Fetch current Stripe configuration
  const { data: currentConfig, isLoading } = useQuery<StripeConfig>({
    queryKey: ["/api/admin/stripe-config"],
    retry: false,
  });

  useEffect(() => {
    if (currentConfig) {
      setConfig(currentConfig);
    }
  }, [currentConfig]);

  // Save Stripe configuration
  const saveConfigMutation = useMutation({
    mutationFn: async (configData: Partial<StripeConfig>) => {
      return await apiRequest("POST", "/api/admin/stripe-config", configData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stripe-config"] });
      toast({
        title: "Configuration Saved",
        description: "Stripe integration has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save configuration",
        variant: "destructive",
      });
    },
  });

  // Test Stripe connection
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/stripe-test");
    },
    onSuccess: () => {
      toast({
        title: "Connection Successful",
        description: "Stripe API is working correctly.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Unable to connect to Stripe",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveConfigMutation.mutate(config);
  };

  const handleTestConnection = () => {
    testConnectionMutation.mutate();
  };

  const copyWebhookUrl = () => {
    const webhookUrl = `${window.location.origin}/api/webhooks/stripe`;
    navigator.clipboard.writeText(webhookUrl);
    toast({
      title: "Copied to Clipboard",
      description: "Webhook URL has been copied.",
    });
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="text-center">
        <CreditCard className="mx-auto h-16 w-16 text-blue-400 mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">Stripe Integration Setup</h1>
        <p className="text-gray-400 mb-6">
          Configure your Stripe products and webhook settings for subscription management
        </p>
        {config.isConfigured ? (
          <Badge className="bg-green-600 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Configured
          </Badge>
        ) : (
          <Badge variant="outline" className="border-yellow-600 text-yellow-400">
            <AlertCircle className="w-3 h-3 mr-1" />
            Setup Required
          </Badge>
        )}
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Step 1: Stripe Dashboard Setup */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <ExternalLink className="h-5 w-5 mr-2" />
              Step 1: Create Products in Stripe Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Required Products:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-blue-600/20 p-3 rounded border border-blue-600/30">
                  <div className="font-medium text-blue-400">Pro Plan</div>
                  <div className="text-gray-300">$25.00 USD / month</div>
                  <div className="text-xs text-gray-400 mt-1">Recurring billing</div>
                </div>
                <div className="bg-purple-600/20 p-3 rounded border border-purple-600/30">
                  <div className="font-medium text-purple-400">Elite Plan</div>
                  <div className="text-gray-300">$40.00 USD / month</div>
                  <div className="text-xs text-gray-400 mt-1">Recurring billing</div>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.open('https://dashboard.stripe.com/products', '_blank')}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Stripe Dashboard
            </Button>
          </CardContent>
        </Card>

        {/* Step 2: API Configuration */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Key className="h-5 w-5 mr-2" />
              Step 2: API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="space-y-2">
              <Label className="text-gray-300">Stripe Secret Key</Label>
              <Input
                type="password"
                placeholder="sk_test_... or sk_live_..."
                value={config.stripeSecretKey}
                onChange={(e) => setConfig(prev => ({ ...prev, stripeSecretKey: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
              />
              <p className="text-xs text-gray-400">
                Found in Stripe Dashboard → Developers → API keys
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Pro Plan Price ID</Label>
                <Input
                  placeholder="price_..."
                  value={config.proPriceId}
                  onChange={(e) => setConfig(prev => ({ ...prev, proPriceId: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400">$25/month product price ID</p>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Elite Plan Price ID</Label>
                <Input
                  placeholder="price_..."
                  value={config.elitePriceId}
                  onChange={(e) => setConfig(prev => ({ ...prev, elitePriceId: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-400">$40/month product price ID</p>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Step 3: Webhook Configuration */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Webhook className="h-5 w-5 mr-2" />
              Step 3: Webhook Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="space-y-2">
              <Label className="text-gray-300">Webhook Endpoint URL</Label>
              <div className="flex">
                <Input
                  readOnly
                  value={`${window.location.origin}/api/webhooks/stripe`}
                  className="bg-gray-700 border-gray-600 text-white flex-1"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyWebhookUrl}
                  className="ml-2"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                Add this URL to your Stripe webhook endpoints
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Webhook Signing Secret</Label>
              <Input
                type="password"
                placeholder="whsec_..."
                value={config.webhookSecret}
                onChange={(e) => setConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
              />
              <p className="text-xs text-gray-400">
                Found in your webhook endpoint settings after creation
              </p>
            </div>

            <div className="bg-gray-900 p-4 rounded-lg">
              <h4 className="font-medium text-white mb-2">Required Webhook Events:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                <div>• checkout.session.completed</div>
                <div>• invoice.payment_succeeded</div>
                <div>• invoice.payment_failed</div>
                <div>• customer.subscription.deleted</div>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={() => window.open('https://dashboard.stripe.com/webhooks', '_blank')}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Configure Webhooks in Stripe
            </Button>

          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button 
            onClick={handleSave}
            disabled={saveConfigMutation.isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {saveConfigMutation.isPending ? (
              <>Saving...</>
            ) : (
              <>
                <Settings className="h-4 w-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>

          <Button 
            variant="outline"
            onClick={handleTestConnection}
            disabled={testConnectionMutation.isPending || !config.stripeSecretKey}
            className="flex-1"
          >
            {testConnectionMutation.isPending ? (
              <>Testing...</>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>
        </div>

        {/* Current Pricing Display */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Current Pricing Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900 p-4 rounded-lg text-center">
                <div className="text-gray-400 font-medium">Free Tier</div>
                <div className="text-2xl font-bold text-white">$0</div>
                <div className="text-sm text-gray-400">Forever</div>
                <div className="mt-2 text-xs text-gray-500">
                  Kelly Calculator, Games, My Bets
                </div>
              </div>
              <div className="bg-blue-600/20 p-4 rounded-lg text-center border border-blue-600/30">
                <div className="text-blue-400 font-medium">Pro Tier</div>
                <div className="text-2xl font-bold text-white">$25</div>
                <div className="text-sm text-gray-400">per month</div>
                <div className="mt-2 text-xs text-gray-500">
                  Daily Picks, Odds Comparison, Hot Trends
                </div>
              </div>
              <div className="bg-purple-600/20 p-4 rounded-lg text-center border border-purple-600/30">
                <div className="text-purple-400 font-medium">Elite Tier</div>
                <div className="text-2xl font-bold text-white">$40</div>
                <div className="text-sm text-gray-400">per month</div>
                <div className="mt-2 text-xs text-gray-500">
                  AI Assistant, Parlay Builder, Analytics
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}