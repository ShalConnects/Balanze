// Structured Data for SEO - Schema.org markup
// Improves search engine understanding and rich snippets

export interface ArticleStructuredData {
  '@context': string;
  '@type': string;
  headline: string;
  description: string;
  author: {
    '@type': string;
    name: string;
  };
  datePublished: string;
  dateModified: string;
  publisher: {
    '@type': string;
    name: string;
    logo: {
      '@type': string;
      url: string;
    };
  };
  mainEntityOfPage: {
    '@type': string;
    '@id': string;
  };
  articleSection: string;
  wordCount?: number;
  timeRequired?: string;
  inLanguage: string;
  isPartOf: {
    '@type': string;
    name: string;
    url: string;
  };
}

export interface BreadcrumbStructuredData {
  '@context': string;
  '@type': string;
  itemListElement: Array<{
    '@type': string;
    position: number;
    name: string;
    item: string;
  }>;
}

export interface FAQStructuredData {
  '@context': string;
  '@type': string;
  mainEntity: Array<{
    '@type': string;
    name: string;
    acceptedAnswer: {
      '@type': string;
      text: string;
    };
  }>;
}

export interface HowToStructuredData {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  totalTime: string;
  estimatedCost?: {
    '@type': string;
    currency: string;
    value: string;
  };
  supply?: Array<{
    '@type': string;
    name: string;
  }>;
  tool?: Array<{
    '@type': string;
    name: string;
  }>;
  step: Array<{
    '@type': string;
    name: string;
    text: string;
    url?: string;
    image?: string;
  }>;
}

// Generate article structured data
export function generateArticleStructuredData(
  article: {
    slug: string;
    title: string;
    description: string;
    author?: string;
    lastUpdated: string;
    category: string;
    readTime: string;
  },
  baseUrl: string = 'https://balanze.com'
): ArticleStructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    author: {
      '@type': 'Person',
      name: article.author || 'Balanze Team'
    },
    datePublished: article.lastUpdated,
    dateModified: article.lastUpdated,
    publisher: {
      '@type': 'Organization',
      name: 'Balanze',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/help-center/${article.slug}`
    },
    articleSection: article.category,
    timeRequired: article.readTime,
    inLanguage: 'en-US',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Balanze Help Center',
      url: `${baseUrl}/help-center`
    }
  };
}

// Generate breadcrumb structured data
export function generateBreadcrumbStructuredData(
  breadcrumbs: Array<{ name: string; url: string }>,
  baseUrl: string = 'https://balanze.com'
): BreadcrumbStructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${baseUrl}${crumb.url}`
    }))
  };
}

// Generate FAQ structured data
export function generateFAQStructuredData(
  faqs: Array<{ question: string; answer: string }>
): FAQStructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

// Generate How-To structured data
export function generateHowToStructuredData(
  howTo: {
    name: string;
    description: string;
    totalTime: string;
    steps: Array<{
      name: string;
      text: string;
      url?: string;
      image?: string;
    }>;
    supplies?: string[];
    tools?: string[];
  }
): HowToStructuredData {
  const structuredData: HowToStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: howTo.name,
    description: howTo.description,
    totalTime: howTo.totalTime,
    step: howTo.steps.map(step => ({
      '@type': 'HowToStep',
      name: step.name,
      text: step.text,
      ...(step.url && { url: step.url }),
      ...(step.image && { image: step.image })
    }))
  };

  if (howTo.supplies && howTo.supplies.length > 0) {
    structuredData.supply = howTo.supplies.map(supply => ({
      '@type': 'HowToSupply',
      name: supply
    }));
  }

  if (howTo.tools && howTo.tools.length > 0) {
    structuredData.tool = howTo.tools.map(tool => ({
      '@type': 'HowToTool',
      name: tool
    }));
  }

  return structuredData;
}

// Generate website structured data
export function generateWebsiteStructuredData(
  baseUrl: string = 'https://balanze.com'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Balanze',
    description: 'Personal finance management platform for tracking income, expenses, and financial goals',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/help-center?search={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Balanze',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`
      }
    }
  };
}

// Generate help center structured data
export function generateHelpCenterStructuredData(
  articles: Array<{
    slug: string;
    title: string;
    description: string;
    category: string;
  }>,
  baseUrl: string = 'https://balanze.com'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Balanze Help Center',
    description: 'Complete help center with guides, tutorials, and support for Balanze personal finance management',
    url: `${baseUrl}/help-center`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: articles.length,
      itemListElement: articles.map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Article',
          headline: article.title,
          description: article.description,
          url: `${baseUrl}/help-center/${article.slug}`,
          articleSection: article.category
        }
      }))
    }
  };
}

// Helper function to inject structured data into page
export function injectStructuredData(data: any, id: string = 'structured-data'): void {
  // Remove existing structured data
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }

  // Create new script element
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data, null, 2);
  
  // Add to head
  document.head.appendChild(script);
}

// Generate all structured data for a help center page
export function generateHelpCenterPageStructuredData(
  article: {
    slug: string;
    title: string;
    description: string;
    author?: string;
    lastUpdated: string;
    category: string;
    readTime: string;
  },
  breadcrumbs: Array<{ name: string; url: string }>,
  baseUrl: string = 'https://balanze.com'
) {
  return {
    article: generateArticleStructuredData(article, baseUrl),
    breadcrumbs: generateBreadcrumbStructuredData(breadcrumbs, baseUrl),
    website: generateWebsiteStructuredData(baseUrl)
  };
}
