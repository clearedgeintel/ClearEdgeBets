import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  CloudDrizzle,
  Wind,
  Eye,
  Thermometer,
  Droplets,
  Activity
} from "lucide-react";
import { format } from "date-fns";

interface WeatherData {
  city: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  visibility: number;
  pressure: number;
  feelsLike: number;
  gameImpact: 'favorable' | 'neutral' | 'challenging';
  impact: string;
}

interface GameWeatherInfo {
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  venue: string;
  gameTime: string;
  weather: WeatherData;
}

// Baseball-themed weather icons
const getBaseballWeatherIcon = (condition: string, size: number = 48) => {
  const iconProps = { size, className: "text-blue-500" };
  
  switch (condition.toLowerCase()) {
    case 'clear':
    case 'sunny':
      return <Sun {...iconProps} className="text-yellow-500" />;
    case 'partly cloudy':
    case 'cloudy':
      return <Cloud {...iconProps} className="text-gray-500" />;
    case 'rain':
    case 'light rain':
      return <CloudRain {...iconProps} className="text-blue-600" />;
    case 'drizzle':
      return <CloudDrizzle {...iconProps} className="text-blue-400" />;
    case 'snow':
      return <CloudSnow {...iconProps} className="text-gray-200" />;
    default:
      return <Cloud {...iconProps} className="text-gray-500" />;
  }
};

// Fun baseball weather descriptions
const getBaseballWeatherDescription = (weather: WeatherData) => {
  const temp = weather.temperature;
  const condition = weather.condition.toLowerCase();
  
  if (condition.includes('rain')) {
    return "⚾ Rain delay possible - keep those gloves dry!";
  } else if (condition.includes('snow')) {
    return "❄️ Snow game special - think frozen ropes and cold bats!";
  } else if (temp > 85) {
    return "🔥 Hot weather baseball - hydrate those players!";
  } else if (temp < 50) {
    return "🧊 Chilly conditions - pitchers might have extra grip!";
  } else if (weather.windSpeed > 15) {
    return "💨 Windy conditions - fly balls could get interesting!";
  } else {
    return "⚾ Perfect baseball weather - play ball!";
  }
};

// Impact color coding
const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'favorable':
      return 'bg-green-100 text-green-800';
    case 'challenging':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

export default function WeatherSummary() {
  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ['/api/games'],
  });

  const { data: weatherSummary, isLoading: weatherLoading } = useQuery({
    queryKey: ['/api/weather/summary'],
    enabled: !!games,
  });

  if (gamesLoading || weatherLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const todaysGames = Array.isArray(games) ? games.slice(0, 8) : []; // Show first 8 games

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-3">
          <Activity className="text-blue-500" size={40} />
          MLB Weather Central
          <Activity className="text-blue-500" size={40} />
        </h1>
        <p className="text-muted-foreground text-lg">
          Today's Game Conditions • {format(new Date(), 'EEEE, MMMM do, yyyy')}
        </p>
      </div>

      {/* Weather Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center mb-2">
              <Thermometer className="text-red-500" size={24} />
            </div>
            <div className="text-2xl font-bold">73°F</div>
            <p className="text-sm text-muted-foreground">Avg Temperature</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center mb-2">
              <Wind className="text-blue-500" size={24} />
            </div>
            <div className="text-2xl font-bold">8 mph</div>
            <p className="text-sm text-muted-foreground">Avg Wind Speed</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center mb-2">
              <Droplets className="text-cyan-500" size={24} />
            </div>
            <div className="text-2xl font-bold">45%</div>
            <p className="text-sm text-muted-foreground">Avg Humidity</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center mb-2">
              <Sun className="text-yellow-500" size={24} />
            </div>
            <div className="text-2xl font-bold">12</div>
            <p className="text-sm text-muted-foreground">Clear Skies</p>
          </CardContent>
        </Card>
      </div>

      {/* Weather Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {todaysGames.map((game: any, index: number) => {
          // Mock weather data for each game location (in production, would fetch real data)
          const mockWeather: WeatherData = {
            city: game.venue.split(' ')[0] || 'Stadium',
            temperature: 68 + Math.floor(Math.random() * 25), // 68-93°F
            condition: ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
            humidity: 40 + Math.floor(Math.random() * 40), // 40-80%
            windSpeed: 3 + Math.floor(Math.random() * 15), // 3-18 mph
            windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
            visibility: 8 + Math.floor(Math.random() * 5), // 8-12 miles
            pressure: 29.8 + (Math.random() * 0.6), // 29.8-30.4 inHg
            feelsLike: 70 + Math.floor(Math.random() * 20), // Feels like temp
            gameImpact: Math.random() > 0.7 ? 'challenging' : Math.random() > 0.3 ? 'neutral' : 'favorable',
            impact: 'Perfect conditions for baseball'
          };

          return (
            <Card key={game.gameId} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getBaseballWeatherIcon(mockWeather.condition, 32)}
                    <div>
                      <div className="text-lg font-bold">
                        {game.awayTeamCode} @ {game.homeTeamCode}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {game.venue} • {game.gameTime}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">
                      {mockWeather.temperature}°F
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={getImpactColor(mockWeather.gameImpact)}
                    >
                      {mockWeather.gameImpact}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-6">
                {/* Fun Baseball Description */}
                <div className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-3 mb-4">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    {getBaseballWeatherDescription(mockWeather)}
                  </p>
                </div>

                {/* Weather Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Eye className="text-gray-500" size={16} />
                    <span className="text-muted-foreground">Visibility:</span>
                    <span className="font-medium">{mockWeather.visibility} mi</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Wind className="text-blue-500" size={16} />
                    <span className="text-muted-foreground">Wind:</span>
                    <span className="font-medium">
                      {mockWeather.windSpeed} mph {mockWeather.windDirection}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Droplets className="text-cyan-500" size={16} />
                    <span className="text-muted-foreground">Humidity:</span>
                    <span className="font-medium">{mockWeather.humidity}%</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Thermometer className="text-red-500" size={16} />
                    <span className="text-muted-foreground">Feels Like:</span>
                    <span className="font-medium">{mockWeather.feelsLike}°F</span>
                  </div>
                </div>

                {/* Pitcher Weather Impact */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      🥎 Pitching: {mockWeather.condition} conditions
                    </span>
                    <span className="text-muted-foreground">
                      ⚾ Hitting: {mockWeather.windSpeed > 10 ? 'Windy' : 'Calm'} air
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Weather Legend */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <Activity className="text-blue-500" size={20} />
            Weather Impact Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center space-y-2">
              <Badge className="bg-green-100 text-green-800 w-full">Favorable</Badge>
              <p className="text-muted-foreground">
                Perfect conditions for batting and fielding
              </p>
            </div>
            <div className="text-center space-y-2">
              <Badge className="bg-blue-100 text-blue-800 w-full">Neutral</Badge>
              <p className="text-muted-foreground">
                Standard playing conditions expected
              </p>
            </div>
            <div className="text-center space-y-2">
              <Badge className="bg-red-100 text-red-800 w-full">Challenging</Badge>
              <p className="text-muted-foreground">
                Wind, rain, or temperature may affect play
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}