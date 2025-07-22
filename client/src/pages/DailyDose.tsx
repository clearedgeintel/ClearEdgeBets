import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Send, RefreshCw, Calendar, Download } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface DailyDoseData {
  success: boolean;
  html: string;
  metadata: {
    date: string;
    totalGames: number;
    topValueBets: number;
    generatedAt: string;
  };
}

export default function DailyDose() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNewsletter, setGeneratedNewsletter] = useState<string | null>(null);

  // Fetch existing daily dose data
  const { data: existingDose, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['/api/daily-dose'],
    retry: false,
  });

  // Generate new daily dose mutation
  const generateMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/daily-dose/generate', {}),
    onMutate: () => {
      setIsGenerating(true);
    },
    onSuccess: (data: DailyDoseData) => {
      setGeneratedNewsletter(data.html);
      setIsGenerating(false);
    },
    onError: () => {
      setIsGenerating(false);
    }
  });

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const handleDownload = (html: string) => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-dose-${format(new Date(), 'yyyy-MM-dd')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentHtml = generatedNewsletter || (existingDose?.success ? existingDose.html : null);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-foreground">📬 The Daily Dose</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional MLB betting newsletter featuring top value bets, Kelly criterion analysis, 
            and comprehensive game insights powered by authentic Baseball Reference data.
          </p>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Newsletter Controls</span>
            </CardTitle>
            <CardDescription>
              Generate today's Daily Dose newsletter with live MLB data and advanced analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Generating...' : 'Generate Today\'s Newsletter'}</span>
              </Button>

              {currentHtml && (
                <Button
                  variant="outline"
                  onClick={() => handleDownload(currentHtml)}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download HTML</span>
                </Button>
              )}

              {existingDose?.metadata && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Badge variant="outline">
                    Last Generated: {format(new Date(existingDose.metadata.generatedAt), 'MMM dd, yyyy HH:mm')}
                  </Badge>
                  <Badge variant="outline">
                    {existingDose.metadata.totalGames} Games
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Newsletter Preview */}
        {currentHtml ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Newsletter Preview</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-green-600">
                    Ready to Send
                  </Badge>
                  <Button size="sm" variant="outline" className="flex items-center space-x-1">
                    <Send className="h-3 w-3" />
                    <span>Send</span>
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <div 
                  className="newsletter-preview"
                  dangerouslySetInnerHTML={{ __html: currentHtml }}
                  style={{
                    maxHeight: '800px',
                    overflowY: 'auto',
                    padding: '20px',
                    backgroundColor: '#fafafa'
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold">No Newsletter Generated</h3>
                  <p className="text-muted-foreground">
                    Click "Generate Today's Newsletter" to create a new Daily Dose with live MLB data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔥 Value Bets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Top 3 bets ranked by expected value with Kelly criterion stake recommendations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎟️ $100 Bankroll</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Professional Kelly-based ticket allocation for optimal bankroll management
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📊 Power Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Team power scores and advanced matchup analysis from Baseball Reference data
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}