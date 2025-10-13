// src/pages/KBRobotsPage.tsx
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { generateKBRobotsTxt } from '../lib/kbSitemap';

const KBRobotsPage: React.FC = () => {
  const [robotsTxt, setRobotsTxt] = useState<string>('');

  useEffect(() => {
    const robots = generateKBRobotsTxt();
    setRobotsTxt(robots);
  }, []);

  return (
    <>
      <Helmet>
        <title>KB Robots.txt - Balanze Help Center</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
        {robotsTxt}
      </div>
    </>
  );
};

export default KBRobotsPage;
