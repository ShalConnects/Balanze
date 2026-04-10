import React from 'react';
import { Info, ExternalLink, Mail, Globe, FileText, Shield, BookOpen, HelpCircle, FileCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AboutSettingsProps {
  hideTitle?: boolean;
}

interface ActionItemProps {
  title: string;
  subtitle: string;
  subtitleClassName?: string;
  className: string;
  iconClassName: string;
  icon: React.ReactNode;
  endIconClassName: string;
  onClick?: () => void;
  href?: string;
  external?: boolean;
}

interface LegalItemProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const ActionItem: React.FC<ActionItemProps> = ({ title, subtitle, subtitleClassName, className, iconClassName, icon, endIconClassName, onClick, href, external = false }) => {
  const content = (
    <>
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <div className={iconClassName}>{icon}</div>
        <div className="min-w-0 flex-1">
          <span className="text-sm sm:text-base text-gray-900 dark:text-white font-semibold block truncate">{title}</span>
          <span className={subtitleClassName ?? 'text-xs text-gray-600 dark:text-gray-400'}>{subtitle}</span>
        </div>
      </div>
      <ExternalLink className={endIconClassName} />
    </>
  );

  if (href) {
    return (
      <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} className={className}>
        {content}
      </a>
    );
  }

  return <button onClick={onClick} className={className}>{content}</button>;
};

const LegalItem: React.FC<LegalItemProps> = ({ label, icon, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all text-left group"
  >
    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
      {icon}
      <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium truncate">{label}</span>
    </div>
    <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
  </button>
);

export const AboutSettings: React.FC<AboutSettingsProps> = ({ hideTitle = false }) => {
  const navigate = useNavigate();

  const sectionTitleClassName = 'text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 sm:mb-3';
  const cardClassName = 'bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700';
  const listItemClassName = 'w-full flex items-center justify-between p-3 sm:p-3.5 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all text-left group';
  const emphasisItemClassName = 'w-full flex items-center justify-between p-3 sm:p-3.5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-700 rounded-lg hover:from-blue-100 hover:to-purple-100 dark:hover:from-gray-600 dark:hover:to-gray-600 transition-all text-left group';
  const legalItems = [
    { label: 'Privacy Policy', icon: <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />, onClick: () => navigate('/privacypolicy') },
    { label: 'Terms of Service', icon: <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />, onClick: () => navigate('/termsofservice') },
    { label: 'Refund Policy', icon: <FileCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />, onClick: () => navigate('/refundpolicy') }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {!hideTitle && (
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">About</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Learn more about Balanze and our team</p>
        </div>
      )}

      {/* App Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 sm:p-6 shadow-sm border border-blue-100 dark:border-gray-600">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-sm flex-shrink-0">
            <Info className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">Balanze</h3>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3">
              Your all-in-one personal finance platform. Track spending, manage budgets, set savings goals, and handle lending and borrowing—all in a secure, modern, and easy-to-use interface.
            </p>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">App Version:</span>
              <span>3.1</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
          Our Mission
        </h3>
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
          Our mission is to empower individuals and families to take control of their financial future. We believe everyone deserves access to powerful, intuitive tools that make managing money simple, transparent, and stress-free.
        </p>
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
          Balanze was created by a passionate team of developers, designers, and finance enthusiasts at{' '}
          <a 
            href="https://shalconnects.com/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors inline-flex items-center gap-1 break-words"
          >
            ShalConnects
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
          , focused on building practical products that help people make better financial decisions every day.
        </p>
      </div>

      <div className={cardClassName}>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">More Information</h3>
        
        <div className="mb-4 sm:mb-6">
          <h4 className={sectionTitleClassName}>Support & Help</h4>
          <div className="space-y-2">
            <ActionItem
              title="Help Center"
              subtitle="Get answers and tutorials"
              className={emphasisItemClassName}
              iconClassName="p-1.5 sm:p-2 bg-blue-600 dark:bg-blue-500 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0"
              icon={<HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />}
              endIconClassName="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0 ml-2"
              onClick={() => navigate('/help-center')}
            />
            <ActionItem
              title="About Balanze"
              subtitle="Learn more about our mission"
              className={listItemClassName}
              iconClassName="p-1.5 sm:p-2 bg-purple-600 dark:bg-purple-500 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0"
              icon={<Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />}
              endIconClassName="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex-shrink-0 ml-2"
              onClick={() => navigate('/about')}
            />
          </div>
        </div>

        <div className="mb-4 sm:mb-6">
          <h4 className={sectionTitleClassName}>Legal & Policies</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {legalItems.map((item) => (
              <LegalItem key={item.label} label={item.label} icon={item.icon} onClick={item.onClick} />
            ))}
          </div>
        </div>

        <div className="mb-4 sm:mb-6">
          <h4 className={sectionTitleClassName}>Contact</h4>
          <ActionItem
            title="Email Support"
            subtitle="hello@shalconnects.com"
            subtitleClassName="text-xs text-gray-600 dark:text-gray-400 break-all"
            className={emphasisItemClassName}
            iconClassName="p-1.5 sm:p-2 bg-blue-600 dark:bg-blue-500 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0"
            icon={<Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />}
            endIconClassName="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0 ml-2"
            href="mailto:hello@shalconnects.com"
          />
        </div>

        <div>
          <h4 className={sectionTitleClassName}>External Links</h4>
          <div className="space-y-2">
            <ActionItem
              title="ShalConnects"
              subtitle="Visit our parent company"
              className={listItemClassName}
              iconClassName="p-1.5 sm:p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0"
              icon={<Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />}
              endIconClassName="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0 ml-2"
              href="https://shalconnects.com/"
              external
            />
            <ActionItem
              title="Blog"
              subtitle="Read our latest articles"
              className={listItemClassName}
              iconClassName="p-1.5 sm:p-2 bg-green-600 dark:bg-green-500 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0"
              icon={<BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />}
              endIconClassName="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors flex-shrink-0 ml-2"
              onClick={() => navigate('/blog')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

