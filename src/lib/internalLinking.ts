import { getInternalLinks, getRelatedArticlesByCluster, TOPIC_CLUSTERS } from '../data/articles';

export interface InternalLinkSuggestion {
  text: string;
  targetSlug: string;
  context: string;
  anchorText: string;
  position: number;
  confidence: number;
}

export interface ContentAnalysis {
  suggestions: InternalLinkSuggestion[];
  topicCluster: string | null;
  relatedArticles: string[];
  seoKeywords: string[];
}

/**
 * Analyzes article content and suggests internal links
 */
export function analyzeContentForInternalLinks(
  content: string,
  currentSlug: string,
  existingLinks: string[] = []
): ContentAnalysis {
  const suggestions: InternalLinkSuggestion[] = [];
  const contentLower = content.toLowerCase();
  
  // Get topic cluster and related articles
  const topicCluster = TOPIC_CLUSTERS[getTopicClusterForSlug(currentSlug)];
  const relatedArticles = getRelatedArticlesByCluster(currentSlug, 5);
  
  // Define keyword patterns and their target articles
  const keywordPatterns = [
    {
      keywords: ['account', 'accounts', 'bank account', 'credit card'],
      targetSlug: 'create-first-account',
      anchorText: 'account creation guide',
      context: 'account setup'
    },
    {
      keywords: ['transaction', 'transactions', 'income', 'expense', 'expenses'],
      targetSlug: 'create-first-transaction',
      anchorText: 'transaction guide',
      context: 'transaction management'
    },
    {
      keywords: ['transfer', 'transfers', 'move money', 'between accounts'],
      targetSlug: 'how-to-create-your-first-transfer',
      anchorText: 'transfer guide',
      context: 'money transfers'
    },
    {
      keywords: ['settings', 'configuration', 'preferences', 'setup'],
      targetSlug: 'settings-page-comprehensive-guide',
      anchorText: 'settings guide',
      context: 'app configuration'
    },
    {
      keywords: ['category', 'categories', 'income category', 'expense category'],
      targetSlug: 'how-to-create-your-first-income-expense-category',
      anchorText: 'category management guide',
      context: 'category setup'
    },
    {
      keywords: ['premium', 'upgrade', 'subscription', 'billing'],
      targetSlug: 'premium-features-guide',
      anchorText: 'premium features guide',
      context: 'premium features'
    },
    {
      keywords: ['analytics', 'reports', 'insights', 'spending analysis'],
      targetSlug: 'analytics-overview',
      anchorText: 'analytics guide',
      context: 'financial insights'
    },
    {
      keywords: ['last wish', 'time capsule', 'digital legacy'],
      targetSlug: 'how-to-use-last-wish',
      anchorText: 'Last Wish guide',
      context: 'premium features'
    }
  ];
  
  // Analyze content for keyword matches
  keywordPatterns.forEach(pattern => {
    pattern.keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = contentLower.match(regex);
      
      if (matches && matches.length > 0) {
        // Check if link already exists
        const linkExists = existingLinks.some(link => 
          link.includes(pattern.targetSlug)
        );
        
        if (!linkExists && pattern.targetSlug !== currentSlug) {
          // Find the position of the first match
          const matchIndex = contentLower.indexOf(keyword);
          
          suggestions.push({
            text: keyword,
            targetSlug: pattern.targetSlug,
            context: pattern.context,
            anchorText: pattern.anchorText,
            position: matchIndex,
            confidence: Math.min(0.9, matches.length * 0.2 + 0.5)
          });
        }
      }
    });
  });
  
  // Sort suggestions by confidence and position
  suggestions.sort((a, b) => {
    if (a.confidence !== b.confidence) {
      return b.confidence - a.confidence;
    }
    return a.position - b.position;
  });
  
  return {
    suggestions: suggestions.slice(0, 5), // Limit to top 5 suggestions
    topicCluster: topicCluster?.name || null,
    relatedArticles,
    seoKeywords: extractSEOKeywords(content)
  };
}

/**
 * Gets topic cluster for a given slug
 */
function getTopicClusterForSlug(slug: string): string {
  // This would be enhanced with actual article data
  if (slug.includes('getting-started') || slug.includes('create-first')) {
    return 'getting-started';
  }
  if (slug.includes('account') || slug.includes('transfer')) {
    return 'account-management';
  }
  if (slug.includes('transaction') || slug.includes('category')) {
    return 'transactions';
  }
  if (slug.includes('analytics') || slug.includes('report')) {
    return 'analytics';
  }
  if (slug.includes('premium') || slug.includes('last-wish')) {
    return 'premium-features';
  }
  return 'getting-started';
}

/**
 * Extracts SEO keywords from content
 */
function extractSEOKeywords(content: string): string[] {
  const keywords: string[] = [];
  const contentLower = content.toLowerCase();
  
  // Common financial and app-related keywords
  const keywordPatterns = [
    'financial tracking',
    'expense management',
    'budget tracking',
    'money management',
    'personal finance',
    'account management',
    'transaction tracking',
    'spending analysis',
    'financial planning',
    'budgeting app'
  ];
  
  keywordPatterns.forEach(keyword => {
    if (contentLower.includes(keyword)) {
      keywords.push(keyword);
    }
  });
  
  return keywords.slice(0, 10); // Limit to 10 keywords
}

/**
 * Generates internal link HTML with proper SEO attributes
 */
export function generateInternalLinkHTML(
  suggestion: InternalLinkSuggestion,
  baseUrl: string = ''
): string {
  const href = `${baseUrl}/kb/${suggestion.targetSlug}`;
  
  return `<a href="${href}" 
    class="text-blue-600 dark:text-blue-400 hover:underline font-medium"
    data-internal-link="true"
    data-link-context="${suggestion.context}"
    title="${suggestion.anchorText}"
    rel="internal">
    ${suggestion.text}
  </a>`;
}

/**
 * Analyzes content for missing internal links and suggests improvements
 */
export function suggestContentImprovements(
  content: string,
  currentSlug: string
): {
  missingLinks: string[];
  suggestedAdditions: string[];
  seoImprovements: string[];
} {
  const analysis = analyzeContentForInternalLinks(content, currentSlug);
  const existingLinks = extractExistingLinks(content);
  
  const missingLinks: string[] = [];
  const suggestedAdditions: string[] = [];
  const seoImprovements: string[] = [];
  
  // Check for missing topic cluster links
  if (analysis.topicCluster) {
    const clusterArticles = TOPIC_CLUSTERS[analysis.topicCluster as keyof typeof TOPIC_CLUSTERS];
    if (clusterArticles) {
      clusterArticles.articles.forEach(articleSlug => {
        if (articleSlug !== currentSlug && !existingLinks.includes(articleSlug)) {
          missingLinks.push(articleSlug);
        }
      });
    }
  }
  
  // Suggest content additions based on topic cluster
  if (analysis.topicCluster === 'getting-started') {
    suggestedAdditions.push('Consider adding a "Next Steps" section with links to account management and transaction guides');
  }
  
  if (analysis.topicCluster === 'account-management') {
    suggestedAdditions.push('Add links to transfer guides and currency management articles');
  }
  
  // SEO improvements
  if (analysis.seoKeywords.length < 3) {
    seoImprovements.push('Add more relevant keywords to improve SEO');
  }
  
  if (!content.includes('related articles') && !content.includes('see also')) {
    seoImprovements.push('Consider adding a "Related Articles" or "See Also" section');
  }
  
  return {
    missingLinks,
    suggestedAdditions,
    seoImprovements
  };
}

/**
 * Extracts existing internal links from content
 */
function extractExistingLinks(content: string): string[] {
  const linkRegex = /href=["']\/kb\/([^"']+)["']/g;
  const links: string[] = [];
  let match;
  
  while ((match = linkRegex.exec(content)) !== null) {
    links.push(match[1]);
  }
  
  return links;
}
