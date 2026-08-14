import React, { useState } from 'react';
import { ArrowRight, Check, ChevronDown, ChevronUp, Download, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { THEME_BRAND_GRADIENT_TEXT_CLASS } from '../../constants/appThemeClasses';
import {
  FAQS,
  NAV_LINKS,
  OUTCOMES,
  PLAY_STORE_URL,
  PRODUCT_HUNT_BADGE,
  PRODUCT_HUNT_URL,
  PRODUCT_SHOTS,
  HERO_SHOT,
  PROOF_ITEMS,
} from './content';
import { scrollToId } from './hooks';
import {
  BrandMark,
  GhostButton,
  PrimaryButton,
  Section,
  SectionHeader,
  ProductPreviewFrame,
} from './ui';
import { LandingPricing } from './PricingSection';
import { LandingLastWish } from './LastWishSection';

export { LandingPricing, LandingLastWish };

export const LandingNav: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();

  const go = (link: (typeof NAV_LINKS)[number]) => {
    if ('id' in link) scrollToId(link.id);
    else navigate(link.path);
    setOpen(false);
  };

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <BrandMark />
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => go(link)}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
              >
                {link.label}
              </button>
            ))}
            {user ? (
              <button
                type="button"
                onClick={() => signOut()}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold"
              >
                Logout
              </button>
            ) : (
              <PrimaryButton className="px-4 py-2 text-sm shadow-none" onClick={() => navigate('/auth')}>
                Sign In
              </PrimaryButton>
            )}
          </div>
          <div className="md:hidden flex items-center gap-3">
            {!user && (
              <PrimaryButton className="px-3 py-2 text-sm shadow-none" onClick={() => navigate('/auth')}>
                Sign In
              </PrimaryButton>
            )}
            <button
              type="button"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="text-gray-600 dark:text-gray-300"
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-2 space-y-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => go(link)}
                className="block w-full text-left px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
              >
                {link.label}
              </button>
            ))}
            {user && (
              <button
                type="button"
                onClick={() => signOut()}
                className="block w-full text-left px-3 py-2 text-red-600 rounded-md"
              >
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export const LandingHero: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <section className="relative flex flex-col justify-end pt-24 pb-8 min-h-[58svh] landing-page-safe-top bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center landing-fade-in">
          <div className="flex justify-center mb-6">
            <BrandMark size="lg" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
            One place for spending, loans, and savings —{' '}
            <span className={THEME_BRAND_GRADIENT_TEXT_CLASS}>across currencies</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Free to start. Works on web and Android. Clear limits, no fake promises.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            {user ? (
              <PrimaryButton onClick={() => navigate('/')}>
                Go to Dashboard <ArrowRight className="w-5 h-5" />
              </PrimaryButton>
            ) : (
              <>
                <PrimaryButton onClick={() => navigate('/auth')}>
                  Start free <ArrowRight className="w-5 h-5" />
                </PrimaryButton>
                <GhostButton onClick={() => scrollToId('pricing')}>See pricing</GhostButton>
              </>
            )}
          </div>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            No card required to start
          </p>
        </div>
      </div>
    </section>
  );
};

export const LandingHeroShot: React.FC = () => (
  <section
    className="bg-gradient-to-b from-purple-50/40 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-6 sm:py-10"
    aria-label="Product preview"
  >
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl landing-fade-in">
        <ProductPreviewFrame src={HERO_SHOT.src} alt={HERO_SHOT.alt} priority />
      </div>
    </div>
  </section>
);

export const LandingProof: React.FC = () => (
  <Section className="!py-10 border-y border-gray-200/80 dark:border-gray-700/80 bg-white/60 dark:bg-gray-900/40">
    <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3">
      {PROOF_ITEMS.map((item) => (
        <li key={item} className="flex items-center gap-2 text-sm md:text-base text-gray-700 dark:text-gray-300">
          <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          {item}
        </li>
      ))}
    </ul>
    <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
      <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
        <Download className="w-4 h-4" /> Google Play
      </a>
      <a href={PRODUCT_HUNT_URL} target="_blank" rel="noopener noreferrer" className="inline-block opacity-90 hover:opacity-100 transition-opacity">
        <img src={PRODUCT_HUNT_BADGE} alt="Balanze on Product Hunt" width={200} height={43} loading="lazy" />
      </a>
    </div>
  </Section>
);

export const LandingOutcomes: React.FC = () => (
  <Section id="outcomes">
    <SectionHeader
      title="What Balanze helps with"
      subtitle="Spending, loans, and savings — especially if you use more than one currency."
    />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      {OUTCOMES.map(({ icon: Icon, title, description }) => (
        <div key={title} className="text-center md:text-left">
          <div className="w-12 h-12 mx-auto md:mx-0 mb-4 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-gray-600 dark:text-gray-300">{description}</p>
        </div>
      ))}
    </div>
  </Section>
);

export const LandingProduct: React.FC = () => (
  <Section className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
    <SectionHeader title="Screenshots" subtitle="Same UI you get after sign-up." />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {PRODUCT_SHOTS.map((shot, i) => (
        <figure key={shot.src} className="landing-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-lg mb-4">
            <img
              src={shot.src}
              alt={shot.alt}
              className="w-full h-48 object-contain rounded-md"
              loading="lazy"
              decoding="async"
            />
          </div>
          <figcaption>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{shot.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{shot.caption}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  </Section>
);

export const LandingFaq: React.FC = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <Section className="bg-gray-50 dark:bg-gray-800/80">
      <SectionHeader title="Frequently asked questions" />
      <div className="max-w-2xl mx-auto space-y-3">
        {FAQS.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div key={faq.question} className="bg-white dark:bg-gray-700 rounded-lg shadow-sm">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-3"
              >
                <span className="font-semibold text-gray-900 dark:text-white">{faq.question}</span>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-gray-500 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
                )}
              </button>
              {isOpen && <p className="px-5 pb-4 text-gray-600 dark:text-gray-300">{faq.answer}</p>}
            </div>
          );
        })}
      </div>
    </Section>
  );
};
