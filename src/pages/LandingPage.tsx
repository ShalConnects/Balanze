import React from 'react';
import { ArrowUp, Moon, Sun } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Footer } from '../components/Layout/Footer';
import { PaddlePaymentModal } from '../components/common/PaddlePaymentModal';
import { useThemeStore } from '../store/themeStore';
import { SEO } from './landing/content';
import { scrollPageToTop, useLandingChrome, usePremiumCheckout } from './landing/hooks';
import {
  LandingFaq,
  LandingHero,
  LandingHeroShot,
  LandingLastWish,
  LandingNav,
  LandingOutcomes,
  LandingPricing,
  LandingProduct,
  LandingProof,
} from './landing/sections';

const LandingPage: React.FC = () => {
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { showBackToTop } = useLandingChrome();
  const { paymentModal, openPremium, closePayment } = usePremiumCheckout();
  const fabBottom = 'max(6.25rem, calc(6.25rem + env(safe-area-inset-bottom, 0px)))';
  const topBottom = 'max(10rem, calc(10rem + env(safe-area-inset-bottom, 0px)))';

  return (
    <>
      <Helmet>
        <meta name="description" content={SEO.description} />
        <link rel="canonical" href={SEO.url} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SEO.url} />
        <meta property="og:title" content={SEO.title} />
        <meta property="og:description" content={SEO.description} />
        <meta property="og:image" content={SEO.image} />
        <meta property="og:site_name" content="Balanze Finance" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SEO.title} />
        <meta name="twitter:description" content={SEO.description} />
        <meta name="twitter:image" content={SEO.image} />
      </Helmet>

      <div className="relative min-h-screen full-height-mobile landing-page-mobile">
        <div className="relative z-10">
          <LandingNav />
          <main>
            <LandingHero />
            <LandingHeroShot />
            <LandingProof />
            <LandingOutcomes />
            <LandingProduct />
            <LandingLastWish />
            <LandingPricing onPremium={openPremium} />
            <LandingFaq />
            <div className="landing-page-safe-bottom">
              <Footer />
            </div>
          </main>

          <button
            type="button"
            onClick={toggleTheme}
            className="fixed right-8 z-50 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-3 rounded-full shadow-lg border border-gray-200 dark:border-gray-600"
            style={{ bottom: fabBottom }}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>

          {showBackToTop && (
            <button
              type="button"
              onClick={scrollPageToTop}
              className="fixed right-8 z-50 bg-gradient-primary text-white p-3 rounded-full shadow-lg"
              style={{ bottom: topBottom }}
              aria-label="Back to top"
            >
              <ArrowUp className="w-6 h-6" />
            </button>
          )}

          <PaddlePaymentModal
            isOpen={paymentModal.isOpen}
            onClose={closePayment}
            planId={paymentModal.planId}
            planName={paymentModal.planName}
            price={paymentModal.price}
            billingCycle={paymentModal.billingCycle}
            features={paymentModal.features}
          />
        </div>
      </div>
    </>
  );
};

export default LandingPage;
