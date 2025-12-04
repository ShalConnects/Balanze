#!/bin/bash

echo "🚀 Launching Your Balanze SaaS..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit - SaaS ready for launch"
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
echo "Note: You'll be prompted to:"
echo "1. Login to Vercel (if not already logged in)"
echo "2. Link to existing project or create new one"
echo "3. Set environment variables"
echo ""

vercel --prod

echo ""
echo "🎉 Deployment completed!"
echo "Your SaaS is now live! 🚀"
echo ""
echo "Next steps:"
echo "1. Set environment variables in Vercel dashboard:"
echo "   - VITE_SUPABASE_URL=https://xgncksougafnfbtusfnf.supabase.co"
echo "   - VITE_SUPABASE_ANON_KEY=your-anon-key"
echo "2. Test the live application"
echo "3. Share your SaaS with users!" 