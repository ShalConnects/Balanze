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

const TermsOfService: React.FC = () => {
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
                  Balanze
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
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-8 text-center">Terms of Service</h1>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg mb-8 space-y-6">
              <div>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  <strong>Last Updated:</strong> November 14, 2025
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">By using Balanze Finance, you agree to these Terms of Service and our Privacy Policy. If you do not agree, please do not use the app.</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">2. Financial Services Disclosure</h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  <strong>IMPORTANT:</strong> Balanze Finance is a personal finance management application. We are <strong>NOT</strong> a bank, financial institution, or licensed financial advisor.
                </p>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  <strong>Services Provided:</strong>
                </p>
                <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                  <li>Personal finance tracking and management (you enter and track your own financial data)</li>
                  <li>Budget planning and tracking tools</li>
                  <li>Financial analytics and reporting based on your entered data</li>
                  <li>Savings goals tracking</li>
                  <li>Lend and borrow tracking</li>
                  <li>Purchase management and tracking</li>
                  <li>Premium subscription services (payment processing handled by third-party processors: Paddle, Stripe, or PayPal)</li>
                </ul>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  <strong>Limitations:</strong>
                </p>
                <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                  <li>We do not provide financial advice</li>
                  <li>We do not hold or manage your funds</li>
                  <li>We do not provide banking services</li>
                  <li>We are not a licensed financial institution</li>
                  <li>We do not provide investment advice</li>
                </ul>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  <strong>Your Responsibilities:</strong> You are responsible for verifying the accuracy of your financial information, making your own financial decisions, and complying with applicable financial regulations.
                </p>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  <strong>Disclaimer:</strong> We are not liable for any financial losses or damages resulting from your use of this application. Balanze Finance is a tool to help you manage your finances, but all financial decisions are your own.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">3. User Responsibilities</h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">You are responsible for:</p>
                <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Ensuring the accuracy of all financial information you enter into the application</li>
                  <li>Keeping your account information up to date</li>
                  <li>Notifying us immediately of any unauthorized use of your account</li>
                  <li>Complying with all applicable laws and regulations when using the application</li>
                  <li>Making your own financial decisions and verifying all financial information independently</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">4. Prohibited Activities</h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">You may not use Balanze Finance:</p>
                <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                  <li>For any unlawful purpose or in violation of any applicable laws or regulations</li>
                  <li>To harass, abuse, or harm other users or third parties</li>
                  <li>To attempt to gain unauthorized access to our systems, accounts, or data</li>
                  <li>To transmit any viruses, malware, or harmful code</li>
                  <li>To interfere with or disrupt the service or servers</li>
                  <li>To impersonate any person or entity or misrepresent your affiliation</li>
                  <li>To collect or store personal data about other users without permission</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">5. Customer Support</h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  We are committed to providing excellent customer support. Our support response times are as follows:
                </p>
                <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                  <li><strong>General Inquiries:</strong> We respond to all customer support inquiries within 3 business days</li>
                  <li><strong>Urgent Issues:</strong> For urgent support concerns (as determined by Google Play or critical app functionality issues), we respond within 24 hours</li>
                  <li><strong>Premium Subscriptions:</strong> For paid products or in-app transactions, we respond within 3 business days, and within 24 hours for urgent issues</li>
                </ul>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  You can contact our support team at <a href="mailto:hello@shalconnects.com" className="text-blue-600 hover:underline">hello@shalconnects.com</a>.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">6. Account Termination</h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  We reserve the right to suspend or terminate your account at any time if you violate these Terms of Service, engage in fraudulent activity, or for any other reason we deem necessary to protect our service or other users.
                </p>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  You may terminate your account at any time through your account settings. Upon termination, your access to the service will cease, and we will delete your data in accordance with our Privacy Policy.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">7. Refund Policy</h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">We offer a 14-day money-back guarantee for all Premium subscriptions. Refunds are processed within 3-5 business days. For detailed refund terms and conditions, please refer to our <a href="/refundpolicy" className="text-blue-600 hover:underline">Refund Policy</a>.</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">8. Intellectual Property</h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  All content, features, and functionality of Balanze Finance, including but not limited to text, graphics, logos, icons, and software, are owned by us or our licensors and are protected by copyright, trademark, and other intellectual property laws.
                </p>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  You may not copy, modify, distribute, sell, or lease any part of our service or included software, nor may you reverse engineer or attempt to extract the source code of that software, unless laws prohibit those restrictions or you have our written permission.
                </p>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  You retain ownership of any data you enter into the application. By using the service, you grant us a license to use, store, and process your data as necessary to provide the service, as described in our Privacy Policy.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">9. Changes to Terms</h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  We reserve the right to modify these Terms of Service at any time. We will notify you of any material changes by posting the new Terms of Service on this page and updating the "Last Updated" date.
                </p>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  Your continued use of the service after any changes constitutes your acceptance of the new Terms of Service. If you do not agree to the changes, you must stop using the service and may terminate your account.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">10. Disclaimer of Liability</h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  <strong>Service Availability:</strong> Balanze Finance is provided "as-is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free.
                </p>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  <strong>Data Accuracy:</strong> We do not guarantee the accuracy, completeness, or usefulness of any information you enter or that is calculated by the application. You are solely responsible for verifying the accuracy of all financial information you enter.
                </p>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  <strong>Limitation of Liability:</strong> To the maximum extent permitted by law, we are not liable for any direct, indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the application.
                </p>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  <strong>Financial Decisions:</strong> You use Balanze Finance at your own risk. All financial decisions are your own responsibility. We are not responsible for any financial losses, damages, or consequences resulting from your use of the application or any financial decisions you make based on information in the application.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">11. Governing Law</h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  These Terms of Service shall be governed by and construed in accordance with the laws of the jurisdiction in which we operate, without regard to its conflict of law provisions.
                </p>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  Any disputes arising from or relating to these Terms of Service or the service shall be resolved through good faith negotiations. If a dispute cannot be resolved through negotiation, it shall be subject to the exclusive jurisdiction of the courts in our jurisdiction.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">12. Contact Information</h2>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  <strong>Email:</strong> <a href="mailto:hello@shalconnects.com" className="text-blue-600 hover:underline">hello@shalconnects.com</a>
                </p>
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-8">
              <p className="text-center text-yellow-800 dark:text-yellow-200 font-medium">
                ⚠️ These terms may be updated from time to time. Please review them regularly.
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

export default TermsOfService; 

