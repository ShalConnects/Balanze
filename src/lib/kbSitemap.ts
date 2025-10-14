// src/lib/kbSitemap.ts
import { MOCK_ARTICLES } from '../pages/KBArticlePage';

export interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

/**
 * Generate sitemap entries for all KB articles
 */
export function generateKBSitemapEntries(): SitemapEntry[] {
  const baseUrl = window.location.origin;
  const entries: SitemapEntry[] = [];
  
  // Add main help center page
  entries.push({
    url: `${baseUrl}/help`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.9
  });
  
  // Add all KB articles
  Object.values(MOCK_ARTICLES).forEach(article => {
    entries.push({
      url: `${baseUrl}/kb/${article.slug}`,
      lastmod: article.lastUpdated,
      changefreq: 'monthly',
      priority: 0.8
    });
  });
  
  return entries;
}

/**
 * Generate XML sitemap for KB articles
 */
export function generateKBSitemapXML(): string {
  const entries = generateKBSitemapEntries();
  const baseUrl = window.location.origin;
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  entries.forEach(entry => {
    xml += '  <url>\n';
    xml += `    <loc>${entry.url}</loc>\n`;
    xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
    xml += `    <priority>${entry.priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  return xml;
}

/**
 * Generate robots.txt content for KB articles
 */
export function generateKBRobotsTxt(): string {
  const baseUrl = window.location.origin;
  
  let robots = `User-agent: *\n`;
  robots += `Allow: /help\n`;
  robots += `Allow: /kb/\n`;
  robots += `Disallow: /admin\n`;
  robots += `Disallow: /settings\n`;
  robots += `Disallow: /dashboard\n`;
  robots += `\n`;
  robots += `Sitemap: ${baseUrl}/sitemap-kb.xml\n`;
  
  return robots;
}

/**
 * Get all KB article slugs for internal linking
 */
export function getAllKBArticleSlugs(): string[] {
  return Object.keys(MOCK_ARTICLES);
}

/**
 * Get related articles based on category and tags
 */
export function getRelatedArticles(currentSlug: string, limit: number = 3): string[] {
  const currentArticle = MOCK_ARTICLES[currentSlug];
  if (!currentArticle) return [];
  
  const related: string[] = [];
  
  // Find articles in the same category
  Object.entries(MOCK_ARTICLES).forEach(([slug, article]) => {
    if (slug !== currentSlug && article.category === currentArticle.category) {
      related.push(slug);
    }
  });
  
  // Find articles with similar tags
  if (related.length < limit) {
    Object.entries(MOCK_ARTICLES).forEach(([slug, article]) => {
      if (slug !== currentSlug && !related.includes(slug)) {
        const commonTags = article.tags.filter(tag => 
          currentArticle.tags.includes(tag)
        );
        if (commonTags.length > 0) {
          related.push(slug);
        }
      }
    });
  }
  
  return related.slice(0, limit);
}

/**
 * Generate internal linking suggestions for SEO
 */
export function generateInternalLinkingSuggestions(articleSlug: string): {
  relatedArticles: string[];
  categoryArticles: string[];
  popularArticles: string[];
} {
  const currentArticle = MOCK_ARTICLES[articleSlug];
  if (!currentArticle) {
    return {
      relatedArticles: [],
      categoryArticles: [],
      popularArticles: []
    };
  }
  
  const categoryArticles = Object.keys(MOCK_ARTICLES).filter(slug => 
    slug !== articleSlug && MOCK_ARTICLES[slug].category === currentArticle.category
  );
  
  const relatedArticles = getRelatedArticles(articleSlug, 3);
  
  // Popular articles (first 3 from MOCK_ARTICLES)
  const popularArticles = Object.keys(MOCK_ARTICLES).slice(0, 3).filter(slug => 
    slug !== articleSlug
  );
  
  return {
    relatedArticles,
    categoryArticles,
    popularArticles
  };
}

