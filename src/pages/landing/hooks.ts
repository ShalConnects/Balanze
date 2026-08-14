import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { BillingCycle, PREMIUM_CHECKOUT_FEATURES } from '../../constants/planCatalog';

export const scrollToId = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

const isAndroid = () => /Android/i.test(navigator.userAgent);

/** Active scroller: mobile CSS pins body and scrolls #root instead of window. */
export const getScrollRoot = (): Window | HTMLElement => {
  const root = document.getElementById('root');
  if (root) {
    const { overflowY } = getComputedStyle(root);
    if (
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
      root.scrollHeight > root.clientHeight + 1
    ) {
      return root;
    }
  }
  if (isAndroid()) return document.getElementById('root') ?? window;
  return window;
};

export const scrollPageToTop = () => {
  getScrollRoot().scrollTo({ top: 0, behavior: 'smooth' });
};

export function useLandingChrome() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    document.body.style.fontFamily = 'Manrope, sans-serif';
    if (window.Capacitor !== undefined && isAndroid()) {
      document.body.classList.add('capacitor-android');
    }

    const root = getScrollRoot();
    const android = isAndroid();
    const onScroll = () => {
      const y = root instanceof Window ? root.scrollY : root.scrollTop;
      setShowBackToTop(y > 300);
    };

    root.addEventListener('scroll', onScroll, { passive: true });

    const docRoot = document.getElementById('root');
    if (android) {
      document.body.style.height = '100vh';
      document.body.style.position = 'fixed';
      document.body.style.overflow = 'hidden';
      document.body.style.width = '100%';
      if (docRoot) {
        docRoot.style.height = '100vh';
        docRoot.style.overflowY = 'auto';
        docRoot.style.overflowX = 'hidden';
      }
    }

    return () => {
      root.removeEventListener('scroll', onScroll);
      document.body.style.fontFamily = '';
      if (android) {
        document.body.style.height = '';
        document.body.style.position = '';
        document.body.style.overflow = '';
        document.body.style.width = '';
        if (docRoot) {
          docRoot.style.height = '';
          docRoot.style.overflowY = '';
          docRoot.style.overflowX = '';
        }
      }
    };
  }, []);

  return { showBackToTop };
}

type PaymentModal = {
  isOpen: boolean;
  planId: string;
  planName: string;
  price: number;
  billingCycle: BillingCycle;
  features: string[];
};

const closedModal: PaymentModal = {
  isOpen: false,
  planId: '',
  planName: '',
  price: 0,
  billingCycle: 'monthly',
  features: [],
};

export function usePremiumCheckout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [paymentModal, setPaymentModal] = useState<PaymentModal>(closedModal);

  const openPremium = useCallback(
    (cycle: BillingCycle) => {
      const planId = cycle === 'one-time' ? 'premium_lifetime' : 'premium_monthly';
      const price = cycle === 'one-time' ? 199.99 : 7.99;
      const planName = 'Premium';

      if (!user) {
        localStorage.setItem(
          'premiumIntent',
          JSON.stringify({ planId, planName, price, billingCycle: cycle, timestamp: Date.now() })
        );
        navigate('/auth');
        return;
      }

      setPaymentModal({
        isOpen: true,
        planId,
        planName,
        price,
        billingCycle: cycle,
        features: [...PREMIUM_CHECKOUT_FEATURES],
      });
    },
    [navigate, user]
  );

  const closePayment = useCallback(
    () => setPaymentModal((prev) => ({ ...prev, isOpen: false })),
    []
  );

  return { paymentModal, openPremium, closePayment };
}
