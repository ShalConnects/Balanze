import React from 'react';
import { Helmet } from 'react-helmet-async';

interface PublicHelpLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export const PublicHelpLayout: React.FC<PublicHelpLayoutProps> = ({ 
  children, 
  title = "Help Center - Balanze",
  description = "Get help with Balanze financial tracking. Find answers to common questions, tutorials, and support resources."
}) => {
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content="Balanze help, financial tracking help, expense management, budget tracking, financial planning" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={window.location.href} />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={description} />
        
        {/* Structured Data for Help Center */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Balanze Help Center",
            "description": description,
            "url": window.location.origin + "/help-center",
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": window.location.origin + "/help-center?search={search_term_string}"
              },
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Public Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <a href="/" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">B</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">Balanze</span>
                </a>
              </div>
              
              <div className="flex items-center space-x-4">
                <a 
                  href="/login" 
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </a>
                <a 
                  href="/signup" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Breadcrumb Navigation */}
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-2 py-3 text-sm">
              <a href="/" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                Home
              </a>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 dark:text-white font-medium">Help Center</span>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="py-4 sm:py-6 lg:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        {/* Public Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Product</h3>
                <ul className="space-y-2">
                  <li><a href="/dashboard-demo" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm">Demo</a></li>
                  <li><a href="/about" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm">About</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Support</h3>
                <ul className="space-y-2">
                  <li><a href="/help-center" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm">Help Center</a></li>
                  <li><a href="mailto:shalconnect00@gmail.com" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm">Contact Us</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li><a href="/privacypolicy" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm">Privacy Policy</a></li>
                  <li><a href="/termsofservice" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm">Terms of Service</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Get Started</h3>
                <div className="space-y-2">
                  <a 
                    href="/signup" 
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Create Account
                  </a>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  © 2024 Balanze. All rights reserved.
                </p>
                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                  <a href="/help-center" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm">
                    Help Center
                  </a>
                  <a href="/about" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm">
                    About
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

