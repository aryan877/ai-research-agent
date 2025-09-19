import axios from 'axios';
import { NewsAPIResponse, Article, HackerNewsSearchResponse, WikipediaSearchResponse, WikipediaSummaryResponse } from '../types';

export class NewsService {
  private static readonly NEWS_API_URL = 'https://newsapi.org/v2/everything';
  private static readonly HACKER_NEWS_SEARCH_URL = 'https://hn.algolia.com/api/v1/search';
  private static readonly WIKIPEDIA_SEARCH_URL = 'https://en.wikipedia.org/w/rest.php/v1/search/page';
  private static readonly WIKIPEDIA_SUMMARY_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary';

  static async fetchArticles(topic: string): Promise<Article[]> {
    const sources = [
      { name: 'NewsAPI', fetch: () => this.fetchFromNewsAPI(topic) },
      { name: 'HackerNews', fetch: () => this.fetchFromHackerNews(topic) },
      { name: 'Wikipedia', fetch: () => this.fetchFromWikipedia(topic) }
    ];

    const errors: string[] = [];

    for (const source of sources) {
      try {
        console.log(`Attempting to fetch from ${source.name}...`);
        const articles = await source.fetch();
        if (articles.length > 0) {
          console.log(`Successfully fetched ${articles.length} articles from ${source.name}`);
          return articles;
        }
      } catch (error) {
        const errorMessage = `${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`Error fetching from ${source.name}:`, error);
        errors.push(errorMessage);
        continue;
      }
    }

    throw new Error(`All data sources failed: ${errors.join('; ')}`);
  }

  private static async fetchFromNewsAPI(topic: string): Promise<Article[]> {
    if (!process.env.NEWS_API_KEY) {
      throw new Error('NewsAPI key not configured');
    }

    const response = await axios.get<NewsAPIResponse>(this.NEWS_API_URL, {
      params: {
        q: topic,
        sortBy: 'relevancy',
        pageSize: 20,
        apiKey: process.env.NEWS_API_KEY,
      },
    });

    if (!response.data.articles || response.data.articles.length === 0) {
      throw new Error('No articles found from NewsAPI');
    }

    return response.data.articles
      .filter(article => article.title && article.url)
      .slice(0, 5)
      .map(article => ({
        title: article.title,
        summary: article.description || article.content?.substring(0, 200) + '...' || 'No summary available',
        url: article.url,
        source: article.source.name,
      }));
  }

  private static async fetchFromHackerNews(topic: string): Promise<Article[]> {
    const searchResponse = await axios.get<HackerNewsSearchResponse>(
      `${this.HACKER_NEWS_SEARCH_URL}?query=${encodeURIComponent(topic)}&tags=story&hitsPerPage=10`
    );

    if (!searchResponse.data.hits || searchResponse.data.hits.length === 0) {
      throw new Error('No articles found from Hacker News');
    }

    return searchResponse.data.hits
      .filter(hit => hit.title && hit.title.trim().length > 0)
      .slice(0, 5)
      .map(hit => {
        const textPreview = hit.story_text ? `${hit.story_text.substring(0, 200)}...` : 'Discussion on Hacker News';

        return {
          title: hit.title,
          summary: textPreview,
          url: hit.url || `https://news.ycombinator.com/item?id=${hit.story_id}`,
          source: 'Hacker News',
        };
      });
  }

  private static async fetchFromWikipedia(topic: string): Promise<Article[]> {
    // First, search for pages related to the topic
    const searchResponse = await axios.get<WikipediaSearchResponse>(
      `${this.WIKIPEDIA_SEARCH_URL}?q=${encodeURIComponent(topic)}&limit=5`
    );

    if (!searchResponse.data.pages || searchResponse.data.pages.length === 0) {
      throw new Error('No articles found from Wikipedia');
    }

    // Get detailed information for each page
    const articles: Article[] = [];
    for (const page of searchResponse.data.pages.slice(0, 5)) {
      try {
        const pageResponse = await axios.get<WikipediaSummaryResponse>(
          `${this.WIKIPEDIA_SUMMARY_URL}/${encodeURIComponent(page.title)}`
        );

        if (pageResponse.data && pageResponse.data.extract) {
          articles.push({
            title: pageResponse.data.title,
            summary: pageResponse.data.extract.substring(0, 300) + '...',
            url: pageResponse.data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
            source: 'Wikipedia',
          });
        }
      } catch (pageError) {
        console.error(`Error fetching Wikipedia page ${page.title}:`, pageError);
        continue;
      }
    }

    if (articles.length === 0) {
      throw new Error('No valid articles extracted from Wikipedia');
    }

    return articles;
  }

}
