import { MusicNews } from '../types/spotify';

class NewsApiService {
  private apiKey = process.env.EXPO_PUBLIC_NEWS_API_KEY;
  private baseUrl = 'https://api.thenewsapi.com/v1/news/all';

  async getMusicNews(): Promise<MusicNews[]> {
    if (!this.apiKey) {
      console.warn('API key not found in environment variables');
      return this.getSampleNews();
    }

    try {
      const params = new URLSearchParams({
        api_token: this.apiKey,
        categories: 'entertainment,music',
        language: 'en',
        search: 'music OR spotify OR artist OR album OR concert',
        limit: '10',
        published_after: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 7 days
      });

      const response = await fetch(`${this.baseUrl}?${params}`);

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 402) {
          console.warn('News API subscription required. Using sample news instead.');
          return this.getSampleNews();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data?.data?.length) {
        console.warn('No news articles found. Using sample news instead.');
        return this.getSampleNews();
      }

      return data.data.map((article: any, index: number) => ({
        id: article.uuid || `news-${index}`,
        title: article.title,
        description: article.description || article.snippet || '',
        url: article.url,
        imageUrl: article.image_url || 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg',
        publishedAt: article.published_at,
        source: article.source,
      }));
    } catch (error) {
      console.warn('Failed to fetch music news, using sample news instead:', error);
      return this.getSampleNews();
    }
  }


  private getSampleNews(): MusicNews[] {
    return [
      {
        id: 'news-1',
        title: 'Streaming Revolution: How AI is Changing Music Discovery',
        description: 'Artificial intelligence algorithms are transforming how we discover new music, with personalized recommendations becoming more sophisticated than ever.',
        url: '#',
        imageUrl: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg',
        publishedAt: new Date().toISOString(),
        source: 'Music Tech Daily',
      },
      {
        id: 'news-2',
        title: 'Independent Artists Surge on Streaming Platforms',
        description: 'Independent musicians are finding unprecedented success on streaming platforms, with new tools making music distribution more accessible.',
        url: '#',
        imageUrl: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg',
        publishedAt: new Date(Date.now() - 86400000).toISOString(),
        source: 'Indie Music Weekly',
      },
      {
        id: 'news-3',
        title: 'The Future of Live Music: Virtual Concerts Gain Momentum',
        description: 'Virtual reality concerts are becoming mainstream, offering immersive experiences that bridge the gap between digital and live music.',
        url: '#',
        imageUrl: 'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg',
        publishedAt: new Date(Date.now() - 172800000).toISOString(),
        source: 'Future Music',
      },
    ];
  }
}

export const newsApi = new NewsApiService();