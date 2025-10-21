import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Link as LinkIcon, 
  TrendingUp, 
  Target, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  BookOpen,
  Tag
} from 'lucide-react';
import { analyzeContentForInternalLinks, suggestContentImprovements } from '../lib/internalLinking';
import { getRelatedArticlesByCluster, TOPIC_CLUSTERS } from '../data/articles';

interface SEOOptimizerProps {
  content: string;
  currentSlug: string;
  onApplySuggestions?: (suggestions: string[]) => void;
}

interface SEOAnalysis {
  score: number;
  suggestions: string[];
  missingElements: string[];
  strengths: string[];
}

const SEOOptimizer: React.FC<SEOOptimizerProps> = ({ 
  content, 
  currentSlug, 
  onApplySuggestions 
}) => {
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (content && currentSlug) {
      analyzeContent();
    }
  }, [content, currentSlug]);

  const analyzeContent = async () => {
    setIsAnalyzing(true);
    
    try {
      const contentAnalysis = analyzeContentForInternalLinks(content, currentSlug);
      const improvements = suggestContentImprovements(content, currentSlug);
      
      // Calculate SEO score
      const score = calculateSEOScore(content, contentAnalysis, improvements);
      
      // Generate suggestions
      const suggestions = generateSEOSuggestions(contentAnalysis, improvements);
      
      // Identify missing elements
      const missingElements = identifyMissingElements(content, contentAnalysis);
      
      // Identify strengths
      const strengths = identifyStrengths(content, contentAnalysis);
      
      setAnalysis({
        score,
        suggestions,
        missingElements,
        strengths
      });
    } catch (error) {
      console.error('Error analyzing content:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateSEOScore = (
    content: string, 
    contentAnalysis: any, 
    improvements: any
  ): number => {
    let score = 0;
    const maxScore = 100;
    
    // Content length (20 points)
    if (content.length > 1000) score += 20;
    else if (content.length > 500) score += 15;
    else if (content.length > 200) score += 10;
    
    // Internal links (25 points)
    const linkCount = (content.match(/href=["']\/kb\//g) || []).length;
    if (linkCount >= 3) score += 25;
    else if (linkCount >= 2) score += 20;
    else if (linkCount >= 1) score += 15;
    
    // Keywords (20 points)
    if (contentAnalysis.seoKeywords.length >= 5) score += 20;
    else if (contentAnalysis.seoKeywords.length >= 3) score += 15;
    else if (contentAnalysis.seoKeywords.length >= 1) score += 10;
    
    // Topic cluster (15 points)
    if (contentAnalysis.topicCluster) score += 15;
    
    // Related articles (10 points)
    if (contentAnalysis.relatedArticles.length >= 3) score += 10;
    else if (contentAnalysis.relatedArticles.length >= 1) score += 5;
    
    // Content structure (10 points)
    if (content.includes('<h2>') || content.includes('<h3>')) score += 10;
    else if (content.includes('<h1>')) score += 5;
    
    return Math.min(score, maxScore);
  };

  const generateSEOSuggestions = (contentAnalysis: any, improvements: any): string[] => {
    const suggestions: string[] = [];
    
    if (contentAnalysis.suggestions.length > 0) {
      suggestions.push(`Add ${contentAnalysis.suggestions.length} internal links to improve content connectivity`);
    }
    
    if (improvements.missingLinks.length > 0) {
      suggestions.push(`Link to ${improvements.missingLinks.length} related articles in your topic cluster`);
    }
    
    if (contentAnalysis.seoKeywords.length < 3) {
      suggestions.push('Add more relevant keywords to improve search visibility');
    }
    
    if (!content.includes('related articles') && !content.includes('see also')) {
      suggestions.push('Add a "Related Articles" section to improve user engagement');
    }
    
    if (content.length < 500) {
      suggestions.push('Expand content to provide more comprehensive information');
    }
    
    return suggestions;
  };

  const identifyMissingElements = (content: string, contentAnalysis: any): string[] => {
    const missing: string[] = [];
    
    if (!content.includes('<h1>') && !content.includes('<h2>')) {
      missing.push('Heading structure');
    }
    
    if ((content.match(/href=["']\/kb\//g) || []).length < 2) {
      missing.push('Internal links');
    }
    
    if (!content.includes('related') && !content.includes('see also')) {
      missing.push('Related content section');
    }
    
    if (contentAnalysis.seoKeywords.length < 3) {
      missing.push('SEO keywords');
    }
    
    return missing;
  };

  const identifyStrengths = (content: string, contentAnalysis: any): string[] => {
    const strengths: string[] = [];
    
    if (content.length > 1000) {
      strengths.push('Comprehensive content');
    }
    
    if ((content.match(/href=["']\/kb\//g) || []).length >= 2) {
      strengths.push('Good internal linking');
    }
    
    if (contentAnalysis.topicCluster) {
      strengths.push('Clear topic focus');
    }
    
    if (contentAnalysis.seoKeywords.length >= 3) {
      strengths.push('Good keyword usage');
    }
    
    return strengths;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (score >= 60) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  if (isAnalyzing) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 dark:text-gray-400">Analyzing content for SEO optimization...</span>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            SEO Analysis
          </h3>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* SEO Score */}
      <div className={`rounded-lg p-4 mb-4 border ${getScoreBgColor(analysis.score)}`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">SEO Score</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {analysis.score >= 80 ? 'Excellent' : 
               analysis.score >= 60 ? 'Good' : 'Needs Improvement'}
            </p>
          </div>
          <div className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}>
            {analysis.score}/100
          </div>
        </div>
      </div>

      {/* Strengths */}
      {analysis.strengths.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Strengths
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.strengths.map((strength, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full"
              >
                {strength}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Missing Elements */}
      {analysis.missingElements.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Missing Elements
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.missingElements.map((element, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full"
              >
                {element}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {showDetails && analysis.suggestions.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Suggestions
          </h4>
          <ul className="space-y-2">
            {analysis.suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-600">
        <button
          onClick={analyzeContent}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Search className="w-4 h-4" />
          Re-analyze
        </button>
        
        {onApplySuggestions && (
          <button
            onClick={() => onApplySuggestions(analysis.suggestions)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Apply Suggestions
          </button>
        )}
      </div>
    </div>
  );
};

export default SEOOptimizer;
