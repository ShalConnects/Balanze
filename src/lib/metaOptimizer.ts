// Meta Descriptions and SEO Meta Tags Optimizer
// Generates optimized meta descriptions and meta tags for better SEO

export interface MetaTags {
  title: string;
  description: string;
  keywords: string[];
  author: string;
  robots: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
}

export interface ArticleMetaData {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  author?: string;
  lastUpdated: string;
  readTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Generate optimized meta description
export function generateMetaDescription(
  article: ArticleMetaData,
  maxLength: number = 160
): string {
  const baseDescription = article.description;
  
  // Add category context
  const categoryContext = getCategoryContext(article.category);
  
  // Add difficulty level
  const difficultyContext = getDifficultyContext(article.difficulty);
  
  // Add read time
  const readTimeContext = `(${article.readTime})`;
  
  // Combine elements
  let metaDescription = `${baseDescription} ${categoryContext} ${difficultyContext} ${readTimeContext}`;
  
  // Truncate if too long
  if (metaDescription.length > maxLength) {
    metaDescription = baseDescription.substring(0, maxLength - 3) + '...';
  }
  
  return metaDescription.trim();
}

// Generate optimized page title
export function generatePageTitle(
  article: ArticleMetaData,
  siteName: string = 'Balanze',
  maxLength: number = 60
): string {
  let title = `${article.title} | ${siteName} Help Center`;
  
  if (title.length > maxLength) {
    title = `${article.title} | ${siteName}`;
  }
  
  if (title.length > maxLength) {
    title = article.title;
  }
  
  return title;
}

// Generate complete meta tags
export function generateMetaTags(
  article: ArticleMetaData,
  baseUrl: string = 'https://balanze.com'
): MetaTags {
  const canonical = `${baseUrl}/help-center/${article.slug}`;
  const ogImage = `${baseUrl}/images/help-center-og.jpg`;
  
  return {
    title: generatePageTitle(article),
    description: generateMetaDescription(article),
    keywords: generateKeywords(article),
    author: article.author || 'Balanze Team',
    robots: 'index, follow',
    canonical,
    ogTitle: article.title,
    ogDescription: generateMetaDescription(article, 200),
    ogImage,
    ogUrl: canonical,
    twitterCard: 'summary_large_image',
    twitterTitle: article.title,
    twitterDescription: generateMetaDescription(article, 200),
    twitterImage: ogImage
  };
}

// Generate keywords from article data
function generateKeywords(article: ArticleMetaData): string[] {
  const baseKeywords = [...article.tags];
  
  // Add category-specific keywords
  const categoryKeywords = getCategoryKeywords(article.category);
  baseKeywords.push(...categoryKeywords);
  
  // Add difficulty-specific keywords
  const difficultyKeywords = getDifficultyKeywords(article.difficulty);
  baseKeywords.push(...difficultyKeywords);
  
  // Add common SEO keywords
  baseKeywords.push('personal finance', 'money management', 'financial tracking');
  
  // Remove duplicates and limit to 10
  return [...new Set(baseKeywords)].slice(0, 10);
}

// Get category context for meta descriptions
function getCategoryContext(category: string): string {
  const categoryContexts: Record<string, string> = {
    'Getting Started': 'Learn how to get started with Balanze',
    'Accounts': 'Manage your accounts and banking',
    'Transactions': 'Track income and expenses',
    'Analytics': 'Understand your financial insights',
    'Premium Features': 'Unlock advanced features',
    'Financial Planning': 'Plan your financial future',
    'Data Management': 'Export and backup your data',
    'Mobile': 'Use Balanze on mobile devices',
    'Support': 'Get help and support'
  };
  
  return categoryContexts[category] || 'Learn more about Balanze';
}

// Get difficulty context for meta descriptions
function getDifficultyContext(difficulty: string): string {
  const difficultyContexts: Record<string, string> = {
    'beginner': 'Perfect for beginners',
    'intermediate': 'For intermediate users',
    'advanced': 'Advanced guide for power users'
  };
  
  return difficultyContexts[difficulty] || '';
}

// Get category-specific keywords
function getCategoryKeywords(category: string): string[] {
  const categoryKeywords: Record<string, string[]> = {
    'Getting Started': ['setup', 'beginner', 'tutorial', 'guide'],
    'Accounts': ['banking', 'accounts', 'money', 'finance'],
    'Transactions': ['income', 'expenses', 'spending', 'budget'],
    'Analytics': ['reports', 'insights', 'analysis', 'charts'],
    'Premium Features': ['premium', 'advanced', 'subscription', 'upgrade'],
    'Financial Planning': ['planning', 'goals', 'wealth', 'investment'],
    'Data Management': ['export', 'backup', 'data', 'privacy'],
    'Mobile': ['mobile', 'app', 'smartphone', 'tablet'],
    'Support': ['help', 'support', 'troubleshooting', 'FAQ']
  };
  
  return categoryKeywords[category] || [];
}

// Get difficulty-specific keywords
function getDifficultyKeywords(difficulty: string): string[] {
  const difficultyKeywords: Record<string, string[]> = {
    'beginner': ['easy', 'simple', 'basic', 'tutorial'],
    'intermediate': ['advanced', 'detailed', 'comprehensive'],
    'advanced': ['expert', 'power user', 'professional', 'comprehensive']
  };
  
  return difficultyKeywords[difficulty] || [];
}

// Generate JSON-LD structured data for articles
export function generateArticleJsonLd(
  article: ArticleMetaData,
  baseUrl: string = 'https://balanze.com'
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    author: {
      '@type': 'Person',
      name: article.author || 'Balanze Team'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Balanze',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`
      }
    },
    datePublished: article.lastUpdated,
    dateModified: article.lastUpdated,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/help-center/${article.slug}`
    },
    articleSection: article.category,
    wordCount: estimateWordCount(article.description),
    timeRequired: article.readTime,
    inLanguage: 'en-US',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Balanze Help Center',
      url: `${baseUrl}/help-center`
    },
    keywords: generateKeywords(article).join(', '),
    about: {
      '@type': 'Thing',
      name: 'Personal Finance Management'
    }
  };
}

// Estimate word count from description
function estimateWordCount(text: string): number {
  return text.split(' ').length;
}

// Generate breadcrumb JSON-LD
export function generateBreadcrumbJsonLd(
  breadcrumbs: Array<{ name: string; url: string }>,
  baseUrl: string = 'https://balanze.com'
): object {
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

// Generate FAQ JSON-LD
export function generateFaqJsonLd(
  faqs: Array<{ question: string; answer: string }>
): object {
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

// Generate How-To JSON-LD
export function generateHowToJsonLd(
  howTo: {
    name: string;
    description: string;
    totalTime: string;
    steps: Array<{
      name: string;
      text: string;
      url?: string;
    }>;
  }
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: howTo.name,
    description: howTo.description,
    totalTime: howTo.totalTime,
    step: howTo.steps.map(step => ({
      '@type': 'HowToStep',
      name: step.name,
      text: step.text,
      ...(step.url && { url: step.url })
    }))
  };
}

// Generate meta tags HTML string
export function generateMetaTagsHTML(metaTags: MetaTags): string {
  return `
    <title>${metaTags.title}</title>
    <meta name="description" content="${metaTags.description}">
    <meta name="keywords" content="${metaTags.keywords.join(', ')}">
    <meta name="author" content="${metaTags.author}">
    <meta name="robots" content="${metaTags.robots}">
    <link rel="canonical" href="${metaTags.canonical}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${metaTags.ogTitle}">
    <meta property="og:description" content="${metaTags.ogDescription}">
    <meta property="og:image" content="${metaTags.ogImage}">
    <meta property="og:url" content="${metaTags.ogUrl}">
    <meta property="og:type" content="article">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="${metaTags.twitterCard}">
    <meta name="twitter:title" content="${metaTags.twitterTitle}">
    <meta name="twitter:description" content="${metaTags.twitterDescription}">
    <meta name="twitter:image" content="${metaTags.twitterImage}">
  `.trim();
}
