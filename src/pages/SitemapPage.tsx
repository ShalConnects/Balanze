import { useEffect } from 'react';
import { generateHelpCenterSitemap } from '../utils/sitemapGenerator';

export default function SitemapPage() {
  useEffect(() => {
    const sitemap = generateHelpCenterSitemap();
    
    // Create a blob and download it
    const blob = new Blob([sitemap], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Redirect back to home
    window.location.href = '/';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Generating Sitemap...</h1>
        <p className="text-gray-600 dark:text-gray-300">Your sitemap will be downloaded shortly.</p>
      </div>
    </div>
  );
}
