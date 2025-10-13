import React, { useState } from 'react';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import { 
  LifeBuoy
} from 'lucide-react';
import ProductTour from '../components/ProductTour';
import KBSearch from '../components/KBSearch';
import { useAuthStore } from '../store/authStore';
import { useFinanceStore } from '../store/useFinanceStore';



const HelpAndSupport: React.FC = () => {
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState<string | null>(null);
  
  const { user } = useAuthStore();
  const { accounts, transactions } = useFinanceStore();



  const handleStartTour = (stepId: string) => {
    setTourStep(stepId);
    setShowTour(true);
  };

  const handleCloseTour = () => {
    setShowTour(false);
    setTourStep(null);
  };

  return (
    <>
      <Helmet>
        {/* Enhanced SEO for Help Center */}
        <title>Help Center - Balanze Financial Tracking</title>
        <meta name="description" content="Get comprehensive help with Balanze personal finance tracking. Find guides, tutorials, and support for expense management, budget tracking, and financial planning." />
        <meta name="keywords" content="Balanze help, personal finance help, expense tracking, budget management, financial planning, money management, expense categories, account management" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="author" content="Balanze Team" />
        <meta name="language" content="en" />
        <meta name="revisit-after" content="7 days" />
        
        {/* Canonical URL */}
        <link rel="canonical" href={window.location.href} />
        
        {/* Enhanced Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Help Center - Balanze Financial Tracking" />
        <meta property="og:description" content="Get comprehensive help with Balanze personal finance tracking. Find guides, tutorials, and support for expense management, budget tracking, and financial planning." />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:site_name" content="Balanze Help Center" />
        <meta property="og:locale" content="en_US" />
        
        {/* Enhanced Twitter Cards */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="Help Center - Balanze Financial Tracking" />
        <meta property="twitter:description" content="Get comprehensive help with Balanze personal finance tracking. Find guides, tutorials, and support for expense management, budget tracking, and financial planning." />
        <meta property="twitter:site" content="@BalanzeApp" />
        <meta property="twitter:creator" content="@BalanzeApp" />
        
        {/* Additional SEO Meta Tags */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Balanze Help" />
        
        {/* Website structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Balanze Help Center",
            "description": "Get comprehensive help with Balanze personal finance tracking. Find guides, tutorials, and support for expense management, budget tracking, and financial planning.",
            "url": window.location.origin + "/help",
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": window.location.origin + "/help?search={search_term_string}"
              },
              "query-input": "required name=search_term_string"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Balanze",
              "url": window.location.origin,
              "logo": {
                "@type": "ImageObject",
                "url": window.location.origin + "/logo.png",
                "width": 200,
                "height": 200
              }
            }
          })}
        </script>
        
        {/* Breadcrumb structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": window.location.origin
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Help Center",
                "item": window.location.href
              }
            ]
          })}
        </script>
        
        {/* FAQ Schema for common questions */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How do I get started with Balanze?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Getting started with Balanze is easy. First, create your account and add your first account (bank account, credit card, or cash wallet). Then start adding transactions to track your spending and income."
                }
              },
              {
                "@type": "Question",
                "name": "How do I add my first account?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "To add your first account, go to the Accounts page and click 'Add Account'. Choose the account type (Bank Account, Credit Card, or Cash Wallet), enter the details, and save."
                }
              },
              {
                "@type": "Question",
                "name": "How do I create my first transaction?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "To create your first transaction, go to the Transactions page and click 'Add Transaction'. Select the account, enter the amount, choose the category, add a description, and save."
                }
              },
              {
                "@type": "Question",
                "name": "What is the difference between transfers and transactions?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Transactions represent money coming in or going out of your accounts (income, expenses). Transfers represent money moving between your accounts without changing your total net worth."
                }
              }
            ]
          })}
        </script>
      </Helmet>
      
      <div className="mb-12">

        {/* Enhanced KB Search */}
        <div className="mb-8">
          <KBSearch />
        </div>


        {/* Welcome Banner */}
        <div className="bg-gradient-primary rounded-xl p-6 mb-8 text-white dark:bg-gradient-to-r dark:from-blue-600 dark:to-purple-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 dark:bg-white/30 rounded-full">
                <LifeBuoy className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">Welcome to the Help Center!</h1>
                <p className="text-blue-100 dark:text-blue-200">
                  Discover guides, tutorials, and tips to master Balanze. Can't find what you're looking for? 
                  <button 
                    onClick={() => window.open('mailto:shalconnect00@gmail.com', '_blank')}
                    className="underline hover:text-white dark:hover:text-blue-100 ml-1"
                  >
                    Contact our support team
                  </button>
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <div className="text-right">
                <div className="text-sm text-blue-100 dark:text-blue-200">Last updated</div>
                <div className="font-semibold">{new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Link - Only show in development */}
        {import.meta.env.DEV && (
          <div className="mb-6">
            <a 
              href="/admin" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium"
            >
              🛠️ Admin Panel (Dev Only)
            </a>
          </div>
        )}

        {/* Product Tour Component */}
        {showTour && (
          <ProductTour
            stepToStart={tourStep}
            isOpen={showTour}
            onClose={handleCloseTour}
          />
        )}
      </div>
    </>
  );
};

export default HelpAndSupport; 