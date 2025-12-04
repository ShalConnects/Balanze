// XML Sitemap Generator for SEO
// Automatically generates XML sitemaps for search engines

export interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export interface SitemapConfig {
  baseUrl: string;
  defaultPriority: number;
  defaultChangeFreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

// Default configuration
const DEFAULT_CONFIG: SitemapConfig = {
  baseUrl: 'https://balanze.com',
  defaultPriority: 0.5,
  defaultChangeFreq: 'weekly'
};

// Generate XML sitemap for help center articles
export function generateHelpCenterSitemap(
  articles: Array<{
    slug: string;
    lastUpdated: string;
    category: string;
    priority?: number;
    changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  }>,
  config: Partial<SitemapConfig> = {}
): string {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const urls: SitemapUrl[] = [
    // Main help center page
    {
      loc: `${finalConfig.baseUrl}/help-center`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily',
      priority: 1.0
    },
    // Topic cluster hub
    {
      loc: `${finalConfig.baseUrl}/help-center/topics`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 0.8
    },
    // Individual articles
    ...articles.map(article => ({
      loc: `${finalConfig.baseUrl}/help-center/${article.slug}`,
      lastmod: article.lastUpdated,
      changefreq: article.changefreq || getChangeFreqByCategory(article.category),
      priority: article.priority || getPriorityByCategory(article.category)
    }))
  ];

  return generateXMLSitemap(urls);
}

// Generate XML sitemap for main website pages
export function generateMainSiteSitemap(
  pages: Array<{
    path: string;
    lastmod: string;
    priority?: number;
    changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  }>,
  config: Partial<SitemapConfig> = {}
): string {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const urls: SitemapUrl[] = [
    // Homepage
    {
      loc: finalConfig.baseUrl,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily',
      priority: 1.0
    },
    // Other main pages
    ...pages.map(page => ({
      loc: `${finalConfig.baseUrl}${page.path}`,
      lastmod: page.lastmod,
      changefreq: page.changefreq || 'weekly',
      priority: page.priority || 0.5
    }))
  ];

  return generateXMLSitemap(urls);
}

// Generate complete XML sitemap
export function generateCompleteSitemap(
  helpCenterArticles: Array<{
    slug: string;
    lastUpdated: string;
    category: string;
    priority?: number;
    changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  }>,
  mainPages: Array<{
    path: string;
    lastmod: string;
    priority?: number;
    changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  }>,
  config: Partial<SitemapConfig> = {}
): string {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const urls: SitemapUrl[] = [
    // Homepage
    {
      loc: finalConfig.baseUrl,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily',
      priority: 1.0
    },
    // Help center main page
    {
      loc: `${finalConfig.baseUrl}/help-center`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily',
      priority: 0.9
    },
    // Topic cluster hub
    {
      loc: `${finalConfig.baseUrl}/help-center/topics`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 0.8
    },
    // Main website pages
    ...mainPages.map(page => ({
      loc: `${finalConfig.baseUrl}${page.path}`,
      lastmod: page.lastmod,
      changefreq: page.changefreq || 'weekly',
      priority: page.priority || 0.7
    })),
    // Help center articles
    ...helpCenterArticles.map(article => ({
      loc: `${finalConfig.baseUrl}/help-center/${article.slug}`,
      lastmod: article.lastUpdated,
      changefreq: article.changefreq || getChangeFreqByCategory(article.category),
      priority: article.priority || getPriorityByCategory(article.category)
    }))
  ];

  return generateXMLSitemap(urls);
}

// Generate XML sitemap from URL array
function generateXMLSitemap(urls: SitemapUrl[]): string {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const urlsetClose = '</urlset>';
  
  const urlEntries = urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('');
  
  return `${xmlHeader}${urlsetOpen}${urlEntries}
${urlsetClose}`;
}

// Get change frequency based on article category
function getChangeFreqByCategory(category: string): 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' {
  const categoryFreqMap: Record<string, 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'> = {
    'Getting Started': 'monthly',
    'Accounts': 'monthly',
    'Transactions': 'weekly',
    'Analytics': 'weekly',
    'Premium Features': 'monthly',
    'Financial Planning': 'monthly',
    'Data Management': 'monthly',
    'Mobile': 'monthly',
    'Support': 'monthly'
  };
  
  return categoryFreqMap[category] || 'monthly';
}

// Get priority based on article category
function getPriorityByCategory(category: string): number {
  const categoryPriorityMap: Record<string, number> = {
    'Getting Started': 0.9,
    'Accounts': 0.8,
    'Transactions': 0.8,
    'Analytics': 0.7,
    'Premium Features': 0.6,
    'Financial Planning': 0.7,
    'Data Management': 0.6,
    'Mobile': 0.6,
    'Support': 0.5
  };
  
  return categoryPriorityMap[category] || 0.5;
}

// Generate robots.txt content
export function generateRobotsTxt(
  baseUrl: string,
  sitemapUrl: string = '/sitemap.xml',
  additionalRules: string[] = []
): string {
  const robotsContent = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}${sitemapUrl}

# Help Center
Allow: /help-center/
Allow: /help-center/topics
Allow: /help-center/*

# Block admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /_internal/

${additionalRules.join('\n')}`;

  return robotsContent;
}

// Generate sitemap index for multiple sitemaps
export function generateSitemapIndex(
  sitemaps: Array<{
    loc: string;
    lastmod: string;
  }>,
  baseUrl: string
): string {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  const sitemapindexOpen = '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const sitemapindexClose = '</sitemapindex>';
  
  const sitemapEntries = sitemaps.map(sitemap => `
  <sitemap>
    <loc>${sitemap.loc}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`).join('');
  
  return `${xmlHeader}${sitemapindexOpen}${sitemapEntries}
${sitemapindexClose}`;
}

// Helper function to save sitemap to file (for Node.js environments)
export function saveSitemapToFile(
  sitemapContent: string,
  filename: string = 'sitemap.xml'
): void {
  if (typeof window === 'undefined') {
    // Node.js environment
    const fs = require('fs');
    const path = require('path');
    
    const publicDir = path.join(process.cwd(), 'public');
    const sitemapPath = path.join(publicDir, filename);
    
    fs.writeFileSync(sitemapPath, sitemapContent, 'utf8');
    console.log(`✅ Sitemap saved to: ${sitemapPath}`);
  } else {
    // Browser environment - download the file
    const blob = new Blob([sitemapContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
