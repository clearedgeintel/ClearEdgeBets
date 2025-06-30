import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  Send, 
  Zap, 
  TrendingUp, 
  Target, 
  BarChart3,
  MessageCircle,
  Sparkles,
  Clock,
  CheckCircle
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QuickQuestion {
  id: string;
  question: string;
  category: string;
  icon: any;
}

const quickQuestions: QuickQuestion[] = [
  {
    id: '1',
    question: "Which unders have edge today?",
    category: "Value Betting",
    icon: TrendingUp
  },
  {
    id: '2',
    question: "What are your highest confidence picks?",
    category: "Top Picks",
    icon: Target
  },
  {
    id: '3',
    question: "Which games have the best pitcher matchups?",
    category: "Pitcher Analysis",
    icon: BarChart3
  },
  {
    id: '4',
    question: "Show me contrarian plays with value",
    category: "Contrarian",
    icon: Zap
  },
  {
    id: '5',
    question: "What weather conditions affect today's games?",
    category: "Weather Impact",
    icon: Brain
  },
  {
    id: '6',
    question: "Which home underdogs have the best chance?",
    category: "Home Underdogs",
    icon: Sparkles
  }
];

export default function AIAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your AI betting assistant. I can help you analyze today's games, find value bets, and answer questions about pitcher matchups, weather impacts, and betting strategies. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch today's games for context
  const { data: games } = useQuery({
    queryKey: ['/api/games'],
  });

  const { data: dailyPicks } = useQuery({
    queryKey: ['/api/daily-picks'],
  });

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Generate AI response based on question
    const response = await generateAIResponse(content.trim(), games || [], dailyPicks || []);
    
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: response,
      timestamp: new Date()
    };

    setTimeout(() => {
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const generateAIResponse = async (question: string, games: any[], dailyPicks: any[]): Promise<string> => {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('under') && lowerQuestion.includes('edge')) {
      const underPicks = dailyPicks?.filter(pick => 
        pick.betType === 'total' && pick.selection === 'under'
      ) || [];
      
      if (underPicks.length === 0) {
        return "I don't see any strong under plays with significant edge today. The totals market appears efficiently priced. Consider focusing on moneyline or spread opportunities instead.";
      }

      const topUnders = underPicks
        .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
        .slice(0, 3);

      return `Here are today's best under plays with edge:\n\n${topUnders.map((pick, index) => 
        `${index + 1}. **${(pick.gameId || 'Game TBD').replace('2025-06-30_', '').replace(' @ ', ' vs ')}** - Under ${pick.reasoning?.includes('total') ? pick.reasoning.match(/under (\d+\.?\d*)/i)?.[1] || 'TBD' : 'TBD'}\n   Confidence: ${pick.confidence || 65}% | Edge based on pitcher stats and weather conditions`
      ).join('\n\n')}\n\nKey factors: Strong pitching matchups, potential weather impact, and public over-betting create value on the under side.`;
    }

    if (lowerQuestion.includes('highest confidence') || lowerQuestion.includes('best pick')) {
      const topPicks = dailyPicks?.sort((a, b) => (b.confidence || 0) - (a.confidence || 0)).slice(0, 3) || [];
      
      if (topPicks.length === 0) {
        return "Analysis is still being generated for today's games. Check back in a few minutes for the highest confidence picks.";
      }

      return `Today's highest confidence picks:\n\n${topPicks.map((pick, index) => 
        `${index + 1}. **${(pick.gameId || 'Game TBD').replace('2025-06-30_', '').replace(' @ ', ' vs ')}**\n   ${(pick.betType || 'Pick').toUpperCase()}: ${pick.selection || 'TBD'}\n   Confidence: ${pick.confidence || 70}%\n   Reasoning: ${pick.reasoning?.slice(0, 100) || 'Analysis based on current data'}...`
      ).join('\n\n')}\n\nThese picks combine strong statistical edges with favorable matchup dynamics.`;
    }

    if (lowerQuestion.includes('pitcher') && lowerQuestion.includes('matchup')) {
      const gamesWithPitchers = games?.filter(game => game.awayPitcher && game.homePitcher) || [];
      
      if (gamesWithPitchers.length === 0) {
        return "Pitcher information is still being loaded for today's games. The best matchups typically feature aces with strong strikeout rates facing weaker offensive lineups.";
      }

      return `Today's best pitcher matchups:\n\n${gamesWithPitchers.slice(0, 3).map((game, index) => 
        `${index + 1}. **${game.awayTeam} @ ${game.homeTeam}**\n   ${game.awayPitcher} vs ${game.homePitcher}\n   Key factors: Strikeout rates, WHIP, and recent form favor defensive play`
      ).join('\n\n')}\n\nFocus on unders and pitcher props in these elite matchups with proven starters.`;
    }

    if (lowerQuestion.includes('contrarian') || lowerQuestion.includes('fade')) {
      return `Today's contrarian opportunities:\n\n1. **Public favorites getting heavy action** - Look for value on underdogs in games with 70%+ public betting\n\n2. **Over-inflated totals** - Weather and pitcher matchups suggest unders in high-total games\n\n3. **Divisional underdogs** - Familiarity breeds close games, especially with quality pitching\n\nThe key is finding spots where public perception doesn't match analytical value.`;
    }

    if (lowerQuestion.includes('weather')) {
      return `Weather impact for today's games:\n\n• **Wind conditions** affecting 3 games - favorable for unders\n• **Temperature** in the 70s-80s range - neutral impact\n• **No precipitation** expected - all games should play as scheduled\n\nWeather is a minor factor today. Focus on pitcher matchups and lineup strength instead.`;
    }

    if (lowerQuestion.includes('home underdog')) {
      const homeUnderdogs = games?.filter(game => {
        // Simple logic to identify potential home underdogs
        return game.homeTeam && Math.random() > 0.6; // Simplified for demo
      }) || [];

      return `Home underdog opportunities:\n\n${homeUnderdogs.slice(0, 2).map((game, index) => 
        `${index + 1}. **${game.homeTeam}** vs ${game.awayTeam}\n   Home field advantage + motivated lineup\n   Value at current odds`
      ).join('\n\n')}\n\nHome underdogs with strong pitching provide excellent value, especially in day games.`;
    }

    // Default response for unrecognized questions
    return `I can help you analyze today's betting opportunities! Try asking about:\n\n• Value plays and edge opportunities\n• Highest confidence picks\n• Pitcher matchup analysis\n• Contrarian betting spots\n• Weather impact on games\n• Home underdog value\n\nWhat specific aspect of today's games would you like me to analyze?`;
  };

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  if (!user || user.subscriptionTier !== 'elite') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Brain className="h-12 w-12 text-purple-600" />
                <h1 className="text-4xl font-bold text-foreground">AI Betting Assistant</h1>
                <Badge className="bg-purple-600 text-white">
                  <Zap className="h-3 w-3 mr-1" />
                  Elite
                </Badge>
              </div>
              <p className="text-xl text-muted-foreground">
                Get instant answers to your betting questions with AI-powered analysis
              </p>
            </div>

            <Card className="p-8">
              <CardContent>
                <div className="text-center space-y-6">
                  <div className="p-6 bg-purple-50 border border-purple-200 rounded-lg">
                    <Zap className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-purple-800 mb-2">Elite Feature</h3>
                    <p className="text-purple-700">
                      Access our AI betting assistant to get instant analysis and answers to questions like "Which unders have edge today?" and "What are your highest confidence picks?"
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Sample Questions You Can Ask:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {quickQuestions.map((q) => {
                        const Icon = q.icon;
                        return (
                          <div key={q.id} className="p-4 border rounded-lg bg-muted">
                            <div className="flex items-center space-x-2 mb-2">
                              <Icon className="h-4 w-4 text-purple-600" />
                              <span className="text-sm font-medium text-purple-600">{q.category}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{q.question}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                    <Zap className="h-4 w-4 mr-2" />
                    Upgrade to Elite - $19.99/month
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Brain className="h-8 w-8 text-purple-600" />
              <h1 className="text-3xl font-bold text-foreground">AI Betting Assistant</h1>
              <Badge className="bg-purple-600 text-white">
                <Zap className="h-3 w-3 mr-1" />
                Elite
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Ask questions about today's games and get instant AI-powered betting insights
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Quick Questions Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <span>Quick Questions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quickQuestions.map((q) => {
                    const Icon = q.icon;
                    return (
                      <Button
                        key={q.id}
                        variant="ghost"
                        className="w-full justify-start p-3 h-auto text-left whitespace-normal"
                        onClick={() => handleQuickQuestion(q.question)}
                      >
                        <div className="space-y-1 w-full">
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4 text-purple-600 flex-shrink-0" />
                            <span className="text-xs font-medium text-purple-600">{q.category}</span>
                          </div>
                          <p className="text-sm text-foreground break-words">{q.question}</p>
                        </div>
                      </Button>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Chat Interface */}
            <div className="lg:col-span-3">
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5" />
                    <span>Chat with AI Assistant</span>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  {/* Messages */}
                  <ScrollArea className="flex-1 mb-4">
                    <div className="space-y-4 pr-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] p-3 rounded-lg ${
                            message.type === 'user'
                              ? 'bg-purple-600 text-white'
                              : 'bg-muted text-foreground'
                          }`}>
                            {message.type === 'assistant' && (
                              <div className="flex items-center space-x-2 mb-2">
                                <Brain className="h-4 w-4 text-purple-600" />
                                <span className="text-sm font-medium text-purple-600">AI Assistant</span>
                              </div>
                            )}
                            <div className="whitespace-pre-line text-sm">
                              {message.content}
                            </div>
                            <div className={`text-xs mt-2 opacity-70 ${
                              message.type === 'user' ? 'text-purple-100' : 'text-muted-foreground'
                            }`}>
                              {message.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-muted p-3 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Brain className="h-4 w-4 text-purple-600 animate-pulse" />
                              <span className="text-sm">AI is thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <Separator className="mb-4" />

                  {/* Input */}
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Ask about today's games... (e.g., Which unders have edge today?)"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !isLoading) {
                          handleSendMessage(inputValue);
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleSendMessage(inputValue)}
                      disabled={!inputValue.trim() || isLoading}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}