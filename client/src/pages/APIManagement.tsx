/**
 * Admin API Management Page
 * Comprehensive monitoring dashboard for all external APIs used in the platform
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Database, 
  DollarSign, 
  Globe, 
  Play, 
  RefreshCw,
  Settings,
  TrendingUp,
  Zap
} from "lucide-react";

interface APIStatus {
  name: string;
  endpoint: string;
  status: 'active' | 'inactive' | 'error' | 'fallback_mode' | 'simulated';
  requestCount: number;
  lastRequest: string;
  cost: string;
  rateLimit: string;
  features: string[];
  note?: string;
  healthCheck?: {
    lastChecked: string;
    responseTime: number;
    success: boolean;
  };
}

interface APIOverview {
  totalAPIs: number;
  activeAPIs: number;
  inactiveAPIs: number;
  apis: APIStatus[];
}

interface HealthCheck {
  name: string;
  success: boolean;
  responseTime: number;
  lastChecked: string;
  error?: string;
  note?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-500';
    case 'inactive': return 'bg-red-500';
    case 'error': return 'bg-red-500';
    case 'fallback_mode': return 'bg-yellow-500';
    case 'simulated': return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'inactive': return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'fallback_mode': return <RefreshCw className="h-4 w-4 text-yellow-500" />;
    case 'simulated': return <Database className="h-4 w-4 text-blue-500" />;
    default: return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

export default function APIManagement() {
  const queryClient = useQueryClient();

  // Fetch API overview
  const { data: apiOverview, isLoading, error } = useQuery<APIOverview>({
    queryKey: ['/api/admin/apis'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Health check mutation
  const healthCheckMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/apis/health-check', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/apis'] });
    }
  });

  // Test integrations mutation
  const testIntegrationsMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/test-integrations', {}),
  });

  // Refresh Baseball Reference data mutation
  const refreshBaseballRefMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/apis/baseball-reference/refresh', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/apis'] });
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading API status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading API Data</AlertTitle>
          <AlertDescription>
            Failed to load API management data. Please check your authentication and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!apiOverview) {
    return <div>No API data available</div>;
  }

  const uptime = apiOverview.activeAPIs / apiOverview.totalAPIs * 100;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage all external APIs used in ClearEdge Sports
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => healthCheckMutation.mutate()}
            disabled={healthCheckMutation.isPending}
            variant="outline"
          >
            {healthCheckMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Activity className="h-4 w-4 mr-2" />
            )}
            Health Check
          </Button>
          <Button 
            onClick={() => testIntegrationsMutation.mutate()}
            disabled={testIntegrationsMutation.isPending}
            variant="outline"
          >
            {testIntegrationsMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Test Integrations
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{apiOverview.totalAPIs}</p>
                <p className="text-xs text-muted-foreground">Total APIs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-green-500">{apiOverview.activeAPIs}</p>
                <p className="text-xs text-muted-foreground">Active APIs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-red-500">{apiOverview.inactiveAPIs}</p>
                <p className="text-xs text-muted-foreground">Inactive APIs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{uptime.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            System Health
          </CardTitle>
          <CardDescription>Overall API system status and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Overall System Health</span>
                <span className="text-sm text-muted-foreground">{uptime.toFixed(1)}%</span>
              </div>
              <Progress value={uptime} className="w-full" />
            </div>
            
            {uptime < 80 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>System Health Warning</AlertTitle>
                <AlertDescription>
                  Multiple APIs are currently inactive. This may impact platform functionality.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Details */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">API Overview</TabsTrigger>
          <TabsTrigger value="health">Health Checks</TabsTrigger>
          <TabsTrigger value="testing">Integration Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {apiOverview.apis.map((api, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(api.status)}
                      <CardTitle className="text-lg">{api.name}</CardTitle>
                      <Badge 
                        variant={api.status === 'active' ? 'default' : 'destructive'}
                        className="capitalize"
                      >
                        {api.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{api.lastRequest}</span>
                    </div>
                  </div>
                  <CardDescription>{api.endpoint}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium mb-1">Request Count</p>
                      <p className="text-muted-foreground">{api.requestCount}</p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Cost</p>
                      <p className="text-muted-foreground">{api.cost}</p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Rate Limit</p>
                      <p className="text-muted-foreground">{api.rateLimit}</p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Features</p>
                      <div className="flex flex-wrap gap-1">
                        {api.features.slice(0, 2).map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {api.features.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{api.features.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {api.note && (
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <p className="text-sm">{api.note}</p>
                    </div>
                  )}
                  {api.name === 'Baseball Reference' && (
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={() => refreshBaseballRefMutation.mutate()}
                        disabled={refreshBaseballRefMutation.isPending}
                        size="sm"
                        variant="outline"
                        className="flex items-center space-x-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${refreshBaseballRefMutation.isPending ? 'animate-spin' : ''}`} />
                        <span>{refreshBaseballRefMutation.isPending ? 'Refreshing...' : 'Refresh Data'}</span>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle>Health Check Results</CardTitle>
              <CardDescription>
                Real-time health status of all API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              {healthCheckMutation.data && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                      Last checked: {new Date((healthCheckMutation.data as any).timestamp).toLocaleString()}
                    </p>
                    <Badge variant="outline">
                      {(healthCheckMutation.data as any).successfulChecks} / {(healthCheckMutation.data as any).totalChecked} passing
                    </Badge>
                  </div>
                  
                  {(healthCheckMutation.data as any).checks.map((check: HealthCheck, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {check.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{check.name}</p>
                          {check.error && (
                            <p className="text-sm text-red-500">{check.error}</p>
                          )}
                          {check.note && (
                            <p className="text-sm text-muted-foreground">{check.note}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{check.responseTime}ms</p>
                        <p>{new Date(check.lastChecked).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {!healthCheckMutation.data && !healthCheckMutation.isPending && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4" />
                  <p>No health check results available</p>
                  <p className="text-sm">Click "Health Check" to run diagnostics</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing">
          <Card>
            <CardHeader>
              <CardTitle>Integration Test Results</CardTitle>
              <CardDescription>
                Test results for all API integrations and data sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testIntegrationsMutation.data && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                      Last tested: {(testIntegrationsMutation.data as any)?.timestamp ? new Date((testIntegrationsMutation.data as any).timestamp).toLocaleString() : 'Never'}
                    </p>
                    <Badge variant="outline">
                      {(testIntegrationsMutation.data as any)?.successfulTests || 0} / {(testIntegrationsMutation.data as any)?.totalTests || 0} passing
                    </Badge>
                  </div>
                  
                  {(testIntegrationsMutation.data as any)?.results?.length > 0 ? (
                    (testIntegrationsMutation.data as any).results.map((result: any, index: number) => (
                    <div key={index} className="space-y-2 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {result.success ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          )}
                          <p className="font-medium">{result.service}</p>
                        </div>
                        <Badge variant={result.success ? 'default' : 'destructive'}>
                          {result.success ? 'Pass' : 'Fail'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{result.data}</p>
                      
                      {result.error && (
                        <p className="text-sm text-red-500">Error: {result.error}</p>
                      )}
                      
                      {result.sample && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-muted-foreground">
                            View sample data
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                            {JSON.stringify(result.sample, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>No test results available</p>
                    </div>
                  )}
                </div>
              )}
              
              {!testIntegrationsMutation.data && !testIntegrationsMutation.isPending && (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4" />
                  <p>No integration test results available</p>
                  <p className="text-sm">Click "Test Integrations" to run comprehensive tests</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}