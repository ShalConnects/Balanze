import { useEffect } from 'react';
import { generateHelpCenterSitemap } from '../utils/sitemapGenerator';

export default function SitemapPage() {
  useEffect(() => {
    const sitemap = generateHelpCenterSitemap();
    
    // Set content type and serve sitemap.xml content
    document.contentType = 'application/xml';
    document.body.innerHTML = `<pre>${sitemap}</pre>`;
    document.body.style.margin = '0';
    document.body.style.padding = '20px';
    document.body.style.fontFamily = 'monospace';
  }, []);

  return null;
}

