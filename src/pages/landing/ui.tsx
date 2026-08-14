import React from 'react';
import { Check } from 'lucide-react';
import { THEME_BRAND_GRADIENT_TEXT_CLASS } from '../../constants/appThemeClasses';

export const BrandMark: React.FC<{ size?: 'sm' | 'lg' }> = ({ size = 'sm' }) => (
  <div className="flex items-center gap-2">
    <div
      className={`${size === 'lg' ? 'w-12 h-12 text-2xl' : 'w-8 h-8 text-lg'} bg-gradient-primary rounded-lg flex items-center justify-center text-white font-bold`}
    >
      B
    </div>
    <span className={`${size === 'lg' ? 'text-5xl md:text-7xl' : 'text-2xl'} font-bold ${THEME_BRAND_GRADIENT_TEXT_CLASS}`}>
      Balanze
    </span>
  </div>
);

export const PrimaryButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'brand' | 'solid' }
> = ({ className = '', variant = 'brand', children, ...props }) => (
  <button
    type="button"
    className={`inline-flex items-center justify-center gap-2 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg disabled:opacity-50 ${
      variant === 'brand'
        ? 'bg-gradient-primary hover:bg-gradient-primary-hover'
        : 'bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600'
    } ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const GhostButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <button
    type="button"
    className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-500 dark:hover:border-blue-400 transition-colors ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const Section: React.FC<{
  id?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ id, className = '', children }) => (
  <section id={id} className={`py-16 md:py-24 ${className}`}>
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
  </section>
);

export const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({
  title,
  subtitle,
}) => (
  <div className="text-center max-w-2xl mx-auto mb-12">
    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">{title}</h2>
    {subtitle && <p className="text-lg text-gray-600 dark:text-gray-300">{subtitle}</p>}
  </div>
);

export const ProductPreviewFrame: React.FC<{
  src: string;
  alt: string;
  priority?: boolean;
}> = ({ src, alt, priority }) => (
  <div className="relative">
    <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-primary blur-3xl opacity-20" />
    <div className="relative overflow-hidden rounded-xl border border-white/40 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
      <img
        src={src}
        alt={alt}
        className="w-full h-auto object-cover object-top"
        width={1643}
        height={1060}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
      />
    </div>
  </div>
);

export const HighlightList: React.FC<{
  items: readonly string[];
  variant?: 'free' | 'premium';
}> = ({ items, variant = 'free' }) => (
  <ul className="space-y-2 flex-1">
    {items.map((text) => (
      <li
        key={text}
        className={`flex items-start gap-2 text-sm ${
          variant === 'premium' ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        {text}
      </li>
    ))}
  </ul>
);
