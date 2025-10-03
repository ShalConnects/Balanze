import { useEffect } from 'react';
import { generateRobotsTxt } from '../utils/sitemapGenerator';

export default function RobotsTxtPage() {
  useEffect(() => {
    const robotsTxt = generateRobotsTxt();
    
    // Create a blob and download it
    const blob = new Blob([robotsTxt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'robots.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Redirect back to home
    window.location.href = '/';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Generating Robots.txt...</h1>
        <p className="text-gray-600">Your robots.txt will be downloaded shortly.</p>
      </div>
    </div>
  );
}
