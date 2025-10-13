// src/pages/KBSitemapPage.tsx
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { generateKBSitemapXML, generateKBSitemapEntries } from '../lib/kbSitemap';

const KBSitemapPage: React.FC = () => {
  const [sitemapXML, setSitemapXML] = useState<string>('');
  const [sitemapEntries, setSitemapEntries] = useState<any[]>([]);

  useEffect(() => {
    const xml = generateKBSitemapXML();
    const entries = generateKBSitemapEntries();
    setSitemapXML(xml);
    setSitemapEntries(entries);
  }, []);

  // Return XML sitemap
  return (
    <>
      <Helmet>
        <title>KB Sitemap - Balanze Help Center</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
        {sitemapXML}
      </div>
    </>
  );
};

export default KBSitemapPage;
