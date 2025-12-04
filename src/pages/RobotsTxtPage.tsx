import { useEffect } from 'react';
import { generateRobotsTxt } from '../utils/sitemapGenerator';

export default function RobotsTxtPage() {
  useEffect(() => {
    const robotsTxt = generateRobotsTxt();
    
    // Set content type and serve robots.txt content
    document.contentType = 'text/plain';
    document.body.innerHTML = `<pre>${robotsTxt}</pre>`;
    document.body.style.margin = '0';
    document.body.style.padding = '20px';
    document.body.style.fontFamily = 'monospace';
  }, []);

  return null;
}

