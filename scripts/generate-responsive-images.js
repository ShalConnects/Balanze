#!/usr/bin/env node

/**
 * Script to generate responsive images for Balanze
 * 
 * Requirements:
 * - sharp-cli: npm install -g sharp-cli
 * - OR use online tools like Squoosh.app
 * 
 * Usage:
 * node scripts/generate-responsive-images.js
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// Image configurations
const images = [
  {
    name: 'main-dashboard',
    source: 'main-dashboard.png',
    sizes: [
      { width: 400, suffix: '400' },
      { width: 800, suffix: '800' },
      { width: 1200, suffix: '1200' },
      { width: 1643, suffix: '1643' }
    ],
    formats: ['png', 'webp']
  },
  {
    name: 'android_view',
    source: 'android_view.png',
    sizes: [
      { width: 200, suffix: '200' },
      { width: 300, suffix: '300' },
      { width: 400, suffix: '400' }
    ],
    formats: ['png', 'webp']
  }
];

console.log('📸 Responsive Image Generator for Balanze\n');
console.log('This script provides instructions for generating responsive images.\n');
console.log('You can use one of these methods:\n');

console.log('Method 1: Using sharp-cli (Recommended)');
console.log('----------------------------------------');
console.log('1. Install sharp-cli: npm install -g sharp-cli');
console.log('2. Run the following commands:\n');

images.forEach(img => {
  console.log(`\nFor ${img.name}:`);
  img.sizes.forEach(size => {
    img.formats.forEach(format => {
      const outputName = `${img.name}-${size.suffix}.${format}`;
      if (format === 'webp') {
        console.log(`  sharp-cli -i public/${img.source} -o public/${outputName} --resize ${size.width} --webp`);
      } else {
        console.log(`  sharp-cli -i public/${img.source} -o public/${outputName} --resize ${size.width}`);
      }
    });
  });
});

console.log('\n\nMethod 2: Using Squoosh.app (Online)');
console.log('-------------------------------------');
console.log('1. Go to https://squoosh.app/');
console.log('2. Upload your image');
console.log('3. Resize to each size');
console.log('4. Export as WebP and PNG');
console.log('5. Save to public/ folder with naming: image-name-width.format\n');

console.log('Method 3: Using ImageMagick');
console.log('----------------------------');
images.forEach(img => {
  console.log(`\nFor ${img.name}:`);
  img.sizes.forEach(size => {
    img.formats.forEach(format => {
      const outputName = `${img.name}-${size.suffix}.${format}`;
      if (format === 'webp') {
        console.log(`  magick public/${img.source} -resize ${size.width}x -quality 85 public/${outputName}`);
      } else {
        console.log(`  magick public/${img.source} -resize ${size.width}x public/${outputName}`);
      }
    });
  });
});

console.log('\n\nAfter generating images:');
console.log('1. Place all generated images in the public/ folder');
console.log('2. Uncomment the <source> tags in src/pages/LandingPage.tsx');
console.log('3. Test the images load correctly');
console.log('4. Verify PageSpeed Insights improvements\n');

console.log('Expected file structure:');
console.log('public/');
images.forEach(img => {
  img.sizes.forEach(size => {
    img.formats.forEach(format => {
      const outputName = `${img.name}-${size.suffix}.${format}`;
      console.log(`  ${outputName}`);
    });
  });
});

console.log('\n✅ Done! Follow the instructions above to generate your responsive images.\n');

