import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building, 
  Award, 
  Palette,
  Globe,
  Settings,
  Upload,
  Eye,
  Code,
  Users,
  Zap,
  Shield,
  Smartphone
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

interface WhiteLabelConfig {
  branding: {
    companyName: string;
    logo: string;
    primaryColor: string;
    secondaryColor: string;
    domain: string;
  };
  features: {
    hideClearEdgeBranding: boolean;
    customFooter: boolean;
    customDashboard: boolean;
    apiAccess: boolean;
  };
  customization: {
    welcomeMessage: string;
    supportEmail: string;
    termsUrl: string;
    privacyUrl: string;
  };
}

export default function WhiteLabel() {
  const { user, hasAccess } = useAuth();
  const { toast } = useToast();

  // Mock white label configuration
  const [config, setConfig] = useState<WhiteLabelConfig>({
    branding: {
      companyName: "SportsBet Analytics",
      logo: "",
      primaryColor: "#2563eb",
      secondaryColor: "#1e40af",
      domain: "analytics.sportsbet.com"
    },
    features: {
      hideClearEdgeBranding: true,
      customFooter: true,
      customDashboard: false,
      apiAccess: true
    },
    customization: {
      welcomeMessage: "Welcome to SportsBet Analytics - Your Edge in Professional Sports Betting",
      supportEmail: "support@sportsbet.com",
      termsUrl: "https://sportsbet.com/terms",
      privacyUrl: "https://sportsbet.com/privacy"
    }
  });

  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  if (!hasAccess('elite')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Award className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
            <h2 className="text-2xl font-bold mb-2">Elite Feature</h2>
            <p className="text-muted-foreground mb-4">
              White-Label Options is an Elite tier feature. Create fully branded versions of ClearEdge Sports for your business or clients.
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

  const handleSaveConfig = () => {
    toast({
      title: "Configuration saved",
      description: "Your white-label settings have been updated successfully.",
    });
  };

  const handleUploadLogo = () => {
    toast({
      title: "Logo uploaded",
      description: "Your company logo has been updated.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Building className="h-8 w-8 text-yellow-600" />
              <h1 className="text-3xl font-bold text-foreground">White-Label Options</h1>
              <Badge className="bg-yellow-600 text-white">
                <Award className="h-3 w-3 mr-1" />
                Elite
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Create fully branded versions of ClearEdge Sports for your business, clients, or partners.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => setPreviewMode(previewMode === 'desktop' ? 'mobile' : 'desktop')}>
              {previewMode === 'desktop' ? <Smartphone className="h-4 w-4 mr-2" /> : <Globe className="h-4 w-4 mr-2" />}
              {previewMode === 'desktop' ? 'Mobile Preview' : 'Desktop Preview'}
            </Button>
            <Button onClick={handleSaveConfig} className="bg-yellow-600 hover:bg-yellow-700">
              <Settings className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <Tabs defaultValue="branding" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="branding">Branding</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="customization">Customization</TabsTrigger>
              </TabsList>

              <TabsContent value="branding">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Palette className="h-5 w-5" />
                      <span>Brand Settings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={config.branding.companyName}
                        onChange={(e) => setConfig({
                          ...config,
                          branding: { ...config.branding, companyName: e.target.value }
                        })}
                        placeholder="Your Company Name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="domain">Custom Domain</Label>
                      <Input
                        id="domain"
                        value={config.branding.domain}
                        onChange={(e) => setConfig({
                          ...config,
                          branding: { ...config.branding, domain: e.target.value }
                        })}
                        placeholder="analytics.yourcompany.com"
                      />
                    </div>

                    <div>
                      <Label>Company Logo</Label>
                      <div className="mt-2 flex items-center space-x-4">
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          <Building className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <Button variant="outline" onClick={handleUploadLogo}>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Logo
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Recommended: 200x60px PNG or SVG with transparent background
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <div className="flex items-center space-x-2 mt-2">
                          <Input
                            id="primaryColor"
                            type="color"
                            value={config.branding.primaryColor}
                            onChange={(e) => setConfig({
                              ...config,
                              branding: { ...config.branding, primaryColor: e.target.value }
                            })}
                            className="w-16 h-10"
                          />
                          <Input
                            value={config.branding.primaryColor}
                            onChange={(e) => setConfig({
                              ...config,
                              branding: { ...config.branding, primaryColor: e.target.value }
                            })}
                            placeholder="#2563eb"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="secondaryColor">Secondary Color</Label>
                        <div className="flex items-center space-x-2 mt-2">
                          <Input
                            id="secondaryColor"
                            type="color"
                            value={config.branding.secondaryColor}
                            onChange={(e) => setConfig({
                              ...config,
                              branding: { ...config.branding, secondaryColor: e.target.value }
                            })}
                            className="w-16 h-10"
                          />
                          <Input
                            value={config.branding.secondaryColor}
                            onChange={(e) => setConfig({
                              ...config,
                              branding: { ...config.branding, secondaryColor: e.target.value }
                            })}
                            placeholder="#1e40af"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="features">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>Feature Configuration</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Hide ClearEdge Branding</h4>
                          <p className="text-sm text-muted-foreground">
                            Remove all ClearEdge Sports references and logos
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={config.features.hideClearEdgeBranding}
                          onChange={(e) => setConfig({
                            ...config,
                            features: { ...config.features, hideClearEdgeBranding: e.target.checked }
                          })}
                          className="w-4 h-4"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Custom Footer</h4>
                          <p className="text-sm text-muted-foreground">
                            Replace footer with your company information
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={config.features.customFooter}
                          onChange={(e) => setConfig({
                            ...config,
                            features: { ...config.features, customFooter: e.target.checked }
                          })}
                          className="w-4 h-4"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">API Access</h4>
                          <p className="text-sm text-muted-foreground">
                            Enable API endpoints for custom integrations
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={config.features.apiAccess}
                          onChange={(e) => setConfig({
                            ...config,
                            features: { ...config.features, apiAccess: e.target.checked }
                          })}
                          className="w-4 h-4"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Custom Dashboard</h4>
                          <p className="text-sm text-muted-foreground">
                            Customize dashboard layout and widgets
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={config.features.customDashboard}
                          onChange={(e) => setConfig({
                            ...config,
                            features: { ...config.features, customDashboard: e.target.checked }
                          })}
                          className="w-4 h-4"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="customization">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Code className="h-5 w-5" />
                      <span>Content Customization</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="welcomeMessage">Welcome Message</Label>
                      <Textarea
                        id="welcomeMessage"
                        value={config.customization.welcomeMessage}
                        onChange={(e) => setConfig({
                          ...config,
                          customization: { ...config.customization, welcomeMessage: e.target.value }
                        })}
                        placeholder="Welcome message for your users"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="supportEmail">Support Email</Label>
                      <Input
                        id="supportEmail"
                        type="email"
                        value={config.customization.supportEmail}
                        onChange={(e) => setConfig({
                          ...config,
                          customization: { ...config.customization, supportEmail: e.target.value }
                        })}
                        placeholder="support@yourcompany.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="termsUrl">Terms of Service URL</Label>
                      <Input
                        id="termsUrl"
                        type="url"
                        value={config.customization.termsUrl}
                        onChange={(e) => setConfig({
                          ...config,
                          customization: { ...config.customization, termsUrl: e.target.value }
                        })}
                        placeholder="https://yourcompany.com/terms"
                      />
                    </div>

                    <div>
                      <Label htmlFor="privacyUrl">Privacy Policy URL</Label>
                      <Input
                        id="privacyUrl"
                        type="url"
                        value={config.customization.privacyUrl}
                        onChange={(e) => setConfig({
                          ...config,
                          customization: { ...config.customization, privacyUrl: e.target.value }
                        })}
                        placeholder="https://yourcompany.com/privacy"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Deployment Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Deployment Options</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Subdomain Hosting</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Host your white-label platform on a ClearEdge subdomain
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-600">analytics.clearedge.com</span>
                      <Button size="sm" variant="outline">Free</Button>
                    </div>
                  </div>

                  <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Custom Domain</h4>
                    <p className="text-sm text-green-700 mb-3">
                      Use your own domain with SSL certificate included
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-green-600">{config.branding.domain}</span>
                      <Button size="sm" variant="outline">$49/month</Button>
                    </div>
                  </div>

                  <div className="p-4 border border-purple-200 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">Enterprise Deployment</h4>
                    <p className="text-sm text-purple-700 mb-3">
                      Self-hosted solution with full source code access
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-purple-600">Contact Sales</span>
                      <Button size="sm" variant="outline">Custom Pricing</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Preview */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Live Preview</span>
                  <Badge variant="outline">{previewMode}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`border rounded-lg bg-white shadow-sm ${previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}`}>
                  {/* Preview Header */}
                  <div 
                    className="p-4 border-b"
                    style={{ backgroundColor: config.branding.primaryColor + '20' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: config.branding.primaryColor }}
                        >
                          {config.branding.companyName.charAt(0)}
                        </div>
                        <h3 className="font-bold text-gray-900">
                          {config.branding.companyName}
                        </h3>
                      </div>
                      <div className="text-xs text-gray-500">
                        {config.branding.domain}
                      </div>
                    </div>
                  </div>

                  {/* Preview Content */}
                  <div className="p-4 space-y-4">
                    <div className="text-center">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {config.customization.welcomeMessage.split(' ').slice(0, 6).join(' ')}...
                      </h4>
                      <div className="text-xs text-gray-500">
                        Live betting analytics dashboard
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div 
                        className="p-3 rounded text-white text-center"
                        style={{ backgroundColor: config.branding.primaryColor }}
                      >
                        <div className="text-lg font-bold">68.5%</div>
                        <div className="text-xs">Win Rate</div>
                      </div>
                      <div 
                        className="p-3 rounded text-white text-center"
                        style={{ backgroundColor: config.branding.secondaryColor }}
                      >
                        <div className="text-lg font-bold">+$1,247</div>
                        <div className="text-xs">Profit</div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-2">Featured Games</div>
                      <div className="space-y-2">
                        <div className="p-2 bg-gray-50 rounded text-xs">
                          Yankees vs Red Sox • 7:00 PM
                        </div>
                        <div className="p-2 bg-gray-50 rounded text-xs">
                          Dodgers vs Giants • 10:00 PM
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview Footer */}
                  {config.features.customFooter && (
                    <div className="p-3 border-t bg-gray-50 text-center">
                      <div className="text-xs text-gray-500">
                        © 2025 {config.branding.companyName}
                      </div>
                      <div className="text-xs text-gray-400">
                        {config.customization.supportEmail}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <Button variant="outline" className="w-full" size="sm">
                    <Globe className="h-4 w-4 mr-2" />
                    View Full Preview
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Share Preview Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}