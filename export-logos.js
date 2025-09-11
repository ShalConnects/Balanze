import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Social media dimensions
const socialMediaSizes = {
  // Profile pictures
  'profile-small': { width: 180, height: 180, name: 'profile-180x180' },
  'profile-medium': { width: 400, height: 400, name: 'profile-400x400' },
  'profile-large': { width: 800, height: 800, name: 'profile-800x800' },
  
  // Cover images
  'cover-twitter': { width: 1500, height: 500, name: 'cover-twitter-1500x500' },
  'cover-facebook': { width: 851, height: 315, name: 'cover-facebook-851x315' },
  'cover-linkedin': { width: 1584, height: 396, name: 'cover-linkedin-1584x396' },
  
  // Post images
  'post-square': { width: 1080, height: 1080, name: 'post-square-1080x1080' },
  'post-landscape': { width: 1200, height: 630, name: 'post-landscape-1200x630' },
  'post-story': { width: 1080, height: 1920, name: 'post-story-1080x1920' },
  
  // App store
  'app-store': { width: 1024, height: 1024, name: 'app-store-1024x1024' },
  
  // Favicon
  'favicon-16': { width: 16, height: 16, name: 'favicon-16x16' },
  'favicon-32': { width: 32, height: 32, name: 'favicon-32x32' },
  'favicon-180': { width: 180, height: 180, name: 'favicon-180x180' }
};

// SVG content templates
const svgTemplates = {
  'logo-b': (width, height) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#2563eb"/>
      <stop offset="100%" style="stop-color:#9333ea"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="6" fill="url(#bg)"/>
  <text x="16" y="22" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="white">B</text>
</svg>`,
  
  'logo-text': (width, height) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 120 32">
  <defs>
    <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#2563eb"/>
      <stop offset="100%" style="stop-color:#9333ea"/>
    </linearGradient>
  </defs>
  <text x="60" y="22" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="url(#textGradient)">Balanze</text>
</svg>`,
  
  'logo-full': (width, height) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 160 32">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#2563eb"/>
      <stop offset="100%" style="stop-color:#9333ea"/>
    </linearGradient>
    <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#2563eb"/>
      <stop offset="100%" style="stop-color:#9333ea"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="32" height="32" rx="6" fill="url(#bg)"/>
  <text x="16" y="22" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="white">B</text>
  <text x="80" y="22" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="url(#textGradient)">Balanze</text>
</svg>`
};

// Create export directory
const exportDir = path.join(__dirname, 'exported-logos');
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

console.log('🎨 Exporting Balanze logos for social media...\n');

// Generate SVG files for each size
Object.entries(socialMediaSizes).forEach(([key, size]) => {
  Object.entries(svgTemplates).forEach(([logoType, template]) => {
    const svgContent = template(size.width, size.height);
    const filename = `${logoType}-${size.name}.svg`;
    const filepath = path.join(exportDir, filename);
    
    fs.writeFileSync(filepath, svgContent.trim());
    console.log(`✅ Created: ${filename}`);
  });
});

console.log('\n📁 Files created in: ./exported-logos/');
console.log('\n🔄 Next steps:');
console.log('1. Open the SVG files in a browser');
console.log('2. Take screenshots or use online converters');
console.log('3. Or use tools like:');
console.log('   - https://convertio.co/svg-png/');
console.log('   - https://cloudconvert.com/svg-to-png');
console.log('   - Adobe Illustrator');
console.log('   - Figma');
console.log('\n📱 Recommended usage:');
console.log('- Profile pictures: logo-b-*.svg');
console.log('- Cover images: logo-full-*.svg');
console.log('- Posts: logo-full-*.svg or logo-text-*.svg');
console.log('- App store: logo-b-app-store-1024x1024.svg'); 