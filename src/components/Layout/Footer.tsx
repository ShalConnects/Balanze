import React from 'react';
import { Mail, Heart, Facebook, Twitter, Instagram, Linkedin, Github } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <h3 className="text-2xl font-bold">Balanze</h3>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Take control of your financial future with our comprehensive personal finance platform.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li><a href="/about" className="text-gray-400 hover:text-white transition-colors">About</a></li>
              <li><a href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
              <li><a href="/help-center" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
              <li><a href="/privacypolicy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/refundpolicy" className="text-gray-400 hover:text-white transition-colors">Refund Policy</a></li>
              <li><a href="/termsofservice" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 Balanze. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a href="mailto:hello@shalconnects.com" className="text-gray-400 hover:text-white transition-colors text-sm">
                <Mail className="w-4 h-4 inline mr-2" />
                hello@shalconnects.com
              </a>
            </div>
          </div>
          <div className="text-center mt-4">
            <p className="text-gray-400 text-sm">
              Made with <Heart className="w-4 h-4 inline text-red-500" /> by{' '}
              <a 
                href="https://shalconnects.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                ShalConnects
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
