import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { MOCK_ARTICLES } from '../pages/KBArticlePage';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  items = [], 
  showHome = true,
  className = ''
}) => {
  const location = useLocation();
  
  // Auto-generate breadcrumbs from current path if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    
    if (showHome) {
      breadcrumbs.push({
        label: 'Home',
        href: '/'
      });
    }
    
    // Handle help center paths
    if (pathSegments[0] === 'help-center') {
      breadcrumbs.push({
        label: 'Help Center',
        href: '/help-center'
      });
      
      if (pathSegments[1]) {
        // Get the actual article title from the slug
        const articleSlug = pathSegments[1];
        const article = MOCK_ARTICLES[articleSlug];
        const articleTitle = article ? article.title : 'Article';
        
        breadcrumbs.push({
          label: articleTitle,
          isActive: true
        });
      }
    } else if (pathSegments[0] === 'kb') {
      breadcrumbs.push({
        label: 'Help Center',
        href: '/help'
      });
      
      if (pathSegments[1]) {
        // Get the actual article title from the slug
        const articleSlug = pathSegments[1];
        const article = MOCK_ARTICLES[articleSlug];
        const articleTitle = article ? article.title : 'Article';
        
        breadcrumbs.push({
          label: articleTitle,
          isActive: true
        });
      }
    } else if (pathSegments[0] === 'help') {
      breadcrumbs.push({
        label: 'Help Center',
        isActive: true
      });
    }
    
    return breadcrumbs;
  };
  
  const breadcrumbItems = items.length > 0 ? items : generateBreadcrumbs();
  
  if (breadcrumbItems.length === 0) {
    return null;
  }
  
  return (
    <nav 
      className={`flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 ${className}`}
      aria-label="Breadcrumb"
    >
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          )}
          
          {item.href && !item.isActive ? (
            <Link
              to={item.href}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {item.label === 'Home' && <Home className="w-4 h-4 inline mr-1" />}
              {item.label}
            </Link>
          ) : (
            <span 
              className={`${
                item.isActive 
                  ? 'text-gray-900 dark:text-white font-medium' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {item.label === 'Home' && <Home className="w-4 h-4 inline mr-1" />}
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
