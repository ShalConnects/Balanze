// Sitemap generator for help center articles
// Note: We'll import MOCK_ARTICLES dynamically to avoid build-time issues

export interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export function generateHelpCenterSitemap(): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://balanze.com';
  const currentDate = new Date().toISOString().split('T')[0];
  
  // For now, we'll create a basic sitemap without the articles
  // In production, you'd fetch this from your CMS/API
  const urls: SitemapUrl[] = [
    // Main help center page
    {
      loc: `${baseUrl}/help-center`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.8
    }
    // TODO: Add individual help articles when MOCK_ARTICLES is available
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return sitemap;
}

export function generateRobotsTxt(): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://balanze.com';
  
  return `User-agent: *
Allow: /
Allow: /help-center
Allow: /help-center/*

Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/help-center-sitemap.xml`;
}

