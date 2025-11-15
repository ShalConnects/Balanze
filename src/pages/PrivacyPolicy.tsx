import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Wallet, Target, Handshake, PiggyBank, Bell, Shield, Heart,
  Check, ChevronDown, ChevronUp, Star, ArrowRight, BarChart3, PieChart,
  Users, Globe, Mail, Phone, Facebook, Twitter, Instagram, Linkedin, Github, ArrowUp, Moon, Sun, LogOut, Menu, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InteractiveBackground from '../components/InteractiveBackground';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { Footer } from '../components/Layout/Footer';

const PrivacyPolicy: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { user, signOut } = useAuthStore();

  useEffect(() => {
    // Set Manrope font for the whole page
    document.body.style.fontFamily = 'Manrope, sans-serif';
    return () => {
      window.removeEventListener('scroll', () => {});
      document.body.style.fontFamily = '';
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <InteractiveBackground />
      
      <div className="relative z-10">
        {/* Navigation Header */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Balanze Finance
                </h1>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <button
                  className="bg-transparent text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                  onClick={() => navigate('/about')}
                >
                  About
                </button>
                <button
                  className="bg-transparent text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                  onClick={() => navigate('/blog')}
                >
                  Blog
                </button>
                {user ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Welcome, {user.email}
                    </span>
                    <button 
                      onClick={() => signOut()}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => navigate('/auth')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-semibold"
                  >
                    Sign In
                  </button>
                )}
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden flex items-center space-x-4">
                {user ? (
                  <button 
                    onClick={() => signOut()}
                    className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm flex items-center space-x-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate('/auth')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-semibold text-sm"
                  >
                    Sign In
                  </button>
                )}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
                <div className="px-2 pt-2 pb-3 space-y-1">
                  <button
                    className="block w-full text-left px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                    onClick={() => {
                      navigate('/about');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    About
                  </button>
                  <button
                    className="block w-full text-left px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                    onClick={() => {
                      navigate('/blog');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Blog
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Main Content */}
        <div className="pt-16 bg-white dark:bg-gray-900 scroll-smooth font-manrope">
          <div className="w-4/5 mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-8 text-center">Privacy Policy</h1>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg mb-8 space-y-6">
              <div>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  <strong>Last Updated:</strong> November 14, 2025
                </p>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  This Privacy Policy describes how Balanze Finance ("we", "our", or "us") collects, uses, and protects your personal information when you use our personal finance management application.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">1. Data Collection</h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  We collect only the information necessary to provide you with a secure and personalized finance experience. This includes:
                </p>
                <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                  <li><strong>Account Information:</strong> Your name, email address, and authentication credentials</li>
                  <li><strong>Financial Data:</strong> Account information you enter, transaction records, budgets, savings goals, and investment tracking data</li>
                  <li><strong>Usage Data:</strong> Information about how you interact with our app, including features used and time spent</li>
                  <li><strong>Device Information:</strong> Device type, operating system, and app version for technical support</li>
                  <li><strong>Payment Information:</strong> Payment method details for premium subscriptions (processed securely by third-party payment processors: Paddle, Stripe, or PayPal)</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">2. Data Usage</h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  Your data is used solely to deliver and improve Balanze Finance's features. We use your information to:
                </p>
                <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                  <li>Provide and maintain our financial management services</li>
                  <li>Track and organize your financial transactions and account information</li>
                  <li>Calculate and update account balances based on your transactions</li>
                  <li>Send you important updates and notifications about your account</li>
                  <li>Improve our services through analytics and error tracking</li>
                  <li>Respond to your support requests</li>
                </ul>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  <strong>We do not sell or share your personal information with third parties for marketing purposes.</strong>
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">3. Third-Party Services</h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  We use the following third-party services to provide and improve our service:
                </p>
                <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                  <li><strong>Supabase</strong> (supabase.com) - Database, authentication, and data storage. Privacy Policy: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://supabase.com/privacy</a></li>
                  <li><strong>Sentry</strong> (sentry.io) - Error tracking and performance monitoring. Privacy Policy: <a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://sentry.io/privacy/</a></li>
                  <li><strong>Vercel Analytics</strong> (vercel.com) - Usage analytics and performance monitoring. Privacy Policy: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://vercel.com/legal/privacy-policy</a></li>
                  <li><strong>Payment Processors:</strong> Paddle, Stripe, and PayPal for processing payments. Payment information is handled directly by these processors according to their privacy policies.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">4. Data Security</h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  We use industry-standard encryption and security practices to protect your data:
                </p>
                <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                  <li><strong>Encryption in Transit:</strong> All data transmitted between your device and our servers is encrypted using TLS/SSL protocols</li>
                  <li><strong>Encryption at Rest:</strong> Your data is stored securely using encryption at rest through our database provider (Supabase)</li>
                  <li><strong>Access Controls:</strong> Access to your data is controlled through Row Level Security (RLS) policies, ensuring only you can access your own data</li>
                  <li><strong>Security Updates:</strong> We regularly update our security practices and dependencies to protect your data</li>
                  <li><strong>Secure Authentication:</strong> We use secure authentication methods provided by Supabase to protect your account</li>
                </ul>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  While we implement industry-standard security measures, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security but are committed to protecting your data.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">5. Data Retention</h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  We retain your personal data for as long as your account is active or as needed to provide services. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it for legal purposes (such as tax records or dispute resolution).
                </p>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  Backup data may be retained for up to 90 days after account deletion for disaster recovery purposes, after which it will be permanently deleted.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">6. Cookies and Tracking Technologies</h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  We use cookies and similar technologies to:
                </p>
                <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                  <li>Maintain your login session (through Supabase authentication)</li>
                  <li>Remember your preferences and settings (stored locally in your browser)</li>
                  <li>Analyze app usage through Vercel Analytics (anonymized data)</li>
                  <li>Track errors and performance issues through Sentry (no personal financial data)</li>
                </ul>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  You can control cookies through your browser settings, but this may affect app functionality. We do not use cookies for advertising purposes, and we do not share cookie data with third parties for marketing.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">7. International Data Transfers</h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  Your data may be stored and processed in servers located outside your country. We use Supabase, which may store data in various regions. By using our service, you consent to the transfer of your data to these locations.
                </p>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  We ensure appropriate safeguards are in place to protect your data in accordance with applicable data protection laws, including the European Commission's Standard Contractual Clauses where applicable.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">8. User Rights</h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  You have the following rights regarding your personal data:
                </p>
                <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                  <li><strong>Access:</strong> You can access your personal data at any time through your account settings in the app</li>
                  <li><strong>Correction:</strong> You can update or correct your personal data through your account settings</li>
                  <li><strong>Deletion:</strong> You can delete your account and all associated data at any time through your account settings</li>
                  <li><strong>Data Portability:</strong> You can export your financial data in CSV, PDF, or JSON format through the account management section</li>
                  <li><strong>Objection:</strong> You can object to certain processing of your data</li>
                  <li><strong>Withdrawal of Consent:</strong> You can withdraw consent for data processing at any time</li>
                </ul>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  To exercise any of these rights, please contact us at <a href="mailto:hello@shalconnects.com" className="text-blue-600 hover:underline">hello@shalconnects.com</a>. We will respond to your request within 30 days.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">9. Children's Privacy (COPPA)</h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  Balanze Finance is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately at <a href="mailto:hello@shalconnects.com" className="text-blue-600 hover:underline">hello@shalconnects.com</a>, and we will delete such information promptly.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">10. GDPR Compliance (European Users)</h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  If you are located in the European Economic Area (EEA), you have additional rights under the General Data Protection Regulation (GDPR):
                </p>
                <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                  <li>Right to be informed about data collection and use</li>
                  <li>Right of access to your personal data</li>
                  <li>Right to rectification of inaccurate data</li>
                  <li>Right to erasure ("right to be forgotten")</li>
                  <li>Right to restrict processing</li>
                  <li>Right to data portability</li>
                  <li>Right to object to processing</li>
                  <li>Rights related to automated decision-making</li>
                </ul>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  We process your data based on legitimate interests, contract performance, and your consent. You can withdraw consent at any time.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">11. Contact Us</h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us at:
                </p>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  <strong>Email:</strong> <a href="mailto:hello@shalconnects.com" className="text-blue-600 hover:underline">hello@shalconnects.com</a>
                </p>
              </div>
      </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-8">
              <p className="text-center text-yellow-800 dark:text-yellow-200 font-medium">
                ⚠️ This policy may be updated from time to time. Please review it regularly.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />

        {/* Dark Mode Toggle Button - Always Visible */}
        <button
          onClick={toggleTheme}
          className="fixed bottom-8 right-8 z-50 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-600"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? (
            <Sun className="w-6 h-6" />
          ) : (
            <Moon className="w-6 h-6" />
          )}
        </button>
    </div>
  </div>
);
};

export default PrivacyPolicy; 

