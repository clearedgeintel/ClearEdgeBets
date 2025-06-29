import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import MobileNav from "@/components/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, RefreshCw, Calendar, TrendingUp } from "lucide-react";

interface DigestData {
  content: string;
  generatedAt: string;
}

export default function DailyDigest() {
  const { data: digest, isLoading, refetch } = useQuery<DigestData>({
    queryKey: ["/api/digest"],
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportToPDF = () => {
    // In a real implementation, this would generate a PDF
    // For now, we'll just create a text file
    const content = digest?.content || "";
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mlb-digest-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          </div>
          <Card>
            <CardContent className="p-8">
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <FileText className="h-8 w-8 text-primary" />
                <span>Daily MLB Digest</span>
              </h1>
              <p className="text-gray-600 mt-1">
                AI-powered analysis and betting insights for today's games
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportToPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Digest Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {digest ? `Generated ${formatDate(digest.generatedAt)}` : 'Loading...'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-secondary text-white">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  AI Analysis
                </Badge>
                <Badge variant="outline">Premium Insights</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Digest Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Today's Betting Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {digest ? (
              <div className="prose prose-gray max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {digest.content}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Digest Unavailable</h3>
                  <p className="text-sm">
                    The daily digest is not available at this time. Please check back later.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            This digest is generated using AI analysis of current odds, line movements, and team statistics.
            Always do your own research before placing bets.
          </p>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
