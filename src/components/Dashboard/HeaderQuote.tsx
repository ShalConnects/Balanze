import React, { useState, useEffect } from 'react';

interface QuoteData {
  q: string;
  a: string;
}

export const HeaderQuote: React.FC = () => {
  const [quote, setQuote] = useState<QuoteData | null>(null);

  // Fallback quotes for when API fails
  const fallbackQuotes = [
    { q: "You already have every characteristic necessary for success if you recognize, claim, develop and use them.", a: "Zig Ziglar" },
    { q: "The best investment you can make is in yourself.", a: "Warren Buffett" },
    { q: "Financial freedom is a journey, not a destination.", a: "Unknown" },
    { q: "Success is not final, failure is not fatal: it is the courage to continue that counts.", a: "Winston Churchill" },
    { q: "The only way to do great work is to love what you do.", a: "Steve Jobs" },
    { q: "Every expert was once a beginner.", a: "Robert T. Kiyosaki" },
    { q: "Your financial future is created by what you do today.", a: "Unknown" },
    { q: "Small steps, big dreams, great results.", a: "Unknown" },
    { q: "The future belongs to those who believe in the beauty of their dreams.", a: "Eleanor Roosevelt" },
    { q: "Your attitude determines your altitude.", a: "Zig Ziglar" }
  ];

  const fetchQuote = async () => {
    try {
      const response = await fetch('https://zenquotes.io/api/random');
      
      if (!response.ok) {
        throw new Error('Failed to fetch quote');
      }
      
      const data = await response.json();
      
      if (data && data[0] && data[0].q) {
        setQuote({
          q: data[0].q,
          a: data[0].a || 'Unknown'
        });
      } else {
        throw new Error('Invalid quote data');
      }
    } catch (err) {

      // Use a random fallback quote
      const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
      setQuote(fallbackQuotes[randomIndex]);
    }
  };

  // Fetch quote on component mount
  useEffect(() => {
    fetchQuote();
  }, []);

  // Auto-refresh quote every 2 hours (less frequent than the main quote component)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchQuote();
    }, 2 * 60 * 60 * 1000); // 2 hours

    return () => clearInterval(interval);
  }, []);

  if (!quote) {
    return null; // Don't show anything while loading
  }

  return (
    <div className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mt-0.5 hidden xs:block italic overflow-hidden relative">
      <div className="animate-marquee whitespace-nowrap">
        {quote.q} - {quote.a}
      </div>
    </div>
  );
}; 

