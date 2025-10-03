import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resolveShortUrl } from '../utils/urlShortener';
import { supabase } from '../lib/supabase';

const ShortUrlRedirect: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const handleRedirect = async () => {
      if (!shortCode) {
        navigate('/');
        return;
      }

      try {
        // Resolve the short URL
        const originalUrl = await resolveShortUrl(shortCode);
        
        if (originalUrl) {
          // Update access count
          await supabase
            .from('url_shortener')
            .update({ access_count: supabase.raw('access_count + 1') })
            .eq('short_code', shortCode);
          
          // Redirect to the original URL
          window.location.href = originalUrl;
        } else {
          // Short URL not found or expired
          navigate('/404');
        }
      } catch (error) {
        console.error('Error resolving short URL:', error);
        navigate('/404');
      }
    };

    handleRedirect();
  }, [shortCode, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
      </div>
    </div>
  );
};

export default ShortUrlRedirect;
