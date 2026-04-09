import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Cloud, CloudRain, Sun, Thermometer, Wind, Droplets, X } from "lucide-react";
import { format } from "date-fns";

interface MapPin {
  gameID: string;
  away: string;
  home: string;
  gameTime: string;
  lat: number;
  lon: number;
  city: string;
  venue: string;
  weather: {
    temperature: number;
    condition: string;
    windSpeed: number;
    windDirection: number;
    humidity: number;
    precipitation: number;
    totalRunsImpact: 'favor_over' | 'favor_under' | 'neutral';
    gameDelay: string;
  } | null;
}

function teamLogo(code: string) {
  const c = code.toUpperCase() === 'WAS' ? 'wsh' : code.toLowerCase();
  return `https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/${c}.png`;
}

// Convert lat/lon to SVG x/y on a simplified USA projection
// US bounds roughly: lat 24-50, lon -125 to -66
function geoToSvg(lat: number, lon: number): { x: number; y: number } {
  const x = ((lon + 125) / (125 - 66)) * 900 + 50;
  const y = ((50 - lat) / (50 - 24)) * 500 + 30;
  return { x, y };
}

function weatherColor(temp: number | undefined): string {
  if (!temp) return '#3f3f46';
  if (temp >= 85) return '#ef4444';  // hot red
  if (temp >= 75) return '#f59e0b';  // warm amber
  if (temp >= 60) return '#22c55e';  // nice green
  if (temp >= 45) return '#3b82f6';  // cool blue
  return '#8b5cf6';                   // cold purple
}

function conditionIcon(condition: string | undefined) {
  if (!condition) return <Cloud className="h-3 w-3" />;
  const c = condition.toLowerCase();
  if (c.includes('rain') || c.includes('drizzle')) return <CloudRain className="h-3 w-3 text-blue-400" />;
  if (c.includes('clear') || c.includes('sun')) return <Sun className="h-3 w-3 text-amber-400" />;
  return <Cloud className="h-3 w-3 text-zinc-400" />;
}

export default function WeatherSummary() {
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);

  const { data: pins = [], isLoading } = useQuery<MapPin[]>({
    queryKey: ['/api/weather/map'],
    queryFn: () => fetch('/api/weather/map').then(r => r.json()),
    refetchInterval: 300000,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">MLB Weather Map</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {format(new Date(), 'EEEE, MMMM do')} · {pins.length} games · Click a pin for details
        </p>
      </div>

      {/* Temperature legend */}
      <div className="flex items-center justify-center gap-4 mb-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>&lt;45°</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>45-59°</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>60-74°</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>75-84°</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>85°+</span>
      </div>

      {/* Map container */}
      <div className="relative">
        <Card className="border-border/30 overflow-hidden bg-zinc-950">
          <CardContent className="p-0">
            <svg viewBox="0 0 1000 560" className="w-full h-auto">
              {/* Background gradient */}
              <defs>
                <radialGradient id="mapBg" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor="#18181b" />
                  <stop offset="100%" stopColor="#09090b" />
                </radialGradient>
                {/* Glow filter for pins */}
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <rect width="1000" height="560" fill="url(#mapBg)" />

              {/* Simplified USA outline — continental US */}
              <path
                d="M120,180 L130,160 L160,140 L200,120 L230,100 L260,80 L300,70 L350,60 L400,55 L450,50 L500,55 L540,60 L580,55 L620,50 L660,55 L700,60 L740,70 L780,90 L800,110 L810,130 L820,150 L830,170 L825,200 L815,220 L800,250 L790,270 L780,290 L760,310 L740,330 L720,350 L700,360 L680,370 L650,380 L620,390 L580,400 L540,410 L500,420 L460,425 L420,430 L380,435 L340,430 L300,420 L260,410 L220,400 L180,390 L150,380 L130,360 L120,340 L110,310 L100,280 L95,250 L100,220 L110,200 Z"
                fill="none"
                stroke="#27272a"
                strokeWidth="1.5"
                opacity="0.6"
              />

              {/* State-ish grid lines for reference */}
              {[100, 200, 300, 400, 500].map(y => (
                <line key={`h${y}`} x1="50" y1={y} x2="950" y2={y} stroke="#1a1a1f" strokeWidth="0.5" />
              ))}
              {[200, 400, 600, 800].map(x => (
                <line key={`v${x}`} x1={x} y1="30" x2={x} y2="530" stroke="#1a1a1f" strokeWidth="0.5" />
              ))}

              {/* Weather pins */}
              {pins.map((pin) => {
                const { x, y } = geoToSvg(pin.lat, pin.lon);
                const color = weatherColor(pin.weather?.temperature);
                const isSelected = selectedPin?.gameID === pin.gameID;
                const hasRain = pin.weather?.condition?.toLowerCase().includes('rain');

                return (
                  <g
                    key={pin.gameID}
                    onClick={() => setSelectedPin(isSelected ? null : pin)}
                    className="cursor-pointer"
                  >
                    {/* Glow ring */}
                    <circle cx={x} cy={y} r={isSelected ? 18 : 12} fill={color} opacity={0.15} filter="url(#glow)" />
                    {/* Pin circle */}
                    <circle
                      cx={x} cy={y}
                      r={isSelected ? 10 : 7}
                      fill={color}
                      stroke={isSelected ? '#fafafa' : '#27272a'}
                      strokeWidth={isSelected ? 2 : 1}
                      opacity={0.9}
                    />
                    {/* Rain indicator */}
                    {hasRain && <circle cx={x + 6} cy={y - 6} r={3} fill="#3b82f6" stroke="#09090b" strokeWidth={1} />}
                    {/* Temperature label */}
                    <text x={x} y={y + 20} textAnchor="middle" fill="#a1a1aa" fontSize="9" fontFamily="Inter, sans-serif">
                      {pin.weather ? `${Math.round(pin.weather.temperature)}°` : ''}
                    </text>
                    {/* Team codes */}
                    <text x={x} y={y - 14} textAnchor="middle" fill="#d4d4d8" fontSize="8" fontWeight="600" fontFamily="Inter, sans-serif">
                      {pin.away}@{pin.home}
                    </text>
                  </g>
                );
              })}

              {/* Loading text */}
              {isLoading && (
                <text x="500" y="280" textAnchor="middle" fill="#71717a" fontSize="14">Loading weather data...</text>
              )}
              {!isLoading && pins.length === 0 && (
                <text x="500" y="280" textAnchor="middle" fill="#71717a" fontSize="14">No games scheduled today</text>
              )}
            </svg>
          </CardContent>
        </Card>

        {/* Selected game detail popup */}
        {selectedPin && (
          <div className="absolute top-4 right-4 w-72 z-10 animate-fade-in-up">
            <Card className="border-border/50 bg-card/95 backdrop-blur-md shadow-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <img src={teamLogo(selectedPin.away)} alt="" className="h-6 w-6" />
                    <span className="text-sm font-bold text-foreground">{selectedPin.away} @ {selectedPin.home}</span>
                    <img src={teamLogo(selectedPin.home)} alt="" className="h-6 w-6" />
                  </div>
                  <button onClick={() => setSelectedPin(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-xs text-muted-foreground mb-3">
                  {selectedPin.venue} · {selectedPin.city} · {selectedPin.gameTime}
                </div>

                {selectedPin.weather ? (
                  <div className="space-y-3">
                    {/* Big temp */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-3xl font-bold tabular-nums" style={{ color: weatherColor(selectedPin.weather.temperature) }}>
                          {Math.round(selectedPin.weather.temperature)}°F
                        </div>
                        {conditionIcon(selectedPin.weather.condition)}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-foreground capitalize">{selectedPin.weather.condition}</div>
                        {selectedPin.weather.totalRunsImpact !== 'neutral' && (
                          <Badge className={`text-[9px] mt-1 border ${selectedPin.weather.totalRunsImpact === 'favor_over' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/15 text-blue-400 border-blue-500/20'}`}>
                            Favors {selectedPin.weather.totalRunsImpact === 'favor_over' ? 'Over' : 'Under'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-zinc-900/50 rounded">
                        <Wind className="h-3 w-3 mx-auto text-blue-400 mb-1" />
                        <div className="text-xs font-medium tabular-nums">{Math.round(selectedPin.weather.windSpeed)} mph</div>
                        <div className="text-[9px] text-muted-foreground">Wind</div>
                      </div>
                      <div className="p-2 bg-zinc-900/50 rounded">
                        <Droplets className="h-3 w-3 mx-auto text-cyan-400 mb-1" />
                        <div className="text-xs font-medium tabular-nums">{selectedPin.weather.humidity}%</div>
                        <div className="text-[9px] text-muted-foreground">Humidity</div>
                      </div>
                      <div className="p-2 bg-zinc-900/50 rounded">
                        <CloudRain className="h-3 w-3 mx-auto text-blue-400 mb-1" />
                        <div className="text-xs font-medium tabular-nums">{selectedPin.weather.precipitation.toFixed(1)}"</div>
                        <div className="text-[9px] text-muted-foreground">Precip</div>
                      </div>
                    </div>

                    {/* Delay risk */}
                    {(selectedPin.weather.gameDelay === 'high' || selectedPin.weather.gameDelay === 'very_high') && (
                      <Badge className="w-full justify-center bg-red-500/15 text-red-400 border border-red-500/20 text-xs">
                        ⚠️ Rain Delay Risk
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-muted-foreground">
                    Weather data unavailable
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Game list below map */}
      {pins.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-4">
          {pins.map(pin => (
            <button
              key={pin.gameID}
              onClick={() => setSelectedPin(selectedPin?.gameID === pin.gameID ? null : pin)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                selectedPin?.gameID === pin.gameID
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-border/30 bg-card hover:border-zinc-600'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <img src={teamLogo(pin.away)} alt="" className="h-4 w-4" />
                <span className="text-[10px] text-muted-foreground">@</span>
                <img src={teamLogo(pin.home)} alt="" className="h-4 w-4" />
                <span className="text-[10px] text-muted-foreground ml-auto">{pin.gameTime}</span>
              </div>
              {pin.weather && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="tabular-nums font-medium" style={{ color: weatherColor(pin.weather.temperature) }}>
                    {Math.round(pin.weather.temperature)}°F
                  </span>
                  <span className="text-muted-foreground capitalize">{pin.weather.condition}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
