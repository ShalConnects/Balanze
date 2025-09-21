import React, { useState } from 'react';
import { toast } from 'sonner';
import { 
  LifeBuoy
} from 'lucide-react';
import ProductTour from '../components/ProductTour';
import KBSearch from '../components/KBSearch';
import { useAuthStore } from '../store/authStore';
import { useFinanceStore } from '../store/useFinanceStore';



const HelpAndSupport: React.FC = () => {
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState<string | null>(null);
  
  const { user } = useAuthStore();
  const { accounts, transactions } = useFinanceStore();



  const handleStartTour = (stepId: string) => {
    setTourStep(stepId);
    setShowTour(true);
  };

  const handleCloseTour = () => {
    setShowTour(false);
    setTourStep(null);
  };

  return (
    <div className="mb-12">

        {/* Enhanced KB Search */}
        <div className="mb-8">
          <KBSearch />
        </div>


        {/* Welcome Banner */}
        <div className="bg-gradient-primary rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <LifeBuoy className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">Welcome to the Help Center!</h1>
                <p className="text-blue-100">
                  Discover guides, tutorials, and tips to master Balanze. Can't find what you're looking for? 
                  <button 
                    onClick={() => window.open('mailto:support@balanze.com', '_blank')}
                    className="underline hover:text-white ml-1"
                  >
                    Contact our support team
                  </button>
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <div className="text-right">
                <div className="text-sm text-blue-100">Last updated</div>
                <div className="font-semibold">{new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Link - Only show in development */}
        {import.meta.env.DEV && (
          <div className="mb-6">
            <a 
              href="/admin" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium"
            >
              🛠️ Admin Panel (Dev Only)
            </a>
          </div>
        )}

        {/* Product Tour Component */}
        {showTour && (
          <ProductTour
            stepToStart={tourStep}
            isOpen={showTour}
            onClose={handleCloseTour}
          />
        )}
    </div>
  );
};

export default HelpAndSupport; 