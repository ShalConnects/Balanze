import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { toast } from 'sonner';
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  Trash2,
  Plus,
  Eye,
  Mail,
  User,
  Check,
  RotateCw,
  X,
  Wallet,
  Handshake,
  MessageSquare,
  FileText
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useMobileDetection } from '../../hooks/useMobileDetection';

interface LWProps {
  setActiveTab?: (tab: string) => void;
  forceFreeAccess?: boolean;
}

interface LWSettings {
  isEnabled: boolean;
  checkInFrequency: number;
  lastCheckIn: string | null;
  recipients: Array<{
    id: string;
    email: string;
    name: string;
    relationship: string;
  }>;
  includeData: {
    accounts: boolean;
    transactions: boolean;
    purchases: boolean;
    lendBorrow: boolean;
    savings: boolean;
    analytics: boolean;
  };
  message: string;
  isActive: boolean;
  deliveryTriggered?: boolean;
}

export const LW: React.FC<LWProps> = () => {
  const { user, profile } = useAuthStore();
  const { accounts, transactions, purchases, savingsGoals } = useFinanceStore();
  
  // Check if user has Premium plan for Last Wish
  const isPremium = profile?.subscription?.plan === 'premium';
  const [lendBorrowRecords, setLendBorrowRecords] = useState<any[]>([]);
  const [settings, setSettings] = useState<LWSettings>({
    isEnabled: false,
    checkInFrequency: 30,
    lastCheckIn: null,
    recipients: [],
    includeData: {
      accounts: true,
      transactions: true,
      purchases: true,
      lendBorrow: true,
      savings: true,
      analytics: true,
    },
    message: '',
    isActive: false,
    deliveryTriggered: false,
  });
  const [loading, setLoading] = useState(false);
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [daysUntilCheckIn, setDaysUntilCheckIn] = useState<number | null>(null);
  const [timeUntilCheckIn, setTimeUntilCheckIn] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const messageEditorRef = useRef<HTMLDivElement>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [selectedFontSize, setSelectedFontSize] = useState('14');
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  const [useSimpleEditor, setUseSimpleEditor] = useState(true); // Default to simple on mobile
  const [simpleText, setSimpleText] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [deliveryData, setDeliveryData] = useState<{
    deliveredAt: string;
    recipients: Array<{ email: string; status: string }>;
    deliveryCount: number;
  } | null>(null);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const { isMobile: isMobileDevice } = useMobileDetection();

  // Mobile detection with touch support
  useEffect(() => {
    const checkMobile = () => {
      const isMobileWidth = window.innerWidth < 768;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(isMobileWidth || isTouchDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize rich editor content when switching from simple to rich
  useEffect(() => {
    if (!useSimpleEditor && messageEditorRef.current && simpleText) {
      // Convert simple text to HTML when switching to rich editor
      const htmlContent = simpleText.replace(/\n/g, '<br>');
      messageEditorRef.current.innerHTML = htmlContent;
      setSettings(prev => ({ ...prev, message: htmlContent }));
    }
  }, [useSimpleEditor, simpleText]);

  // Sync rich editor content with settings when settings change
  useEffect(() => {
    if (!useSimpleEditor && messageEditorRef.current && settings.message) {
      // Only update if the content is different to avoid infinite loops
      if (messageEditorRef.current.innerHTML !== settings.message) {
        messageEditorRef.current.innerHTML = settings.message;
      }
    }
  }, [settings.message, useSimpleEditor]);

  // Message editor functions
  const formatText = (command: string, value?: string) => {
    if (messageEditorRef.current) {
      document.execCommand(command, false, value);
      messageEditorRef.current.focus();
    }
  };



  const handleMessageInput = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML;
    setSettings(prev => ({ ...prev, message: content }));
    setSaveStatus('unsaved');
    
    // Auto-save after 2 seconds of no typing
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saving');
      // Simulate save
      setTimeout(() => {
        setSaveStatus('saved');
      }, 500);
    }, 2000);
  };

  const handleMessageBlur = () => {
    // Save on blur
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
    }, 500);
  };

  const handleMessageFocus = () => {
    // Focus handling if needed
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          formatText('bold');
          break;
        case 'i':
          e.preventDefault();
          formatText('italic');
          break;
        case 'u':
          e.preventDefault();
          formatText('underline');
          break;
      }
    }
  };

  const insertTemplate = (templateType: string) => {
    
    const templates = {
      personal: {
        html: `<h2>My Personal Message</h2>
<p>Dear loved ones,</p>
<p>This is my final message to you...</p>
<ul>
  <li>Important memories I want to share</li>
  <li>Words of wisdom and love</li>
  <li>Final wishes and thoughts</li>
</ul>
<p>With all my love,<br>Your name</p>`,
        text: `My Personal Message

Dear loved ones,

This is my final message to you...

• Important memories I want to share
• Words of wisdom and love
• Final wishes and thoughts

With all my love,
Your name`
      },
      financial: {
        html: `<h2>Financial Information</h2>
<p>Important financial details and instructions:</p>
<ul>
  <li>Bank account information</li>
  <li>Investment details</li>
  <li>Insurance policies</li>
  <li>Property information</li>
</ul>
<p><strong>Note:</strong> Please consult with a financial advisor for detailed guidance.</p>`,
        text: `Financial Information

Important financial details and instructions:

• Bank account information
• Investment details
• Insurance policies
• Property information

Note: Please consult with a financial advisor for detailed guidance.`
      },
      memories: {
        html: `<h2>Life Story & Memories</h2>
<p>I want to share some of my most cherished memories with you:</p>
<ul>
  <li>Childhood memories and family stories</li>
  <li>Important life lessons learned</li>
  <li>Special moments we shared together</li>
  <li>My hopes and dreams for your future</li>
</ul>
<p>These memories are my gift to you.</p>`,
        text: `Life Story & Memories

I want to share some of my most cherished memories with you:

• Childhood memories and family stories
• Important life lessons learned
• Special moments we shared together
• My hopes and dreams for your future

These memories are my gift to you.`
      }
    };

    const template = templates[templateType as keyof typeof templates];
    if (template) {
      if (useSimpleEditor) {
        setSimpleText(template.text);
        setSettings(prev => ({ ...prev, message: template.text }));
      } else {
        // For rich editor, set the HTML content
        if (messageEditorRef.current) {
          messageEditorRef.current.innerHTML = template.html;
          setSettings(prev => ({ ...prev, message: template.html }));
          // Focus the editor after template insertion
          messageEditorRef.current.focus();
        } else {
          // Fallback: set the HTML content directly in settings
          setSettings(prev => ({ ...prev, message: template.html }));
          // Try to find the editor element by class or ID
          const editorElement = document.querySelector('.rich-editor') as HTMLDivElement;
          if (editorElement) {
            editorElement.innerHTML = template.html;
            editorElement.focus();
          }
        }
      }
      setSaveStatus('unsaved');
      
      // Show success message
      toast.success('Template inserted successfully!');
      
      // Auto-save after template insertion
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        setSaveStatus('saving');
        setTimeout(() => {
          setSaveStatus('saved');
        }, 500);
      }, 1000);
    }
  };

  const toggleEditorMode = () => {
    if (useSimpleEditor) {
      // Switching from simple to rich editor
      if (messageEditorRef.current) {
        messageEditorRef.current.innerHTML = simpleText.replace(/\n/g, '<br>');
        setSettings(prev => ({ ...prev, message: simpleText.replace(/\n/g, '<br>') }));
      }
    } else {
      // Switching from rich to simple editor
      const htmlContent = messageEditorRef.current?.innerHTML || '';
      const textContent = htmlContent
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<p[^>]*>/gi, '')
        .replace(/<\/p>/gi, '\n')
        .replace(/<h[1-6][^>]*>/gi, '')
        .replace(/<\/h[1-6]>/gi, '\n')
        .replace(/<ul[^>]*>/gi, '')
        .replace(/<\/ul>/gi, '\n')
        .replace(/<li[^>]*>/gi, '• ')
        .replace(/<\/li>/gi, '\n')
        .replace(/<strong[^>]*>/gi, '')
        .replace(/<\/strong>/gi, '')
        .replace(/<em[^>]*>/gi, '')
        .replace(/<\/em>/gi, '')
        .replace(/<u[^>]*>/gi, '')
        .replace(/<\/u>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/\n\s*\n/g, '\n')
        .trim();
      setSimpleText(textContent);
      setSettings(prev => ({ ...prev, message: textContent }));
    }
    setUseSimpleEditor(!useSimpleEditor);
    setSaveStatus('unsaved');
  };

  const handleSimpleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setSimpleText(content);
    setSettings(prev => ({ ...prev, message: content }));
    setSaveStatus('unsaved');
    
    // Auto-save after 2 seconds of no typing
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saving');
      // Simulate save
      setTimeout(() => {
        setSaveStatus('saved');
      }, 500);
    }, 2000);
  };

  // Data summary for preview
  const getDataSummary = () => {
    return {
      accounts: accounts.length,
      transactions: transactions.length,
      purchases: purchases.length,
      lendBorrow: lendBorrowRecords.length,
      savings: savingsGoals.length,
      analytics: 1, // Analytics is always available (we can generate reports)
      totalValue: accounts.reduce((sum, acc) => sum + (acc.calculated_balance || 0), 0),
    };
  };

  const dataSummary = getDataSummary();

  // Load settings from database
  useEffect(() => {
    loadLWSettings();
  }, [user]);

  // Load lend/borrow records
  useEffect(() => {
    if (!user) return;

    const fetchLendBorrowRecords = async () => {
      try {
        const { data, error } = await supabase
          .from('lend_borrow')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) throw error;
        setLendBorrowRecords(data || []);
      } catch (error) {

        setLendBorrowRecords([]);
      }
    };

    fetchLendBorrowRecords();
  }, [user]);

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Close templates dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.templates-dropdown') && !target.closest('[data-templates-dropdown]')) {
        setShowTemplatesDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calculate days until check-in
  useEffect(() => {
    if (settings.isEnabled && settings.lastCheckIn) {
      const lastCheckInDate = new Date(settings.lastCheckIn);
      const now = new Date();
      const timeDiff = now.getTime() - lastCheckInDate.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
      const daysUntil = settings.checkInFrequency - daysDiff;
      
      setDaysUntilCheckIn(daysUntil);
      
      if (daysUntil <= 0) {
        setTimeUntilCheckIn({
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
      }
    }
  }, [settings.isEnabled, settings.lastCheckIn, settings.checkInFrequency]);

  const loadLWSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('last_wish_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {

        return;
      }

      if (data) {
        // Check for successful deliveries in last_wish_deliveries table
        const { data: deliveries, error: deliveryError } = await supabase
          .from('last_wish_deliveries')
          .select('*')
          .eq('user_id', user.id)
          .eq('delivery_status', 'sent')
          .order('sent_at', { ascending: false });
        
        // If delivery_triggered flag is explicitly true, mark as delivered
        // Otherwise, only check deliveries table if delivery_triggered is null/undefined (fallback for old records)
        const isDelivered = data.delivery_triggered === true || 
          (data.delivery_triggered === null && deliveries && deliveries.length > 0);
        
        // Store delivery data if available and marked as delivered
        if (isDelivered && !deliveryError && deliveries && deliveries.length > 0) {
          setDeliveryData({
            deliveredAt: deliveries[0].sent_at,
            recipients: deliveries.map(d => ({
              email: d.recipient_email,
              status: d.delivery_status
            })),
            deliveryCount: deliveries.length
          });
        } else {
          // Clear delivery data if not delivered
          setDeliveryData(null);
        }
        
        setSettings({
          isEnabled: data.is_enabled || false,
          checkInFrequency: data.check_in_frequency || 30,
          lastCheckIn: data.last_check_in,
          recipients: data.recipients || [],
          includeData: data.include_data || {
            accounts: true,
            transactions: true,
            purchases: true,
            lendBorrow: true,
            savings: true,
            analytics: true,
          },
          message: data.message || '',
          isActive: data.is_active || false,
          deliveryTriggered: isDelivered,
        });
        
        // Initialize simple text editor with the message content
        if (data.message) {
          // Convert HTML to plain text for simple editor
          const textContent = data.message
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<p[^>]*>/gi, '')
            .replace(/<\/p>/gi, '\n')
            .replace(/<h[1-6][^>]*>/gi, '')
            .replace(/<\/h[1-6]>/gi, '\n')
            .replace(/<ul[^>]*>/gi, '')
            .replace(/<\/ul>/gi, '\n')
            .replace(/<li[^>]*>/gi, '• ')
            .replace(/<\/li>/gi, '\n')
            .replace(/<strong[^>]*>/gi, '')
            .replace(/<\/strong>/gi, '')
            .replace(/<em[^>]*>/gi, '')
            .replace(/<\/em>/gi, '')
            .replace(/<u[^>]*>/gi, '')
            .replace(/<\/u>/gi, '')
            .replace(/<[^>]*>/g, '')
            .replace(/\n\s*\n/g, '\n')
            .trim();
          setSimpleText(textContent);
        }
      }
    } catch (error) {

    }
  };

  const toggleLWEnabled = async (enabled: boolean) => {
    if (!user) return;

    // If enabling, check if recipients exist
    if (enabled && (!settings.recipients || settings.recipients.length === 0)) {
      toast.error('Please add at least one recipient before enabling the system');
      return;
    }

    setSettings(prev => ({
      ...prev,
      isEnabled: enabled,
      isActive: enabled,
    }));

    // Save to database
    try {
      // First try to update existing record
      const { data: updateData, error: updateError } = await supabase
        .from('last_wish_settings')
        .update({
          is_enabled: enabled,
          check_in_frequency: settings.checkInFrequency,
          last_check_in: settings.lastCheckIn,
          recipients: settings.recipients,
          include_data: settings.includeData,
          message: settings.message,
          is_active: enabled,
          delivery_triggered: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select();

      // If no rows were updated (user doesn't exist), insert new record
      if (!updateError && (!updateData || updateData.length === 0)) {
        const { error: insertError } = await supabase
          .from('last_wish_settings')
          .insert({
            user_id: user.id,
            is_enabled: enabled,
            check_in_frequency: settings.checkInFrequency,
            last_check_in: settings.lastCheckIn,
            recipients: settings.recipients,
            include_data: settings.includeData,
            message: settings.message,
            is_active: enabled,
            delivery_triggered: false,
            updated_at: new Date().toISOString(),
          });
        
        if (insertError) throw insertError;
      } else if (updateError) {
        throw updateError;
      }

      if (enabled) {
        toast.success('Last Wish enabled successfully');
      } else {
        toast.success('Last Wish disabled successfully');
      }
    } catch (error) {


      toast.error(`Failed to update settings: ${(error as any)?.message || 'Unknown error'}`);
    }
  };

  const updateCheckInFrequency = async (frequency: number) => {
    if (!user) return;

    setSettings(prev => ({
      ...prev,
      checkInFrequency: frequency,
    }));

    // Save to database
    try {
      // First try to update existing record
      const { data: updateData, error: updateError } = await supabase
        .from('last_wish_settings')
        .update({
          is_enabled: settings.isEnabled,
          check_in_frequency: frequency,
          last_check_in: settings.lastCheckIn,
          recipients: settings.recipients,
          include_data: settings.includeData,
          message: settings.message,
          is_active: settings.isActive,
          delivery_triggered: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select();

      // If no rows were updated (user doesn't exist), insert new record
      if (!updateError && (!updateData || updateData.length === 0)) {
        const { error: insertError } = await supabase
          .from('last_wish_settings')
          .insert({
            user_id: user.id,
            is_enabled: settings.isEnabled,
            check_in_frequency: frequency,
            last_check_in: settings.lastCheckIn,
            recipients: settings.recipients,
            include_data: settings.includeData,
            message: settings.message,
            is_active: settings.isActive,
            delivery_triggered: false,
            updated_at: new Date().toISOString(),
          });
        
        if (insertError) throw insertError;
      } else if (updateError) {
        throw updateError;
      }

      toast.success(`Check-in frequency updated to ${frequency} days`);
    } catch (error) {


      toast.error(`Failed to update check-in frequency: ${(error as any)?.message || 'Unknown error'}`);
    }
  };

  const handleCheckIn = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('last_wish_settings')
        .update({
          last_check_in: now,
          updated_at: now,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings(prev => ({ ...prev, lastCheckIn: now }));
      toast.success('Check-in successful! Your data is safe.');
    } catch (error) {

      toast.error('Failed to check-in');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('last_wish_settings')
        .update({
          delivery_triggered: false,
          is_active: true,
          last_check_in: now,
          updated_at: now,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Clear delivery data and reload settings to reflect changes
      setDeliveryData(null);
      await loadLWSettings();
      
      // Close modal and show success message
      setShowReactivateModal(false);
      toast.success('Last Wish reactivated successfully! Check-in timer has been reset.');
    } catch (error) {
      toast.error('Failed to reactivate Last Wish');
    } finally {
      setLoading(false);
    }
  };


  const addRecipient = async (recipient: any) => {
    if (!user) return;

    // Check if already at maximum recipients
    if (settings.recipients.length >= 3) {
      toast.error('Maximum 3 recipients allowed');
      return;
    }

    // Check for duplicate email
    const emailExists = settings.recipients.some(
      existingRecipient => existingRecipient.email.toLowerCase() === recipient.email.toLowerCase()
    );

    if (emailExists) {
      toast.error('A recipient with this email already exists');
      return;
    }

    const newRecipient = {
      id: Date.now().toString(),
      email: recipient.email,
      name: recipient.name,
      relationship: recipient.relationship,
    };

    const updatedRecipients = [...settings.recipients, newRecipient];
    
    // If this is the first recipient and Last Wish is not enabled, enable it
    const shouldEnable = updatedRecipients.length === 1 && !settings.isEnabled;
    
    setSettings(prev => ({
      ...prev,
      recipients: updatedRecipients,
      isEnabled: shouldEnable ? true : prev.isEnabled,
      isActive: shouldEnable ? true : prev.isActive,
    }));

    // Save to database
    try {
      const saveData = {
        user_id: user.id,
        is_enabled: shouldEnable ? true : settings.isEnabled,
        check_in_frequency: settings.checkInFrequency,
        last_check_in: settings.lastCheckIn,
        recipients: updatedRecipients,
        include_data: settings.includeData,
        message: settings.message,
        is_active: shouldEnable ? true : settings.isActive,
        delivery_triggered: false,
        updated_at: new Date().toISOString(),
      };

      // First try to update existing record
      const { data: updateData, error: updateError } = await supabase
        .from('last_wish_settings')
        .update({
          is_enabled: saveData.is_enabled,
          check_in_frequency: saveData.check_in_frequency,
          last_check_in: saveData.last_check_in,
          recipients: saveData.recipients,
          include_data: saveData.include_data,
          message: saveData.message,
          is_active: saveData.is_active,
          delivery_triggered: saveData.delivery_triggered,
          updated_at: saveData.updated_at,
        })
        .eq('user_id', user.id)
        .select();

      // If no rows were updated (user doesn't exist), insert new record
      if (!updateError && (!updateData || updateData.length === 0)) {
        const { error: insertError } = await supabase
          .from('last_wish_settings')
          .insert(saveData);
        
        if (insertError) throw insertError;
      } else if (updateError) {
        throw updateError;
      }

      if (shouldEnable) {
        toast.success('Recipient added and Last Wish enabled!');
      } else {
        toast.success('Recipient added successfully');
      }
    } catch (error) {

      toast.error('Failed to add recipient');
    }
  };



  const removeRecipient = async (id: string) => {
    if (!user) return;

    const updatedRecipients = settings.recipients.filter(r => r.id !== id);
    
    // If removing the last recipient and LW is enabled, disable it
    const shouldDisable = updatedRecipients.length === 0 && settings.isEnabled;
    
    setSettings(prev => ({
      ...prev,
      recipients: updatedRecipients,
      isEnabled: shouldDisable ? false : prev.isEnabled,
      isActive: shouldDisable ? false : prev.isActive,
    }));

    // Save to database
    try {
      // First try to update existing record
      const { data: updateData, error: updateError } = await supabase
        .from('last_wish_settings')
        .update({
          is_enabled: shouldDisable ? false : settings.isEnabled,
          check_in_frequency: settings.checkInFrequency,
          last_check_in: settings.lastCheckIn,
          recipients: updatedRecipients,
          include_data: settings.includeData,
          message: settings.message,
          is_active: shouldDisable ? false : settings.isActive,
          delivery_triggered: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select();

      // If no rows were updated (user doesn't exist), insert new record
      if (!updateError && (!updateData || updateData.length === 0)) {
        const { error: insertError } = await supabase
          .from('last_wish_settings')
          .insert({
            user_id: user.id,
            is_enabled: shouldDisable ? false : settings.isEnabled,
            check_in_frequency: settings.checkInFrequency,
            last_check_in: settings.lastCheckIn,
            recipients: updatedRecipients,
            include_data: settings.includeData,
            message: settings.message,
            is_active: shouldDisable ? false : settings.isActive,
            delivery_triggered: false,
            updated_at: new Date().toISOString(),
          });
        
        if (insertError) throw insertError;
      } else if (updateError) {
        throw updateError;
      }

      if (shouldDisable) {
        toast.success('Recipient removed. Last Wish disabled because no recipients remain.');
      } else {
        toast.success('Recipient removed successfully');
      }
    } catch (error) {

      toast.error('Failed to remove recipient');
    }
  };

  // Don't render for free users
  if (!isPremium) {
    return (
      <div className="space-y-2 sm:space-y-3 w-full">
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6 shadow-sm">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center shadow-md">
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Last Wish - Premium Feature
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This feature is available for Premium users only. Upgrade to access the Last Wish digital time capsule system.
              </p>
              <button
                onClick={() => window.location.href = '/settings?tab=plans-usage'}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Upgrade to Premium
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3 w-full">
      <style>{`
        .rich-editor h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0.75rem 0 0.5rem 0;
          line-height: 1.2;
        }
        .rich-editor h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0.625rem 0 0.5rem 0;
          line-height: 1.3;
        }
        .rich-editor h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0.5rem 0 0.5rem 0;
          line-height: 1.4;
        }
        .rich-editor p {
          margin: 0.5rem 0;
          line-height: 1.6;
        }
        .rich-editor ul, .rich-editor ol {
          margin: 0.5rem 0;
          padding-left: 1.25rem;
        }
        .rich-editor ul {
          list-style-type: disc;
        }
        .rich-editor ol {
          list-style-type: decimal;
        }
        .rich-editor li {
          margin: 0.25rem 0;
          line-height: 1.5;
          display: list-item;
        }
        .rich-editor blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 0.75rem;
          margin: 0.75rem 0;
          font-style: italic;
          color: #6b7280;
          background-color: #f9fafb;
          padding: 0.5rem 0.75rem;
          border-radius: 0.375rem;
        }
        .rich-editor code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875rem;
        }
        .rich-editor {
          font-family: "Manrope", sans-serif;
        }
        .rich-editor a {
          color: #3b82f6;
          text-decoration: underline;
        }
        .rich-editor a:hover {
          color: #1d4ed8;
        }
        .rich-editor strong {
          font-weight: 700;
        }
        .rich-editor em {
          font-style: italic;
        }
        .rich-editor u {
          text-decoration: underline;
        }
        .rich-editor s {
          text-decoration: line-through;
        }
        .rich-editor[data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          position: absolute;
        }
        .dark .rich-editor blockquote {
          background-color: #374151;
          border-left-color: #4b5563;
          color: #d1d5db;
        }
        .dark .rich-editor code {
          background-color: #374151;
          color: #f3f4f6;
        }
        .dark .rich-editor a {
          color: #60a5fa;
        }
        .dark .rich-editor a:hover {
          color: #93c5fd;
        }
        
        /* Mobile-specific improvements */
        @media (max-width: 640px) {
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          
          /* Ensure text doesn't get truncated */
          .break-words {
            word-wrap: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
          }
          
          /* Better container responsiveness */
          .responsive-container {
            max-width: 100%;
            overflow-x: hidden;
          }
          
          /* Ensure all text elements wrap properly */
          h1, h2, h3, h4, h5, h6, p, span, div {
            word-wrap: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
          }
          
          /* Better mobile spacing */
          .mobile-optimized {
            padding-left: 0.5rem;
            padding-right: 0.5rem;
          }
          
          /* Mobile-specific font sizes */
          .rich-editor h1 {
            font-size: 1.25rem;
          }
          .rich-editor h2 {
            font-size: 1.125rem;
          }
          .rich-editor h3 {
            font-size: 1rem;
          }
        }
        
        /* Tablet optimizations */
        @media (min-width: 641px) and (max-width: 1024px) {
          .rich-editor h1 {
            font-size: 1.75rem;
          }
          .rich-editor h2 {
            font-size: 1.375rem;
          }
          .rich-editor h3 {
            font-size: 1.125rem;
          }
        }
      `}</style>
      
      {/* Enterprise Header with Status Dashboard */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* System Title & Description */}
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
              <Shield className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">
                Last Wish - Digital Time Capsule
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Ensure your financial legacy is preserved and shared with loved ones
              </p>
            </div>
          </div>
          
        </div>
      </div>

      {/* Delivery Status Section - Only show if delivered */}
      {settings.deliveryTriggered && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200 dark:border-green-700 p-6 mb-6 shadow-sm">
          {isMobileDevice ? (
            // Mobile Layout - Icon at top center
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">Last Wish Successfully Delivered</h3>
              <p className="text-green-700 dark:text-green-300 mb-4">
                Your financial data has been successfully delivered to {settings.recipients.length} recipient{settings.recipients.length !== 1 ? 's' : ''}. 
                Your Last Wish system has completed its mission.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/70 dark:bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recipients Notified</span>
                  </div>
                  <div className="space-y-1">
                    {settings.recipients.map((recipient, index) => (
                      <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                        ✅ {recipient.email}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white/70 dark:bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">System Status</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div>✅ Email delivery completed</div>
                    <div>✅ All recipients notified</div>
                    <div>✅ Mission accomplished</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  💡 <strong>What's next?</strong> Your Last Wish system has successfully delivered your financial data. 
                  You can reactivate the system using the buttons below.
                </p>
              </div>
            </div>
          ) : (
            // Desktop Layout - Icon on left
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">Last Wish Successfully Delivered</h3>
                <p className="text-green-700 dark:text-green-300 mb-4">
                  Your financial data has been successfully delivered to {settings.recipients.length} recipient{settings.recipients.length !== 1 ? 's' : ''}. 
                  Your Last Wish system has completed its mission.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/70 dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recipients Notified</span>
                    </div>
                    <div className="space-y-1">
                      {settings.recipients.map((recipient, index) => (
                        <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                          ✅ {recipient.email}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-white/70 dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">System Status</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div>✅ Email delivery completed</div>
                      <div>✅ All recipients notified</div>
                      <div>✅ Mission accomplished</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg mb-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    💡 <strong>What's next?</strong> Your Last Wish system has successfully delivered your financial data. 
                    You can reactivate the system using the buttons below.
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      if (deliveryData) {
                        const deliveryDate = new Date(deliveryData.deliveredAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        const recipientsList = deliveryData.recipients.map(r => r.email).join(', ');
                        toast.success(
                          <div className="space-y-1">
                            <div className="font-semibold">Last Wish Delivered</div>
                            <div className="text-sm">Delivered on {deliveryDate}</div>
                            <div className="text-sm">To {deliveryData.deliveryCount} recipient{deliveryData.deliveryCount !== 1 ? 's' : ''}: {recipientsList}</div>
                          </div>,
                          { duration: 5000 }
                        );
                      } else {
                        toast.info('Last Wish has been delivered successfully.');
                      }
                    }}
                    className="w-auto px-3 py-2.5 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 flex items-center justify-center space-x-2 text-sm font-medium shadow-sm transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Delivered</span>
                  </button>
                  
                  <button
                    onClick={() => setShowReactivateModal(true)}
                    disabled={loading}
                    className="w-auto px-3 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm font-medium shadow-sm transition-colors"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>Reactivate</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* System Control Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* System Toggle Card */}
          <div className="lg:w-1/3">
            <div className="h-full flex flex-col justify-center">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">System Control</h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.isEnabled}
                    onChange={(e) => toggleLWEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${settings.isEnabled ? 'bg-blue-500' : 'bg-gray-400'}`} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {settings.isEnabled ? 'System Active' : 'System Inactive'}
                  </span>
                </div>
                
                {/* Check-in Status - Only show if not delivered */}
                {!settings.deliveryTriggered && settings.isEnabled && (daysUntilCheckIn !== null || timeUntilCheckIn !== null) && (
                  <div className="flex items-center space-x-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <Clock className="w-3 h-3 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                      {daysUntilCheckIn && daysUntilCheckIn > 0 ? `${daysUntilCheckIn} days until check-in` : 'Overdue for check-in'}
                    </span>
                  </div>
                )}
                
                {settings.isEnabled && !settings.deliveryTriggered && (
                  <div className="mt-auto">
                    <button
                      onClick={handleCheckIn}
                      disabled={loading}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm font-medium shadow-sm transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Check In</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px bg-gray-200 dark:bg-gray-700"></div>

          {/* What will be sent */}
          <div className="lg:w-2/3">
            <div className="h-full flex flex-col">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50 shadow-sm">
                <p className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 sm:mb-3 flex items-center gap-2">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                  What will be sent:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                  <div className="flex items-start gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-lg bg-white/60 dark:bg-gray-800/40 hover:bg-white/80 dark:hover:bg-gray-800/60 transition-colors">
                    <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Bank Accounts</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">With balances, organized by currency</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-lg bg-white/60 dark:bg-gray-800/40 hover:bg-white/80 dark:hover:bg-gray-800/60 transition-colors">
                    <Handshake className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Lend & Borrow</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">Active records only</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-lg bg-white/60 dark:bg-gray-800/40 hover:bg-white/80 dark:hover:bg-gray-800/60 transition-colors">
                    <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Personal Message</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">Your legacy documentation</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-lg bg-white/60 dark:bg-gray-800/40 hover:bg-white/80 dark:hover:bg-gray-800/60 transition-colors">
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Secure PDF</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">Encrypted document delivery</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Check-in Frequency & Beneficiaries Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Check-in Frequency */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">Check-in Frequency</h3>
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
            {[
              { value: 0.0417, label: '1', unit: 'hour' },
              { value: 1, label: '1', unit: 'day' },
              { value: 7, label: '7', unit: 'days' },
              { value: 14, label: '14', unit: 'days' },
              { value: 30, label: '30', unit: 'days' },
              { value: 60, label: '60', unit: 'days' },
              { value: 90, label: '90', unit: 'days' }
            ].map((option) => (
              <label key={option.value} className={`relative cursor-pointer p-2 sm:p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                Math.abs(settings.checkInFrequency - option.value) < 0.0001
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}>
                <input
                  type="radio"
                  name="frequency"
                  value={option.value}
                  checked={Math.abs(settings.checkInFrequency - option.value) < 0.0001}
                  onChange={(e) => updateCheckInFrequency(parseFloat(e.target.value))}
                  className="sr-only"
                />
                <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  {option.label}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {option.unit}
                </div>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
            System will monitor user activity and trigger data distribution after the selected period of inactivity.
          </p>
        </div>

        {/* Authorized Beneficiaries */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Authorized Beneficiaries</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Configure who will receive your financial data</p>
            </div>
            <button
              onClick={() => setShowRecipientModal(true)}
              disabled={settings.recipients.length >= 3}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm font-medium shadow-sm transition-colors w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add ({settings.recipients.length}/3)</span>
            </button>
          </div>
          
          {settings.recipients.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">No beneficiaries configured</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 px-2">Add authorized beneficiaries to receive your financial data</p>
            </div>
          ) : (
            <div className="space-y-3">
              {settings.recipients.map((recipient) => (
                <div key={recipient.id} className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm truncate">{recipient.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{recipient.email}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 capitalize">{recipient.relationship}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeRecipient(recipient.id)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legacy Documentation Editor */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Legacy Documentation</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Create documentation to accompany your financial data</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Preview Button */}
            <button
              onClick={() => setShowPreview(true)}
              className="px-3 sm:px-4 py-2 bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-600 flex items-center space-x-2 text-xs sm:text-sm font-medium transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
            {/* Editor Mode Toggle - Hidden on mobile */}
            {!isMobile && (
              <button
                onClick={toggleEditorMode}
                className="px-3 py-2 bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-600 transition-colors text-xs sm:text-sm font-medium"
                title={useSimpleEditor ? "Switch to Rich Editor" : "Switch to Simple Editor"}
              >
                {useSimpleEditor ? "Rich Editor" : "Simple Editor"}
              </button>
            )}
          </div>
        </div>
        {/* Editor Container */}
        <div className="border-2 border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden shadow-sm">
          {useSimpleEditor ? (
            /* Simple Textarea Editor */
            <div>
              {/* Simple Toolbar */}
              <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Simple Text Editor</span>
                  </div>
                  <div className="flex items-center gap-1 relative">
                    {/* Templates button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowTemplatesDropdown(!showTemplatesDropdown);
                      }}
                      className="px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-700 transition-colors"
                      title="Templates"
                    >
                      📝
                    </button>
                    {/* Clear button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSimpleText('');
                        setSettings(prev => ({ ...prev, message: '' }));
                        setSaveStatus('unsaved');
                      }}
                      className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded w-8 h-8 transition-colors"
                      title="Clear"
                    >
                      ✕
                    </button>
                    {/* Templates Dropdown */}
                    {showTemplatesDropdown && (
                      <div 
                        className="absolute top-full right-0 z-[9999] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg mt-1 min-w-[140px]"
                        data-templates-dropdown
                        style={{ zIndex: 9999 }}
                      >
                        {[
                          { value: 'personal', label: '💝 Personal Message' },
                          { value: 'financial', label: '💰 Financial Information' },
                          { value: 'memories', label: '📖 Life Story & Memories' }
                        ].map((template) => (
                          <button
                            key={template.value}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-700 transition-colors text-gray-700 dark:text-gray-100 first:rounded-t-lg last:rounded-b-lg"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              insertTemplate(template.value);
                              setShowTemplatesDropdown(false);
                            }}
                          >
                            {template.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Simple Textarea - Mobile Optimized */}
              <textarea
                value={simpleText}
                onChange={handleSimpleTextChange}
                className="w-full p-3 min-h-[150px] max-h-[400px] resize-y focus:outline-none dark:bg-gray-700 dark:text-white text-sm border-0"
                style={{
                  lineHeight: '1.6',
                  fontFamily: '"Manrope", sans-serif',
                  fontSize: isMobile ? '16px' : `${selectedFontSize}px`, // Prevent zoom on iOS
                  WebkitAppearance: 'none', // Remove iOS styling
                  borderRadius: '0' // Remove iOS border radius
                }}
                placeholder="Create legacy documentation to accompany your financial data..."
                autoComplete="off"
                autoCorrect="on"
                autoCapitalize="sentences"
                spellCheck="true"
              />
            </div>
          ) : (
            /* Rich Text Editor */
            <div>
              {/* Rich Toolbar - Mobile Responsive */}
              <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 p-3">
                <div className={`flex items-center gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
                  {/* Font Dropdown */}
                  <div className="relative">
                    <select
                      value={selectedFont}
                      onChange={(e) => {
                        setSelectedFont(e.target.value);
                        if (messageEditorRef.current) {
                          messageEditorRef.current.style.fontFamily = e.target.value;
                        }
                      }}
                      className="appearance-none text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 px-3 py-2 pr-8 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 cursor-pointer"
                      style={{ fontFamily: selectedFont }}
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Courier New">Courier New</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Font Size Dropdown */}
                  <div className="relative">
                    <select
                      value={selectedFontSize}
                      onChange={(e) => {
                        setSelectedFontSize(e.target.value);
                        if (messageEditorRef.current) {
                          messageEditorRef.current.style.fontSize = `${e.target.value}px`;
                        }
                      }}
                      className="appearance-none text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 px-3 py-2 pr-8 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 cursor-pointer"
                    >
                      <option value="12">12px</option>
                      <option value="14">14px</option>
                      <option value="16">16px</option>
                      <option value="18">18px</option>
                      <option value="20">20px</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Templates Dropdown - Simplified */}
                  <div className="relative" data-templates-dropdown>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowTemplatesDropdown(!showTemplatesDropdown);
                      }}
                      className="text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 px-3 py-2 pr-8 rounded-lg border border-blue-200 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-500 flex items-center gap-2"
                    >
                      <span>📝 Templates</span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Templates Dropdown Menu - Fixed positioning */}
                    {showTemplatesDropdown && (
                      <div 
                        className="absolute top-full left-0 z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl mt-2 min-w-[180px] overflow-hidden"
                        style={{ zIndex: 9999 }}
                      >
                        {[
                          { value: 'personal', label: '💝 Personal Message' },
                          { value: 'financial', label: '💰 Financial Information' },
                          { value: 'memories', label: '📖 Life Story & Memories' }
                        ].map((template) => (
                          <button
                            key={template.value}
                            type="button"
                            className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-100 border-b border-gray-100 dark:border-gray-600 last:border-b-0 group"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              insertTemplate(template.value);
                              setShowTemplatesDropdown(false);
                            }}
                          >
                            <div className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {template.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>


                  {/* Formatting Buttons - B, I, U */}
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => formatText('bold')}
                      className="p-2 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-sm font-bold w-10 h-10 transition-all duration-200 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      title="Bold"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => formatText('italic')}
                      className="p-2 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-sm italic w-10 h-10 transition-all duration-200 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      title="Italic"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => formatText('underline')}
                      className="p-2 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-sm underline w-10 h-10 transition-all duration-200 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      title="Underline"
                    >
                      U
                    </button>
                  </div>
                </div>
              </div>
              {/* Rich Text Editor - Mobile Optimized */}
              <div
                ref={messageEditorRef}
                contentEditable
                className="rich-editor w-full p-3 min-h-[150px] max-h-[400px] overflow-y-auto focus:outline-none dark:bg-gray-700 dark:text-white resize-y text-sm"
                style={{
                  lineHeight: '1.6',
                  fontFamily: '"Manrope", sans-serif',
                  fontSize: isMobile ? '16px' : `${selectedFontSize}px`, // Prevent zoom on iOS
                  WebkitAppearance: 'none',
                  WebkitUserSelect: 'text',
                  WebkitTouchCallout: 'default'
                }}
                onInput={handleMessageInput}
                onBlur={handleMessageBlur}
                onFocus={handleMessageFocus}
                onKeyDown={handleKeyDown}
                data-placeholder="Create legacy documentation to accompany your financial data..."
                suppressContentEditableWarning={true}
              />
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {settings.message.length} characters
          </span>
          <div className="flex items-center space-x-2">
            {saveStatus === 'saving' && (
              <span className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
                <div className="w-4 h-4 border border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-sm text-green-600 dark:text-green-400 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Saved
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="text-sm text-orange-600 dark:text-orange-400">
                Unsaved changes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Recipient Modal */}
      {showRecipientModal && (
        <RecipientModal
          onClose={() => setShowRecipientModal(false)}
          onAdd={addRecipient}
          currentRecipientCount={settings.recipients.length}
          currentRecipients={settings.recipients}
        />
      )}

      {/* Message Preview Modal */}
      {showPreview && (
        <MessagePreviewModal
          onClose={() => setShowPreview(false)}
          message={settings.message}
          recipients={settings.recipients} // Use actual recipients from LW settings
          includeData={settings.includeData} // Use actual data inclusion settings
          dataSummary={dataSummary}
          checkInFrequency={settings.checkInFrequency} // Use actual check-in frequency
          userProfile={profile}
          user={user}
        />
      )}

      {/* Reactivate Last Wish Confirmation Modal */}
      {showReactivateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-md w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <RotateCw className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  Reactivate Last Wish
                </h3>
              </div>
              <button
                onClick={() => setShowReactivateModal(false)}
                disabled={loading}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">
                Are you sure you want to reactivate Last Wish? This will reset the check-in timer and allow the system to monitor your activity again. Delivery history will be preserved.
              </p>
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 sm:p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-purple-700 dark:text-purple-300">
                    <p className="font-medium mb-1">What will happen:</p>
                    <ul className="list-disc list-inside space-y-1 text-purple-600 dark:text-purple-400">
                      <li>Check-in timer will reset to start immediately</li>
                      <li>System will begin monitoring your activity again</li>
                      <li>Previous delivery records will be kept for history</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => setShowReactivateModal(false)}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReactivate}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Reactivating...</span>
                  </>
                ) : (
                  <>
                    <RotateCw className="w-4 h-4" />
                    <span>Reactivate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

// Relationship Dropdown Component
interface RelationshipDropdownProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const RelationshipDropdown: React.FC<RelationshipDropdownProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const relationships = [
    { value: 'spouse', label: 'Spouse', icon: '💕' },
    { value: 'child', label: 'Child', icon: '👶' },
    { value: 'parent', label: 'Parent', icon: '👨‍👩‍👧‍👦' },
    { value: 'sibling', label: 'Sibling', icon: '👫' },
    { value: 'friend', label: 'Friend', icon: '👥' },
    { value: 'lawyer', label: 'Lawyer', icon: '⚖️' },
    { value: 'executor', label: 'Executor', icon: '📋' },
    { value: 'other', label: 'Other', icon: '👤' }
  ];

  const selectedRelationship = relationships.find(rel => rel.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <div className="relative w-full">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
          !value ? 'text-gray-500 dark:text-gray-400' : ''
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex items-center">
          {selectedRelationship ? (
            <>
              <span className="mr-2">{selectedRelationship.icon}</span>
              <span>{selectedRelationship.label}</span>
            </>
          ) : (
            <span>Select relationship</span>
          )}
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {open && (
        <div
          ref={menuRef}
          className="absolute z-[9999] w-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 shadow-xl rounded-xl max-h-60 overflow-y-auto animate-fadein"
          role="listbox"
        >
          {relationships.map((relationship) => (
            <button
              key={relationship.value}
              type="button"
              className={`w-full flex items-center text-left px-3 py-2 text-sm rounded-lg hover:bg-blue-50 dark:hover:bg-blue-700 transition-colors ${
                value === relationship.value 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold' 
                  : 'text-gray-700 dark:text-gray-100'
              }`}
              onClick={() => {
                onChange(relationship.value);
                setOpen(false);
              }}
              role="option"
              aria-selected={value === relationship.value}
            >
              <span className="mr-2">{relationship.icon}</span>
              <span className="flex-1">{relationship.label}</span>
              {value === relationship.value && (
                <svg className="w-4 h-4 text-white ml-2" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Recipient Modal Component
interface RecipientModalProps {
  onClose: () => void;
  onAdd: (recipient: any) => Promise<void>;
  editingRecipient?: any;
  currentRecipientCount: number;
  currentRecipients: Array<{ id: string; email: string; name: string; relationship: string; }>;
}

const RecipientModal: React.FC<RecipientModalProps> = ({ onClose, onAdd, editingRecipient, currentRecipients }) => {
  const [formData, setFormData] = useState({
    name: editingRecipient?.name || '',
    email: editingRecipient?.email || '',
    relationship: editingRecipient?.relationship || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Check for duplicate email before submitting
    const emailExists = currentRecipients.some(
      existingRecipient => existingRecipient.email.toLowerCase() === formData.email.toLowerCase()
    );

    if (emailExists) {
      toast.error('A recipient with this email already exists');
      setIsSubmitting(false);
      return;
    }
    
    try {
      await onAdd(formData);
      onClose();
    } catch (error) {
      // Error is handled in the onAdd function
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Authorize Beneficiary
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add an authorized beneficiary to receive your financial legacy data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter beneficiary full name"
              required
            />
          </div>

          <div>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter beneficiary email address"
              required
            />
          </div>

          <div>
            <RelationshipDropdown
              value={formData.relationship}
              onChange={(value) => setFormData(prev => ({ ...prev, relationship: value }))}
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Authorize Beneficiary</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Message Preview Modal Component
interface MessagePreviewModalProps {
  onClose: () => void;
  message: string;
  recipients: Array<{ id: string; email: string; name: string; relationship: string; }>;
  includeData: {
    accounts: boolean;
    transactions: boolean;
    purchases: boolean;
    lendBorrow: boolean;
    savings: boolean;
    analytics: boolean;
  };
  dataSummary: {
    accounts: number;
    transactions: number;
    purchases: number;
    lendBorrow: number;
    savings: number;
    totalValue: number;
  };
  checkInFrequency: number;
  userProfile: any;
  user: any;
}

const MessagePreviewModal: React.FC<MessagePreviewModalProps> = ({ 
  onClose, 
  message, 
  recipients, 
  includeData, 
  dataSummary, 
  checkInFrequency,
  userProfile,
  user
}) => {
  // Extract first name from full name, fallback to email or 'User'
  const getFirstName = (fullName: string | undefined, email: string | undefined) => {
    if (fullName) {
      const firstName = fullName.split(' ')[0];
      return firstName || 'User';
    }
    if (email) {
      const emailName = email.split('@')[0];
      return emailName;
    }
    return 'User';
  };
  
  const userName = userProfile?.fullName || user?.email || 'User';
  const userFirstName = getFirstName(userProfile?.fullName, user?.email);
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const getIncludedDataList = () => {
    const included = [];
    if (includeData.accounts) included.push(`• ${dataSummary.accounts} accounts ($${dataSummary.totalValue.toLocaleString()} total)`);
    if (includeData.transactions) included.push(`• ${dataSummary.transactions} transactions`);
    if (includeData.purchases) included.push(`• ${dataSummary.purchases} purchases`);
    if (includeData.lendBorrow) included.push(`• ${dataSummary.lendBorrow} lend/borrow records`);
    if (includeData.savings) included.push(`• ${dataSummary.savings} savings goals`);
    if (includeData.analytics) included.push(`• Financial analytics and insights`);
    return included;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Mail className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Legacy Documentation Preview
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This is what your authorized beneficiaries will receive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Email Preview Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Email Header */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[60px]">From:</span>
                <span className="text-sm text-gray-900 dark:text-white break-words">Balanze Financial Legacy Management System</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[60px]">To:</span>
                <span className="text-sm text-gray-900 dark:text-white break-words">
                  {recipients.length > 0 ? recipients.map(r => r.email).join(', ') : 'Your authorized beneficiaries'}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[60px]">Subject:</span>
                <span className="text-sm text-gray-900 dark:text-white break-words">
                  Financial Legacy Documentation from {userName}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[60px]">Date:</span>
                <span className="text-sm text-gray-900 dark:text-white">{currentDate}</span>
              </div>
            </div>
          </div>

          {/* Email Body */}
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 sm:p-6 bg-white dark:bg-gray-800">
            <div className="space-y-4">
              {/* Greeting */}
              <div>
                <p className="text-gray-900 dark:text-white text-base">
                  Dear {recipients.length > 1 ? 'Authorized Beneficiaries' : recipients[0]?.name || 'Beneficiary'},
                </p>
                <p className="text-gray-700 dark:text-gray-300 mt-2 text-sm sm:text-base">
                  This is an automated notification from <strong>{userFirstName}'s</strong> Financial Legacy Management System.
                </p>
              </div>

              {/* Personal Message */}
              {message && (
                <div className="border-l-4 border-blue-500 pl-4 py-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-base">Legacy Documentation:</h4>
                  <div 
                    className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 rich-editor"
                    dangerouslySetInnerHTML={{ __html: message }}
                    style={{
                      lineHeight: '1.6',
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                  />
                </div>
              )}

              {/* Data Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-base">Financial Data Summary:</h4>
                <div className="space-y-2">
                  {getIncludedDataList().map((item, index) => (
                    <p key={index} className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{item}</p>
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-3">
                  * Detailed financial data will be attached as encrypted files for your security.
                </p>
              </div>

              {/* System Message */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-base">System Information:</h4>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  This notification was triggered because <strong>{userFirstName}</strong> has not recorded activity for <strong>{checkInFrequency} days</strong>. 
                  This is part of their Financial Legacy Management System to ensure their financial data is preserved and distributed to authorized beneficiaries.
                </p>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  This notification was generated automatically by Balanze's Financial Legacy Management System. 
                  For questions about this system, please contact Balanze support.
                </p>
              </div>
            </div>
          </div>

          {/* Recipients List */}
          {recipients.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 text-base">Authorized Beneficiaries ({recipients.length}):</h4>
              <div className="space-y-3">
                {recipients.map((recipient) => (
                  <div key={recipient.id} className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white break-words">{recipient.name}</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">{recipient.email} • {recipient.relationship}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Close Documentation Preview
          </button>
        </div>
      </div>
    </div>
  );
};

