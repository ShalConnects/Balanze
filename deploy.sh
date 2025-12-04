#!/bin/bash

# Balanze App Deployment Script
# This script helps deploy the application to Vercel with proper configuration

set -e

echo "🚀 Starting Balanze App Deployment to Vercel..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Vercel CLI is installed
check_vercel_cli() {
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI is not installed. Please install it first:"
        echo "npm install -g vercel"
        exit 1
    fi
    print_success "Vercel CLI is installed"
}

# Check if .env file exists
check_env_file() {
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from template..."
        if [ -f "env.template" ]; then
            cp env.template .env
            print_warning "Please update .env with your actual values before deploying"
        else
            print_error "env.template not found. Please create a .env file with your configuration"
            exit 1
        fi
    else
        print_success ".env file found"
    fi
}

# Check required environment variables
check_env_vars() {
    print_status "Checking required environment variables..."
    
    if [ -z "$VITE_SUPABASE_URL" ]; then
        print_error "VITE_SUPABASE_URL is not set in .env"
        exit 1
    fi
    
    if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
        print_error "VITE_SUPABASE_ANON_KEY is not set in .env"
        exit 1
    fi
    
    print_success "Required environment variables are set"
}

# Build the application
build_app() {
    print_status "Building the application..."
    
    # Clean previous build
    rm -rf dist
    
    # Install dependencies
    npm install
    
    # Build the app
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Application built successfully"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel..."
    
    # Check if already logged in to Vercel
    if ! vercel whoami &> /dev/null; then
        print_warning "Not logged in to Vercel. Please log in:"
        vercel login
    fi
    
    # Deploy
    vercel --prod
    
    if [ $? -eq 0 ]; then
        print_success "Deployment completed successfully!"
    else
        print_error "Deployment failed"
        exit 1
    fi
}

# Test the deployment
test_deployment() {
    print_status "Testing deployment..."
    
    # Get the deployment URL
    DEPLOYMENT_URL=$(vercel ls | grep -o 'https://[^[:space:]]*' | head -1)
    
    if [ -n "$DEPLOYMENT_URL" ]; then
        print_success "Deployment URL: $DEPLOYMENT_URL"
        print_status "Testing the application..."
        
        # Simple curl test
        if curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL" | grep -q "200\|302"; then
            print_success "Application is responding correctly"
        else
            print_warning "Application might not be responding correctly. Please check manually"
        fi
    else
        print_warning "Could not determine deployment URL. Please check manually"
    fi
}

# Main deployment process
main() {
    echo "=========================================="
    echo "Balanze App Deployment to Vercel"
    echo "=========================================="
    
    check_vercel_cli
    check_env_file
    check_env_vars
    build_app
    deploy_to_vercel
    test_deployment
    
    echo ""
    echo "🎉 Deployment completed!"
    echo ""
    echo "Next steps:"
    echo "1. Configure social login providers in Supabase"
    echo "2. Update redirect URLs in Google/Apple OAuth settings"
    echo "3. Test the application thoroughly"
    echo "4. Monitor the deployment logs"
    echo ""
    echo "Useful commands:"
    echo "- View logs: vercel logs"
    echo "- Open app: vercel open"
    echo "- List deployments: vercel ls"
}

# Run the main function
main "$@" 