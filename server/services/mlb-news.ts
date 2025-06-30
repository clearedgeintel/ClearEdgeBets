export interface MLBNewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  author?: string;
  imageUrl?: string;
  category?: string;
  source?: string;
}

export async function fetchMLBNews(): Promise<MLBNewsArticle[]> {
  try {
    const response = await fetch('https://major-league-baseball-mlb.p.rapidapi.com/news', {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
        'X-RapidAPI-Host': 'major-league-baseball-mlb.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      console.error(`MLB News API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    console.log('MLB News API response:', data);

    // Transform the API response to our format
    // Note: Actual structure depends on the API response format
    if (Array.isArray(data)) {
      return data.slice(0, 10).map((article: any, index: number) => ({
        id: article.id || `news-${index}`,
        title: article.title || article.headline || 'MLB News',
        summary: article.summary || article.description || article.excerpt || '',
        url: article.url || article.link || '#',
        publishedAt: article.publishedAt || article.published_at || article.date || new Date().toISOString(),
        author: article.author || article.byline,
        imageUrl: article.imageUrl || article.image || article.thumbnail,
        category: article.category || 'MLB',
        source: article.source || 'MLB News'
      }));
    }

    // If data has a different structure, adapt accordingly
    if (data.articles) {
      return data.articles.slice(0, 10).map((article: any, index: number) => ({
        id: article.id || `news-${index}`,
        title: article.title || article.headline || 'MLB News',
        summary: article.summary || article.description || article.excerpt || '',
        url: article.url || article.link || '#',
        publishedAt: article.publishedAt || article.published_at || article.date || new Date().toISOString(),
        author: article.author || article.byline,
        imageUrl: article.imageUrl || article.image || article.thumbnail,
        category: article.category || 'MLB',
        source: article.source || 'MLB News'
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching MLB news:', error);
    return [];
  }
}

// Generate mock news for development/fallback
export function generateMockMLBNews(): MLBNewsArticle[] {
  return [
    {
      id: 'news-1',
      title: 'World Series Race Heats Up as Playoffs Approach',
      summary: 'With just weeks left in the regular season, several teams are making their final push for playoff positioning.',
      url: '#',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      author: 'MLB News',
      category: 'Playoffs',
      source: 'MLB.com'
    },
    {
      id: 'news-2',
      title: 'Trade Deadline Acquisitions Making Impact',
      summary: 'Several key deadline acquisitions are proving their worth as teams gear up for the postseason.',
      url: '#',
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      author: 'Baseball Insider',
      category: 'Trades',
      source: 'ESPN'
    },
    {
      id: 'news-3',
      title: 'Rookie of the Year Race Intensifies',
      summary: 'Young stars across both leagues are making compelling cases for Rookie of the Year honors.',
      url: '#',
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      author: 'Sports Analytics',
      category: 'Awards',
      source: 'The Athletic'
    },
    {
      id: 'news-4',
      title: 'Injury Updates Affect Playoff Picture',
      summary: 'Key player injuries are reshaping the playoff landscape as teams adjust their strategies.',
      url: '#',
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
      author: 'MLB Insider',
      category: 'Injuries',
      source: 'MLB Network'
    },
    {
      id: 'news-5',
      title: 'Historic Records Within Reach',
      summary: 'Several players are approaching significant career milestones in the final weeks of the season.',
      url: '#',
      publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      author: 'Baseball History',
      category: 'Records',
      source: 'Baseball Reference'
    }
  ];
}