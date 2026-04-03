/**
 * OpenWeatherMap API Service - Weather Data for Game Locations
 * Provides weather conditions affecting game outcomes
 * API: https://api.openweathermap.org/data/2.5/
 * Cost: Free (1000 calls/day)
 * Rate Limit: 60 calls/minute
 */

const WEATHER_API_KEY = process.env.OPENWEATHERMAP_API_KEY || '';
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';
import { trackedFetch } from '../lib/api-tracker';

export interface GameWeatherData {
  gameId: string;
  location: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  visibility: number;
  windSpeed: number;
  windDirection: number;
  windGust?: number;
  precipitation: number;
  condition: string;
  description: string;
  cloudiness: number;
  uvIndex?: number;
  dewPoint: number;
  impact: {
    homeRunFactor: number; // -1 to +1 scale
    totalRunsImpact: 'favor_over' | 'favor_under' | 'neutral';
    battingConditions: 'excellent' | 'good' | 'fair' | 'poor';
    pitchingAdvantage: boolean;
    gameDelay: 'low' | 'medium' | 'high' | 'very_high';
  };
}

// MLB Stadium locations for weather data
const MLB_STADIUMS = {
  'ARI': { city: 'Phoenix', state: 'AZ', venue: 'Chase Field', lat: 33.4455, lon: -112.0667 },
  'ATL': { city: 'Atlanta', state: 'GA', venue: 'Truist Park', lat: 33.8900, lon: -84.4677 },
  'BAL': { city: 'Baltimore', state: 'MD', venue: 'Oriole Park', lat: 39.2838, lon: -76.6217 },
  'BOS': { city: 'Boston', state: 'MA', venue: 'Fenway Park', lat: 42.3467, lon: -71.0972 },
  'CHC': { city: 'Chicago', state: 'IL', venue: 'Wrigley Field', lat: 41.9484, lon: -87.6553 },
  'CHW': { city: 'Chicago', state: 'IL', venue: 'Guaranteed Rate Field', lat: 41.8299, lon: -87.6338 },
  'CIN': { city: 'Cincinnati', state: 'OH', venue: 'Great American Ballpark', lat: 39.0974, lon: -84.5066 },
  'CLE': { city: 'Cleveland', state: 'OH', venue: 'Progressive Field', lat: 41.4958, lon: -81.6852 },
  'COL': { city: 'Denver', state: 'CO', venue: 'Coors Field', lat: 39.7559, lon: -104.9942 },
  'DET': { city: 'Detroit', state: 'MI', venue: 'Comerica Park', lat: 42.3390, lon: -83.0485 },
  'HOU': { city: 'Houston', state: 'TX', venue: 'Minute Maid Park', lat: 29.7572, lon: -95.3552 },
  'KC': { city: 'Kansas City', state: 'MO', venue: 'Kauffman Stadium', lat: 39.0517, lon: -94.4803 },
  'LAA': { city: 'Anaheim', state: 'CA', venue: 'Angel Stadium', lat: 33.8003, lon: -117.8827 },
  'LAD': { city: 'Los Angeles', state: 'CA', venue: 'Dodger Stadium', lat: 34.0739, lon: -118.2400 },
  'MIA': { city: 'Miami', state: 'FL', venue: 'loanDepot Park', lat: 25.7781, lon: -80.2197 },
  'MIL': { city: 'Milwaukee', state: 'WI', venue: 'American Family Field', lat: 43.0280, lon: -87.9712 },
  'MIN': { city: 'Minneapolis', state: 'MN', venue: 'Target Field', lat: 44.9817, lon: -93.2776 },
  'NYM': { city: 'New York', state: 'NY', venue: 'Citi Field', lat: 40.7571, lon: -73.8458 },
  'NYY': { city: 'New York', state: 'NY', venue: 'Yankee Stadium', lat: 40.8296, lon: -73.9262 },
  'OAK': { city: 'Oakland', state: 'CA', venue: 'Oakland Coliseum', lat: 37.7516, lon: -122.2008 },
  'PHI': { city: 'Philadelphia', state: 'PA', venue: 'Citizens Bank Park', lat: 39.9061, lon: -75.1665 },
  'PIT': { city: 'Pittsburgh', state: 'PA', venue: 'PNC Park', lat: 40.4469, lon: -80.0058 },
  'SD': { city: 'San Diego', state: 'CA', venue: 'Petco Park', lat: 32.7073, lon: -117.1566 },
  'SEA': { city: 'Seattle', state: 'WA', venue: 'T-Mobile Park', lat: 47.5914, lon: -122.3325 },
  'SF': { city: 'San Francisco', state: 'CA', venue: 'Oracle Park', lat: 37.7786, lon: -122.3893 },
  'STL': { city: 'St. Louis', state: 'MO', venue: 'Busch Stadium', lat: 38.6226, lon: -90.1928 },
  'TB': { city: 'St. Petersburg', state: 'FL', venue: 'Tropicana Field', lat: 27.7682, lon: -82.6534 },
  'TEX': { city: 'Arlington', state: 'TX', venue: 'Globe Life Field', lat: 32.7470, lon: -97.0834 },
  'TOR': { city: 'Toronto', state: 'ON', venue: 'Rogers Centre', lat: 43.6414, lon: -79.3894 },
  'WSH': { city: 'Washington', state: 'DC', venue: 'Nationals Park', lat: 38.8730, lon: -77.0074 }
};

class WeatherAPIService {
  private apiKey = WEATHER_API_KEY;
  private baseUrl = WEATHER_API_BASE;
  private requestCount = 0;
  private lastRequestTime = 0;

  constructor() {
    if (!this.apiKey) {
      console.warn('OpenWeatherMap API key not found. Weather data will be unavailable.');
    }
  }

  private async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // Rate limit: max 1 request per second to be safe
    if (timeSinceLastRequest < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  private async makeRequest(endpoint: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('OpenWeatherMap API key not configured');
    }

    await this.rateLimit();
    
    try {
      const url = `${this.baseUrl}${endpoint}&appid=${this.apiKey}&units=imperial`;
      const response = await trackedFetch(url);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Weather API error for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get weather data for a specific game
   */
  async getGameWeather(gameId: string): Promise<GameWeatherData | null> {
    try {
      // Extract home team from gameId (2025-07-21_BAL @ CLE)
      const gameMatch = gameId.match(/(\w+)\s*@\s*(\w+)/);
      if (!gameMatch) {
        console.warn(`Could not parse gameId: ${gameId}`);
        return null;
      }

      const [, awayTeam, homeTeam] = gameMatch;
      const stadium = MLB_STADIUMS[homeTeam as keyof typeof MLB_STADIUMS];
      
      if (!stadium) {
        console.warn(`Stadium not found for team: ${homeTeam}`);
        return null;
      }

      // Get current weather data
      const weatherData = await this.makeRequest(
        `/weather?lat=${stadium.lat}&lon=${stadium.lon}`
      );

      // Get UV index from One Call API if available
      let uvIndex;
      try {
        const uvData = await this.makeRequest(
          `/onecall?lat=${stadium.lat}&lon=${stadium.lon}&exclude=minutely,hourly,daily,alerts`
        );
        uvIndex = uvData.current?.uvi;
      } catch (error) {
        // UV data not critical, continue without it
      }

      const weather = weatherData.main;
      const wind = weatherData.wind;
      const conditions = weatherData.weather[0];
      const precipitation = weatherData.rain?.['1h'] || weatherData.snow?.['1h'] || 0;

      // Calculate game impact
      const impact = this.calculateWeatherImpact({
        temperature: weather.temp,
        humidity: weather.humidity,
        windSpeed: wind.speed,
        windDirection: wind.deg,
        precipitation,
        condition: conditions.main
      });

      return {
        gameId,
        location: `${stadium.city}, ${stadium.state}`,
        temperature: Math.round(weather.temp),
        feelsLike: Math.round(weather.feels_like),
        humidity: weather.humidity,
        pressure: weather.pressure,
        visibility: weatherData.visibility / 1000, // Convert to km
        windSpeed: Math.round(wind.speed * 10) / 10,
        windDirection: wind.deg || 0,
        windGust: wind.gust ? Math.round(wind.gust * 10) / 10 : undefined,
        precipitation: Math.round(precipitation * 100) / 100,
        condition: conditions.main,
        description: conditions.description,
        cloudiness: weatherData.clouds.all,
        uvIndex,
        dewPoint: Math.round((weather.temp - ((100 - weather.humidity) / 5))),
        impact
      };

    } catch (error) {
      console.error('Error fetching game weather:', error);
      return null;
    }
  }

  /**
   * Calculate weather impact on game
   */
  private calculateWeatherImpact(weather: any) {
    let homeRunFactor = 0;
    let totalRunsImpact: 'favor_over' | 'favor_under' | 'neutral' = 'neutral';
    let battingConditions: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
    let pitchingAdvantage = false;
    let gameDelay: 'low' | 'medium' | 'high' | 'very_high' = 'low';

    // Wind impact
    if (weather.windSpeed > 15) {
      if (weather.windDirection >= 45 && weather.windDirection <= 225) {
        // Wind blowing out (helping home runs)
        homeRunFactor += 0.3;
        totalRunsImpact = 'favor_over';
      } else {
        // Wind blowing in (hurting home runs)
        homeRunFactor -= 0.3;
        totalRunsImpact = 'favor_under';
        pitchingAdvantage = true;
      }
    }

    // Temperature impact
    if (weather.temperature > 85) {
      homeRunFactor += 0.1; // Hot air = more carry
      battingConditions = 'excellent';
    } else if (weather.temperature < 50) {
      homeRunFactor -= 0.2; // Cold air = less carry
      battingConditions = 'fair';
      pitchingAdvantage = true;
    }

    // Humidity impact
    if (weather.humidity > 80) {
      homeRunFactor -= 0.1; // Heavy air
      battingConditions = battingConditions === 'excellent' ? 'good' : 'fair';
    } else if (weather.humidity < 30) {
      homeRunFactor += 0.1; // Dry air carries better
    }

    // Precipitation impact
    if (weather.precipitation > 0) {
      gameDelay = weather.precipitation > 5 ? 'very_high' : 
                  weather.precipitation > 2 ? 'high' : 'medium';
      battingConditions = 'poor';
      pitchingAdvantage = true;
      totalRunsImpact = 'favor_under';
    }

    // Weather condition impact
    if (weather.condition === 'Rain' || weather.condition === 'Thunderstorm') {
      gameDelay = 'very_high';
      battingConditions = 'poor';
    } else if (weather.condition === 'Snow') {
      gameDelay = 'very_high';
      battingConditions = 'poor';
      homeRunFactor -= 0.5;
    }

    // Adjust total runs impact based on combined factors
    if (totalRunsImpact === 'neutral') {
      if (homeRunFactor > 0.2) totalRunsImpact = 'favor_over';
      else if (homeRunFactor < -0.2) totalRunsImpact = 'favor_under';
    }

    return {
      homeRunFactor: Math.max(-1, Math.min(1, homeRunFactor)),
      totalRunsImpact,
      battingConditions,
      pitchingAdvantage,
      gameDelay
    };
  }

  /**
   * Get API usage statistics
   */
  getUsageStats() {
    return {
      name: 'OpenWeatherMap API',
      endpoint: this.baseUrl,
      requestCount: this.requestCount,
      lastRequest: new Date(this.lastRequestTime).toISOString(),
      status: (this.apiKey ? 'active' : 'inactive') as 'active' | 'inactive',
      cost: 'Free (1000 calls/day)',
      rateLimit: '60 calls/minute',
      features: ['Temperature', 'Wind Speed/Direction', 'Precipitation', 'Humidity', 'Game Impact Analysis'],
      note: this.apiKey ? 'Configured and ready with API key' : 'Requires OPENWEATHERMAP_API_KEY environment variable'
    };
  }
}

export const weatherAPI = new WeatherAPIService();