import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { toast } from 'sonner';
import { 
  Heart, 
  Clock, 
  Mail, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  User,
  FileText,
  Download,
  Bell,
  Settings,
  Trash2,
  Plus,
  Edit,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LastWishProps {
  setActiveTab?: (tab: string) => void;
  forceFreeAccess?: boolean;
}

interface LastWishSettings {
  isEnabled: boolean;
  checkInFrequency: number; // days
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
}

export const LastWish: React.FC<LastWishProps> = ({ setActiveTab, forceFreeAccess }) => {
  const { user, profile } = useAuthStore();
  const { accounts, transactions, purchases, donationSavingRecords } = useFinanceStore();
  const [lendBorrowRecords, setLendBorrowRecords] = useState<any[]>([]);
  
  // Check if user has Premium plan
  const isPremium = profile?.subscription?.plan === 'premium';
  const [settings, setSettings] = useState<LastWishSettings>({
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
  });
  const [loading, setLoading] = useState(false);
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [daysUntilCheckIn, setDaysUntilCheckIn] = useState<number | null>(null);
  const messageEditorRef = useRef<HTMLDivElement>(null);
  const [isEditorInitialized, setIsEditorInitialized] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showHtmlCode, setShowHtmlCode] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [selectedFontSize, setSelectedFontSize] = useState('14');
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
  const [fontButtonRect, setFontButtonRect] = useState<DOMRect | null>(null);
  const [fontSizeButtonRect, setFontSizeButtonRect] = useState<DOMRect | null>(null);
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  const [templatesButtonRect, setTemplatesButtonRect] = useState<DOMRect | null>(null);

  // Load settings from database
  useEffect(() => {
    loadLastWishSettings();
  }, [user]);

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      if (!target.closest('.font-dropdown') && !target.closest('.font-size-dropdown') && !target.closest('.templates-dropdown')) {
        setShowFontDropdown(false);
        setShowFontSizeDropdown(false);
        setShowTemplatesDropdown(false);
      }
    }

    if (showFontDropdown || showFontSizeDropdown || showTemplatesDropdown) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showFontDropdown, showFontSizeDropdown, showTemplatesDropdown]);

  // Debug: Check current database state
  useEffect(() => {
    if (user) {
      const debugDatabase = async () => {
        const { data, error } = await supabase
          .from('last_wish_settings')
          .select('*')
          .eq('user_id', user.id);
        
        console.log('LastWish - Current database state:', data, 'Error:', error);
      };
      debugDatabase();
    }
  }, [user]);

  // Fetch lend/borrow records
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
        console.error('Error fetching lend/borrow records:', error);
        setLendBorrowRecords([]);
      }
    };

    fetchLendBorrowRecords();
  }, [user]);

  // Calculate days until next check-in
  useEffect(() => {
    if (settings.lastCheckIn && settings.isEnabled) {
      const lastCheckIn = new Date(settings.lastCheckIn);
      const nextCheckIn = new Date(lastCheckIn.getTime() + (settings.checkInFrequency * 24 * 60 * 60 * 1000));
      const now = new Date();
      const diffTime = nextCheckIn.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysUntilCheckIn(diffDays);
    }
  }, [settings.lastCheckIn, settings.checkInFrequency, settings.isEnabled]);

  const loadLastWishSettings = async () => {
    if (!user) return;

    try {
      console.log('LastWish - Loading settings for user:', user.id);
      
      // First, get all records for this user to check for duplicates
      const { data: allRecords, error: fetchError } = await supabase
        .from('last_wish_settings')
        .select('*')
        .eq('user_id', user.id);

      console.log('LastWish - All records for user:', allRecords);

      if (fetchError) {
        console.error('Error fetching all records:', fetchError);
        return;
      }

      let data: any = null;

      // If there are multiple records, delete all but the most recent one
      if (allRecords && allRecords.length > 1) {
        console.log('LastWish - Found duplicate records, cleaning up...');
        
        // Sort by updated_at and keep the most recent
        const sortedRecords = allRecords.sort((a, b) => 
          new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
        );
        
        const recordToKeep = sortedRecords[0];
        const recordsToDelete = sortedRecords.slice(1);
        
        console.log('LastWish - Keeping record:', recordToKeep.id);
        console.log('LastWish - Deleting records:', recordsToDelete.map(r => r.id));
        
        // Delete duplicate records
        for (const record of recordsToDelete) {
          const { error: deleteError } = await supabase
            .from('last_wish_settings')
            .delete()
            .eq('id', record.id);
          
          if (deleteError) {
            console.error('Error deleting duplicate record:', deleteError);
          }
        }
        
        // Use the record we kept
        data = recordToKeep;
        console.log('LastWish - Using cleaned record:', data);
      } else if (allRecords && allRecords.length === 1) {
        // Only one record, use it
        data = allRecords[0];
        console.log('LastWish - Using single record:', data);
      } else {
        // No records found, create default settings
        console.log('LastWish - No records found, creating default settings');
        const defaultSettings = {
          user_id: user.id,
          is_enabled: false,
          check_in_frequency: 30,
          recipients: [],
          include_data: {
            accounts: true,
            transactions: true,
            purchases: true,
            lendBorrow: true,
            savings: true,
            analytics: true,
          },
          message: '',
          is_active: false,
        };

        const { error: createError } = await supabase
          .from('last_wish_settings')
          .upsert(defaultSettings);

        if (createError) {
          console.error('Error creating default settings:', createError);
          return;
        }
        
        // Set default settings in state
        setSettings({
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
        });
        return;
      }

      // Process the data we found
      if (data) {
        console.log('LastWish - Loading settings from database:', data);
        console.log('LastWish - is_enabled:', data.is_enabled, 'is_active:', data.is_active);
        setSettings({
          isEnabled: Boolean(data.is_enabled),
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
          isActive: Boolean(data.is_active),
        });
      }
    } catch (error) {
      console.error('Error in loadLastWishSettings:', error);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('last_wish_settings')
        .upsert({
          user_id: user.id,
          is_enabled: settings.isEnabled,
          check_in_frequency: settings.checkInFrequency,
          last_check_in: settings.lastCheckIn,
          recipients: settings.recipients,
          include_data: settings.includeData,
          message: settings.message,
          is_active: settings.isActive,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Last Wish settings saved successfully');
    } catch (error) {
      console.error('Error saving last wish settings:', error);
      
      // Check if it's a plan limit error and show upgrade prompt
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        const errorMessage = error.message;
        
        if (errorMessage && errorMessage.includes('FEATURE_NOT_AVAILABLE') && errorMessage.includes('Last Wish')) {
          toast.error('Last Wish - Digital Time Capsule is a Premium feature. Upgrade to Premium to create your digital legacy.');
          setTimeout(() => {
            window.location.href = '/settings?tab=plans';
          }, 2000);
          
          return;
        }
      }
      
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
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
      console.error('Error during check-in:', error);
      toast.error('Failed to check-in');
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
        is_enabled: shouldEnable ? true : Boolean(settings.isEnabled),
        check_in_frequency: settings.checkInFrequency,
        last_check_in: settings.lastCheckIn,
        recipients: updatedRecipients,
        include_data: settings.includeData,
        message: settings.message,
        is_active: shouldEnable ? true : Boolean(settings.isActive),
        updated_at: new Date().toISOString(),
      };
      
      console.log('LastWish - Saving recipient data:', saveData);
      
      const { error } = await supabase
        .from('last_wish_settings')
        .upsert(saveData);

      if (error) throw error;

      if (shouldEnable) {
        toast.success('Recipient added and Last Wish enabled successfully!');
      } else {
        toast.success('Recipient added successfully');
      }
    } catch (error) {
      console.error('Error adding recipient:', error);
      toast.error('Failed to add recipient');
      // Revert the state if save failed
      setSettings(prev => ({
        ...prev,
        recipients: prev.recipients.filter(r => r.id !== newRecipient.id),
        isEnabled: settings.isEnabled,
        isActive: settings.isActive,
      }));
    }
  };

  const removeRecipient = async (id: string) => {
    if (!user) return;

    const updatedRecipients = settings.recipients.filter(r => r.id !== id);
    
    // If removing the last recipient and Last Wish is enabled, disable it
    const shouldDisable = updatedRecipients.length === 0 && settings.isEnabled;
    
    setSettings(prev => ({
      ...prev,
      recipients: updatedRecipients,
      isEnabled: shouldDisable ? false : prev.isEnabled,
      isActive: shouldDisable ? false : prev.isActive,
    }));

    // Save to database
    try {
      const { error } = await supabase
        .from('last_wish_settings')
        .upsert({
          user_id: user.id,
          is_enabled: shouldDisable ? false : settings.isEnabled,
          check_in_frequency: settings.checkInFrequency,
          last_check_in: settings.lastCheckIn,
          recipients: updatedRecipients,
          include_data: settings.includeData,
          message: settings.message,
          is_active: shouldDisable ? false : settings.isActive,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      if (shouldDisable) {
        toast.success('Recipient removed. Last Wish disabled because no recipients remain.');
      } else {
        toast.success('Recipient removed successfully');
      }
    } catch (error) {
      console.error('Error removing recipient:', error);
      toast.error('Failed to remove recipient');
      // Revert the state if save failed
      setSettings(prev => ({
        ...prev,
        recipients: settings.recipients,
        isEnabled: settings.isEnabled,
        isActive: settings.isActive,
      }));
    }
  };

  const toggleDataInclusion = (key: keyof typeof settings.includeData) => {
    setSettings(prev => ({
      ...prev,
      includeData: {
        ...prev.includeData,
        [key]: !prev.includeData[key],
      },
    }));
  };

  const toggleLastWishEnabled = async (enabled: boolean) => {
    if (!user) return;

    // If trying to enable but no recipients, show error and open recipient modal
    if (enabled && settings.recipients.length === 0) {
      toast.error('Please add at least one recipient before enabling Last Wish');
      setShowRecipientModal(true);
      return;
    }

    setSettings(prev => ({ 
      ...prev, 
      isEnabled: enabled,
      isActive: enabled 
    }));
    
    try {
      const saveData = {
        user_id: user.id,
        is_enabled: Boolean(enabled),
        check_in_frequency: settings.checkInFrequency,
        last_check_in: settings.lastCheckIn,
        recipients: settings.recipients,
        include_data: settings.includeData,
        message: settings.message,
        is_active: Boolean(enabled),
        updated_at: new Date().toISOString(),
      };
      
      console.log('LastWish - Saving toggle data:', saveData);
      
      const { error } = await supabase
        .from('last_wish_settings')
        .upsert(saveData);

      if (error) throw error;

      toast.success(enabled ? 'Last Wish enabled successfully' : 'Last Wish disabled successfully');
    } catch (error) {
      console.error('Error toggling last wish:', error);
      toast.error('Failed to update Last Wish status');
      // Revert the state if save failed
      setSettings(prev => ({ 
        ...prev, 
        isEnabled: !enabled,
        isActive: !enabled 
      }));
    }
  };

  const updateCheckInFrequency = async (frequency: number) => {
    if (!user) return;

    setSettings(prev => ({ ...prev, checkInFrequency: frequency }));
    
    try {
      const { error } = await supabase
        .from('last_wish_settings')
        .upsert({
          user_id: user.id,
          is_enabled: settings.isEnabled,
          check_in_frequency: frequency,
          last_check_in: settings.lastCheckIn,
          recipients: settings.recipients,
          include_data: settings.includeData,
          message: settings.message,
          is_active: settings.isActive,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Check-in frequency updated successfully');
    } catch (error) {
      console.error('Error updating check-in frequency:', error);
      toast.error('Failed to update check-in frequency');
      // Revert the state if save failed
      setSettings(prev => ({ ...prev, checkInFrequency: settings.checkInFrequency }));
    }
  };

  // Simplified Text Editor Functions
  const formatText = (command: string, value?: string) => {
    if (messageEditorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Special handling for bullet points
        if (command === 'insertUnorderedList') {
          const selectedText = selection.toString();
          
          if (selectedText) {
            // Multiple lines selected - convert each line to a bullet point
            const lines = selectedText.split('\n').filter(line => line.trim() !== '');
            if (lines.length > 0) {
              const ul = document.createElement('ul');
              lines.forEach(line => {
                const li = document.createElement('li');
                li.textContent = line.trim();
                ul.appendChild(li);
              });
              
              range.deleteContents();
              range.insertNode(ul);
              
              // Move cursor to end of the list
              const newRange = document.createRange();
              newRange.setStartAfter(ul);
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          } else {
            // No selection - create single bullet point
            const container = range.commonAncestorContainer;
            const listItem = container.nodeType === Node.TEXT_NODE 
              ? container.parentElement?.closest('li')
              : (container as Element)?.closest('li');
            
            if (listItem) {
              // If already in a list, remove the list
              document.execCommand('insertUnorderedList', false);
            } else {
              // Create a new list
              const ul = document.createElement('ul');
              const li = document.createElement('li');
              li.textContent = '• ';
              ul.appendChild(li);
              range.deleteContents();
              range.insertNode(ul);
              
              // Move cursor inside the list item
              const newRange = document.createRange();
              newRange.setStart(li, 1);
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          }
        }
        // Special handling for numbered lists
        else if (command === 'insertOrderedList') {
          const selectedText = selection.toString();
          
          if (selectedText) {
            // Multiple lines selected - convert each line to a numbered item
            const lines = selectedText.split('\n').filter(line => line.trim() !== '');
            if (lines.length > 0) {
              const ol = document.createElement('ol');
              lines.forEach(line => {
                const li = document.createElement('li');
                li.textContent = line.trim();
                ol.appendChild(li);
              });
              
              range.deleteContents();
              range.insertNode(ol);
              
              // Move cursor to end of the list
              const newRange = document.createRange();
              newRange.setStartAfter(ol);
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          } else {
            // No selection - create single numbered item
            const container = range.commonAncestorContainer;
            const listItem = container.nodeType === Node.TEXT_NODE 
              ? container.parentElement?.closest('li')
              : (container as Element)?.closest('li');
            
            if (listItem) {
              // If already in a list, remove the list
              document.execCommand('insertOrderedList', false);
            } else {
              // Create a new numbered list
              const ol = document.createElement('ol');
              const li = document.createElement('li');
              li.textContent = '1. ';
              ol.appendChild(li);
              range.deleteContents();
              range.insertNode(ol);
              
              // Move cursor inside the list item
              const newRange = document.createRange();
              newRange.setStart(li, 3);
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          }
        }
        else {
          // Use standard execCommand for other formatting
          document.execCommand(command, false, value);
        }
      }
      
      messageEditorRef.current.focus();
      // Trigger auto-save after formatting
      setTimeout(() => {
        if (messageEditorRef.current) {
          const content = messageEditorRef.current.innerHTML;
          setSettings(prev => ({ ...prev, message: content }));
          setSaveStatus('unsaved');
        }
      }, 100);
    }
  };

  const changeFont = (fontFamily: string) => {
    setSelectedFont(fontFamily);
    formatText('fontName', fontFamily);
  };

  const changeFontSize = (fontSize: string) => {
    setSelectedFontSize(fontSize);
    formatText('fontSize', fontSize);
  };

  const toggleHtmlCode = () => {
    setShowHtmlCode(!showHtmlCode);
  };

  const getHtmlContent = () => {
    if (messageEditorRef.current) {
      return messageEditorRef.current.innerHTML;
    }
    return '';
  };

  const setHtmlContent = (html: string) => {
    if (messageEditorRef.current) {
      messageEditorRef.current.innerHTML = html;
      setSettings(prev => ({ ...prev, message: html }));
      setSaveStatus('unsaved');
      
      // Clear any pending auto-save and set new timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSaveMessage(html);
      }, 2000);
    }
  };

  const insertTemplate = (templateType: string) => {
    const templates = {
      personal: `
        <h2>My Personal Message</h2>
        <p>Dear loved ones,</p>
        <p>This is my final message to you...</p>
        <ul>
          <li>Important memories I want to share</li>
          <li>Words of wisdom and love</li>
          <li>Final wishes and thoughts</li>
        </ul>
        <p>With all my love,<br>Your name</p>
      `,
      financial: `
        <h2>Financial Information</h2>
        <p>Important financial details and instructions:</p>
        <ul>
          <li>Bank account information</li>
          <li>Investment details</li>
          <li>Insurance policies</li>
          <li>Property information</li>
        </ul>
        <p><strong>Note:</strong> Please consult with a financial advisor for detailed guidance.</p>
      `,
      memories: `
        <h2>My Life Story</h2>
        <p>I want to share some of my most cherished memories:</p>
        <h3>Childhood</h3>
        <p>My earliest memories include...</p>
        <h3>Adulthood</h3>
        <p>As I grew older, I learned...</p>
        <h3>Family</h3>
        <p>The most important thing in my life has been...</p>
      `
    };

    const template = templates[templateType as keyof typeof templates] || '';
    if (messageEditorRef.current) {
      messageEditorRef.current.innerHTML = template;
      setSettings(prev => ({ ...prev, message: template }));
      setSaveStatus('unsaved');
      messageEditorRef.current.focus();
      
      // Clear any pending auto-save and set new timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSaveMessage(template);
      }, 2000);
    }
  };

  const insertText = (text: string) => {
    if (messageEditorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        // Handle line breaks properly
        if (text.includes('\n')) {
          const lines = text.split('\n');
          lines.forEach((line, index) => {
            if (index > 0) {
              // Insert line break
              const br = document.createElement('br');
              range.insertNode(br);
              range.setStartAfter(br);
            }
            if (line) {
              // Insert text
              const textNode = document.createTextNode(line);
              range.insertNode(textNode);
              range.setStartAfter(textNode);
            }
          });
        } else {
          // Insert regular text
          const textNode = document.createTextNode(text);
          range.insertNode(textNode);
          range.setStartAfter(textNode);
        }
        
        // Update selection
        selection.removeAllRanges();
        selection.addRange(range);
        messageEditorRef.current.focus();
      }
    }
  };

  const clearMessage = () => {
    if (messageEditorRef.current) {
      messageEditorRef.current.innerHTML = '';
      setSettings(prev => ({ ...prev, message: '' }));
      setSaveStatus('unsaved');
    }
  };

  const handleMessageInput = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML;
    setSettings(prev => ({ ...prev, message: content }));
    setSaveStatus('unsaved');
    
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save (2 seconds after user stops typing)
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveMessage(content);
    }, 2000);
  };

  // Initialize editor content only once
  useEffect(() => {
    if (messageEditorRef.current && settings.message && !isEditorInitialized) {
      messageEditorRef.current.innerHTML = settings.message;
      setIsEditorInitialized(true);
    }
  }, [settings.message, isEditorInitialized]);

  const handleMessageBlur = () => {
    if (messageEditorRef.current) {
      const content = messageEditorRef.current.innerHTML;
      setSettings(prev => ({ ...prev, message: content }));
      
      // Clear any pending auto-save and save immediately
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      if (content !== settings.message) {
        autoSaveMessage(content);
      }
    }
  };

  const handleMessageFocus = () => {
    if (messageEditorRef.current) {
      // Ensure cursor is at the end when focusing
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(messageEditorRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  // Add placeholder effect
  useEffect(() => {
    if (messageEditorRef.current) {
      const element = messageEditorRef.current;
      const placeholder = element.getAttribute('data-placeholder');
      
      const handleFocus = () => {
        if (element.textContent === placeholder) {
          element.textContent = '';
        }
      };
      
      const handleBlur = () => {
        if (element.textContent === '') {
          element.textContent = placeholder;
        }
      };
      
      // Set initial placeholder if empty
      if (!element.textContent && placeholder) {
        element.textContent = placeholder;
      }
      
      element.addEventListener('focus', handleFocus);
      element.addEventListener('blur', handleBlur);
      
      return () => {
        element.removeEventListener('focus', handleFocus);
        element.removeEventListener('blur', handleBlur);
      };
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
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
        case 'k':
          e.preventDefault();
          const url = prompt('Enter URL:');
          if (url) {
            formatText('createLink', url);
          }
          break;
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            formatText('redo');
          } else {
            e.preventDefault();
            formatText('undo');
          }
          break;
        case 'y':
          e.preventDefault();
          formatText('redo');
          break;
      }
    }
    
    // Handle Tab key
    if (e.key === 'Tab') {
      e.preventDefault();
      insertText('  '); // Insert 2 spaces for tab
    }
    
    // Handle Enter key for better list handling
    if (e.key === 'Enter' && !e.shiftKey) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        
        // Check if we're in a list item
        const listItem = container.nodeType === Node.TEXT_NODE 
          ? container.parentElement?.closest('li')
          : (container as Element)?.closest('li');
        
        if (listItem) {
          // Let the browser handle list continuation
          return;
        }
      }
      
      // For non-list content, insert a paragraph break
      e.preventDefault();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        range.deleteContents();
        range.insertNode(p);
        
        // Move cursor after the paragraph
        const newRange = document.createRange();
        newRange.setStartAfter(p);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
  };

  const autoSaveMessage = async (content: string) => {
    if (!user) return;
    
    setSaveStatus('saving');
    try {
      const { error } = await supabase
        .from('last_wish_settings')
        .upsert({
          user_id: user.id,
          is_enabled: settings.isEnabled,
          check_in_frequency: settings.checkInFrequency,
          last_check_in: settings.lastCheckIn,
          recipients: settings.recipients,
          include_data: settings.includeData,
          message: content,
          is_active: settings.isActive,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setSaveStatus('saved');
      console.log('Message auto-saved successfully');
    } catch (error) {
      console.error('Error auto-saving message:', error);
      setSaveStatus('unsaved');
      toast.error('Failed to auto-save message');
    }
  };

  const saveMessage = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('last_wish_settings')
        .upsert({
          user_id: user.id,
          is_enabled: settings.isEnabled,
          check_in_frequency: settings.checkInFrequency,
          last_check_in: settings.lastCheckIn,
          recipients: settings.recipients,
          include_data: settings.includeData,
          message: settings.message,
          is_active: settings.isActive,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success('Message saved successfully');
    } catch (error) {
      console.error('Error saving message:', error);
      toast.error('Failed to save message');
    } finally {
      setLoading(false);
    }
  };

  const getDataSummary = () => {
    return {
      accounts: accounts.length,
      transactions: transactions.length,
      purchases: purchases.length,
      lendBorrow: lendBorrowRecords.length,
      savings: donationSavingRecords.filter(r => r.type === 'saving').length,
      totalValue: accounts.reduce((sum, acc) => sum + (acc.calculated_balance || 0), 0),
    };
  };

  const dataSummary = getDataSummary();

  // Show upgrade prompt for free users
  if (!isPremium) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Heart className="w-6 h-6 text-red-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Last Wish - Digital Time Capsule
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ensure your financial legacy is preserved and shared with loved ones
            </p>
          </div>
        </div>

        {/* Premium Upgrade Card */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Premium Feature
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upgrade to Premium to access Last Wish
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                What's included in Last Wish:
              </h5>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Automated data delivery to loved ones</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Configurable check-in reminders</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Multiple recipient support</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Personal message attachment</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Secure encrypted delivery</span>
                </li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => window.location.href = '/settings'}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Upgrade to Premium
              </button>
              <button
                onClick={() => setActiveTab ? setActiveTab('plans') : window.location.href = '/settings'}
                className="flex-1 px-4 py-2 border border-purple-600 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 font-medium"
              >
                View Plans
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Editor Styles */}
      <style>{`
        .rich-editor h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin: 1rem 0 0.5rem 0;
          line-height: 1.2;
        }
        .rich-editor h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0.875rem 0 0.5rem 0;
          line-height: 1.3;
        }
        .rich-editor h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0.75rem 0 0.5rem 0;
          line-height: 1.4;
        }
        .rich-editor p {
          margin: 0.5rem 0;
          line-height: 1.6;
        }
        .rich-editor ul, .rich-editor ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
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
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #6b7280;
          background-color: #f9fafb;
          padding: 0.75rem 1rem;
          border-radius: 0.375rem;
        }
        .rich-editor code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875rem;
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
      `}</style>
      
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Last Wish - Digital Time Capsule
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ensure your financial legacy is preserved and shared with loved ones
          </p>
        </div>
      </div>

      {/* Status Card */}
      <div className={`${settings.isEnabled 
        ? 'bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800' 
        : 'bg-gradient-to-r from-gray-50 via-slate-50 to-zinc-50 dark:from-gray-900/20 dark:via-slate-900/20 dark:to-zinc-900/20 border-gray-200 dark:border-gray-800'
      } border rounded-lg p-6 transition-all duration-300 ease-in-out`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${settings.isEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="font-medium text-gray-900 dark:text-white">
              {settings.isEnabled ? 'Active' : 'Inactive'}
            </span>
          </div>
          {settings.isEnabled && daysUntilCheckIn !== null && (
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                {daysUntilCheckIn > 0 ? `${daysUntilCheckIn} days until check-in` : 'Overdue for check-in'}
              </span>
            </div>
          )}
        </div>
        
        {settings.isEnabled && (
          <div className="mt-4 flex space-x-3">
            <button
              onClick={handleCheckIn}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Check In Now</span>
            </button>
            <button
              onClick={() => toggleLastWishEnabled(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Disable</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enable/Disable */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Enable Last Wish</h4>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.isEnabled}
                onChange={(e) => toggleLastWishEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            When enabled, your financial data will be automatically sent to designated recipients if you don't check in regularly.
          </p>
        </div>

        {/* Check-in Frequency */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">Check-in Frequency</h4>
          <div className="space-y-3">
            {[7, 14, 30, 60, 90].map((days) => (
              <label key={days} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="frequency"
                  value={days}
                  checked={settings.checkInFrequency === days}
                  onChange={(e) => updateCheckInFrequency(parseInt(e.target.value))}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Every {days} day{days !== 1 ? 's' : ''}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Recipients */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Recipients</h4>
          <button
            onClick={() => setShowRecipientModal(true)}
            disabled={settings.recipients.length >= 3}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Add Recipient ({settings.recipients.length}/3)</span>
          </button>
        </div>
        
        {settings.recipients.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No recipients added yet.</p>
        ) : (
          <div className="space-y-3">
            {settings.recipients.map((recipient) => (
              <div key={recipient.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{recipient.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{recipient.email}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">{recipient.relationship}</div>
                </div>
                <button
                  onClick={() => removeRecipient(recipient.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Data to Include</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(settings.includeData).map(([key, value]) => (
            <label key={key} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={value}
                onChange={() => toggleDataInclusion(key as keyof typeof settings.includeData)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                ({dataSummary[key as keyof typeof dataSummary] || 0})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Personal Message */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Personal Message</h4>
          <button
            onClick={() => setShowPreview(true)}
            className="text-blue-600 hover:text-blue-700 flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Message</span>
          </button>
        </div>
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-visible" style={{ position: 'relative' }}>
          {/* Ultra-Compact Single Row Toolbar */}
          <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 px-2 py-1">
            <div className="flex items-center gap-1 overflow-x-auto">
              {/* Font Family Dropdown - Modal Style */}
              <div className="relative font-dropdown">
                <button
                  type="button"
                  onClick={(e) => {
                    console.log('Font dropdown clicked, current state:', showFontDropdown);
                    const rect = e.currentTarget.getBoundingClientRect();
                    setFontButtonRect(rect);
                    setShowFontDropdown(!showFontDropdown);
                    setShowFontSizeDropdown(false); // Close other dropdown
                  }}
                  className="min-w-[100px] text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 px-3 pr-8 py-1.5 h-8 rounded-md border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-150 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400 cursor-pointer flex items-center justify-between"
                  style={{ fontFamily: selectedFont }}
                >
                  <span>{selectedFont}</span>
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Font Size Dropdown - Modal Style */}
              <div className="relative font-size-dropdown">
                <button
                  type="button"
                  onClick={(e) => {
                    console.log('Font size dropdown clicked, current state:', showFontSizeDropdown);
                    const rect = e.currentTarget.getBoundingClientRect();
                    setFontSizeButtonRect(rect);
                    setShowFontSizeDropdown(!showFontSizeDropdown);
                    setShowFontDropdown(false); // Close other dropdown
                  }}
                  className="min-w-[65px] text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 px-3 pr-8 py-1.5 h-8 rounded-md border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-150 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400 cursor-pointer flex items-center justify-between"
                >
                  <span>{selectedFontSize}px</span>
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <div className="w-px bg-gray-300 dark:bg-gray-600 h-4 mx-1"></div>

              {/* Text Formatting Buttons - Enhanced */}
              <button
                type="button"
                onClick={() => formatText('bold')}
                className="p-1 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded text-xs font-bold min-w-[28px] h-8 transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                title="Bold (Ctrl+B)"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => formatText('italic')}
                className="p-1 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded text-xs italic min-w-[28px] h-8 transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                title="Italic (Ctrl+I)"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => formatText('underline')}
                className="p-1 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded text-xs underline min-w-[28px] h-8 transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                title="Underline (Ctrl+U)"
              >
                U
              </button>
              <button
                type="button"
                onClick={() => formatText('strikeThrough')}
                className="p-1 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded text-xs line-through min-w-[28px] h-8 transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                title="Strikethrough"
              >
                S
              </button>

              <div className="w-px bg-gray-300 dark:bg-gray-600 h-4 mx-1"></div>

              {/* List Buttons - Enhanced */}
              <button
                type="button"
                onClick={() => formatText('insertUnorderedList')}
                className="p-1 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded text-xs min-w-[28px] h-8 transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                title="Bullet List"
              >
                •
              </button>
              <button
                type="button"
                onClick={() => formatText('insertOrderedList')}
                className="p-1 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded text-xs min-w-[28px] h-8 transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                title="Numbered List"
              >
                1.
              </button>

              <div className="w-px bg-gray-300 dark:bg-gray-600 h-4 mx-1"></div>

              {/* Alignment Buttons - Enhanced */}
              <button
                type="button"
                onClick={() => formatText('justifyLeft')}
                className="p-1 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded text-xs min-w-[28px] h-8 transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                title="Align Left"
              >
                ⬅
              </button>
              <button
                type="button"
                onClick={() => formatText('justifyCenter')}
                className="p-1 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded text-xs min-w-[28px] h-8 transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                title="Align Center"
              >
                ↔
              </button>
              <button
                type="button"
                onClick={() => formatText('justifyRight')}
                className="p-1 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded text-xs min-w-[28px] h-8 transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                title="Align Right"
              >
                ➡
              </button>

              <div className="w-px bg-gray-300 dark:bg-gray-600 h-4 mx-1"></div>

              {/* Template Dropdown - Modal Style */}
              <div className="relative templates-dropdown">
                <button
                  type="button"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTemplatesButtonRect(rect);
                    setShowTemplatesDropdown(!showTemplatesDropdown);
                    setShowFontDropdown(false); // Close other dropdowns
                    setShowFontSizeDropdown(false);
                  }}
                  className="min-w-[120px] text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 px-3 pr-8 py-1.5 h-8 rounded-md border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-150 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400 cursor-pointer flex items-center justify-between"
                >
                  <span>📝 Templates</span>
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <div className="w-px bg-gray-300 dark:bg-gray-600 h-4 mx-1"></div>
              {/* Special Elements - Enhanced */}
              <button
                type="button"
                onClick={() => formatText('insertHorizontalRule')}
                className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded h-8 transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                title="Horizontal Line"
              >
                Line
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = prompt('Enter URL:');
                  if (url) {
                    formatText('createLink', url);
                  }
                }}
                className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded h-8 transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                title="Insert Link"
              >
                Link
              </button>

              <div className="w-px bg-gray-300 dark:bg-gray-600 h-4 mx-1"></div>

              {/* Clear Actions - Enhanced */}
              <button
                type="button"
                onClick={() => formatText('removeFormat')}
                className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400 rounded h-8 transition-all duration-200 border border-transparent hover:border-orange-200 dark:hover:border-orange-700"
                title="Clear Format"
              >
                Clear Format
              </button>
              <button
                type="button"
                onClick={clearMessage}
                className="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300 rounded h-8 transition-all duration-200 border border-transparent hover:border-red-200 dark:hover:border-red-700"
                title="Clear All Content"
              >
                Clear All
              </button>

              {/* HTML Toggle - Enhanced */}
              <div className="ml-auto flex items-center">
                <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showHtmlCode}
                    onChange={toggleHtmlCode}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all"
                  />
                  <span className="font-medium">HTML</span>
                </label>
              </div>
            </div>
          </div>
          {/* Enhanced Text Editor */}
          {showHtmlCode ? (
            <textarea
              value={getHtmlContent()}
              onChange={(e) => setHtmlContent(e.target.value)}
              className="w-full p-4 min-h-[150px] max-h-[400px] overflow-y-auto focus:outline-none dark:bg-gray-700 dark:text-white resize-y font-mono text-sm"
              style={{
                lineHeight: '1.6',
                fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace'
              }}
              placeholder="HTML code will appear here..."
            />
          ) : (
            <div
              ref={messageEditorRef}
              contentEditable
              className="rich-editor w-full p-4 min-h-[150px] max-h-[400px] overflow-y-auto focus:outline-none dark:bg-gray-700 dark:text-white resize-y"
              style={{
                lineHeight: '1.6',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
              onInput={handleMessageInput}
              onBlur={handleMessageBlur}
              onFocus={handleMessageFocus}
              onKeyDown={handleKeyDown}
              data-placeholder="Write a personal message to be included with your data..."
              suppressContentEditableWarning={true}
            />
          )}
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {settings.message.length} characters
          </span>
          <div className="flex items-center space-x-2">
            {saveStatus === 'saving' && (
              <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center">
                <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin mr-1"></div>
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs text-green-600 dark:text-green-400 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Saved
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="text-xs text-orange-600 dark:text-orange-400">
                Unsaved changes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={loading}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <Shield className="w-4 h-4" />
          <span>{loading ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Recipient Modal */}
      {showRecipientModal && (
        <RecipientModal
          onClose={() => setShowRecipientModal(false)}
          onAdd={addRecipient}
          editingRecipient={editingRecipient}
          currentRecipientCount={settings.recipients.length}
          currentRecipients={settings.recipients}
        />
      )}

      {/* Message Preview Modal */}
      {showPreview && (
        <MessagePreviewModal
          onClose={() => setShowPreview(false)}
          message={settings.message}
          recipients={settings.recipients}
          includeData={settings.includeData}
          dataSummary={dataSummary}
          checkInFrequency={settings.checkInFrequency}
          userProfile={profile}
          user={user}
        />
      )}

      {/* Font Family Dropdown Modal */}
      {showFontDropdown && fontButtonRect && (
        <div className="fixed inset-0 z-[10000]" onClick={() => setShowFontDropdown(false)}>
          <div 
            className="absolute bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 shadow-xl rounded-xl max-h-80 overflow-y-auto text-xs p-2 min-w-[200px] max-w-[300px]"
            style={{
              top: fontButtonRect.bottom + 1,
              left: fontButtonRect.left,
              zIndex: 10001
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-2 px-2">Select Font</div>
            {[
              { value: 'Arial', label: 'Arial' },
              { value: 'Helvetica', label: 'Helvetica' },
              { value: 'Times New Roman', label: 'Times New Roman' },
              { value: 'Georgia', label: 'Georgia' },
              { value: 'Verdana', label: 'Verdana' },
              { value: 'Courier New', label: 'Courier New' },
              { value: 'Comic Sans MS', label: 'Comic Sans MS' },
              { value: 'Impact', label: 'Impact' }
            ].map((font) => (
              <button
                key={font.value}
                type="button"
                className={`w-full flex items-center text-left text-sm rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors px-3 py-2 mb-1 ${selectedFont === font.value ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold' : 'text-gray-700 dark:text-gray-100'}`}
                onClick={() => {
                  changeFont(font.value);
                  setShowFontDropdown(false);
                }}
                style={{ fontFamily: font.value }}
              >
                <span className="flex-1">{font.label}</span>
                {selectedFont === font.value && (
                  <svg className="w-4 h-4 text-white ml-2" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Font Size Dropdown Modal */}
      {showFontSizeDropdown && fontSizeButtonRect && (
        <div className="fixed inset-0 z-[10000]" onClick={() => setShowFontSizeDropdown(false)}>
          <div 
            className="absolute bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 shadow-xl rounded-xl max-h-80 overflow-y-auto text-xs p-2 min-w-[150px] max-w-[200px]"
            style={{
              top: fontSizeButtonRect.bottom + 1,
              left: fontSizeButtonRect.left,
              zIndex: 10001
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-2 px-2">Select Font Size</div>
            {[
              { value: '8', label: '8px' },
              { value: '9', label: '9px' },
              { value: '10', label: '10px' },
              { value: '11', label: '11px' },
              { value: '12', label: '12px' },
              { value: '14', label: '14px' },
              { value: '16', label: '16px' },
              { value: '18', label: '18px' },
              { value: '20', label: '20px' },
              { value: '24', label: '24px' },
              { value: '28', label: '28px' },
              { value: '32', label: '32px' },
              { value: '36', label: '36px' },
              { value: '48', label: '48px' },
              { value: '72', label: '72px' }
            ].map((size) => (
              <button
                key={size.value}
                type="button"
                className={`w-full flex items-center text-left text-sm rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors px-3 py-2 mb-1 ${selectedFontSize === size.value ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold' : 'text-gray-700 dark:text-gray-100'}`}
                onClick={() => {
                  changeFontSize(size.value);
                  setShowFontSizeDropdown(false);
                }}
              >
                <span className="flex-1">{size.label}</span>
                {selectedFontSize === size.value && (
                  <svg className="w-4 h-4 text-white ml-2" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Templates Dropdown Modal */}
      {showTemplatesDropdown && templatesButtonRect && (
        <div className="fixed inset-0 z-[10000]" onClick={() => setShowTemplatesDropdown(false)}>
          <div 
            className="absolute bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 shadow-xl rounded-xl max-h-80 overflow-y-auto text-xs p-2 min-w-[200px] max-w-[300px]"
            style={{
              top: templatesButtonRect.bottom + 1,
              left: templatesButtonRect.left,
              zIndex: 10001
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-2 px-2">Select Template</div>
            {[
              { value: 'personal', label: '💝 Personal Message', description: 'A heartfelt personal message template' },
              { value: 'financial', label: '💰 Financial Info', description: 'Financial information and instructions' },
              { value: 'memories', label: '📖 Life Story', description: 'Life story and memories template' }
            ].map((template) => (
              <button
                key={template.value}
                type="button"
                className="w-full flex flex-col items-start text-left text-sm rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors px-3 py-2 mb-1 text-gray-700 dark:text-gray-100"
                onClick={() => {
                  insertTemplate(template.value);
                  setShowTemplatesDropdown(false);
                }}
              >
                <span className="font-medium">{template.label}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{template.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Recipient Modal Component
interface RecipientModalProps {
  onClose: () => void;
  onAdd: (recipient: any) => Promise<void>;
  editingRecipient: any;
  currentRecipientCount: number;
  currentRecipients: Array<{ id: string; email: string; name: string; relationship: string; }>;
}

const RecipientModal: React.FC<RecipientModalProps> = ({ onClose, onAdd, editingRecipient, currentRecipientCount, currentRecipients }) => {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Add Recipient
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {currentRecipientCount}/3 recipients added
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Relationship
            </label>
            <input
              type="text"
              value={formData.relationship}
              onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Spouse, Child, Friend"
              required
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Recipient'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all"
            >
              Cancel
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
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Mail className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Message Preview
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This is what your recipients will receive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Email Preview Content */}
        <div className="p-6 space-y-6">
          {/* Email Header */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">From:</span>
                <span className="text-sm text-gray-900 dark:text-white">Balanze Last Wish System</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">To:</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {recipients.map(r => r.email).join(', ')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Subject:</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  Your Last Wish - Digital Time Capsule from {userName}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Date:</span>
                <span className="text-sm text-gray-900 dark:text-white">{currentDate}</span>
              </div>
            </div>
          </div>

          {/* Email Body */}
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-6 bg-white dark:bg-gray-800">
            <div className="space-y-4">
              {/* Greeting */}
              <div>
                <p className="text-gray-900 dark:text-white">
                  Dear {recipients.length > 1 ? 'Loved Ones' : recipients[0]?.name || 'Recipient'},
                </p>
                <p className="text-gray-700 dark:text-gray-300 mt-2">
                  This is an automated message from <strong>{userFirstName}'s</strong> Last Wish - Digital Time Capsule system.
                </p>
              </div>

              {/* Personal Message */}
              {message && (
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Personal Message:</h4>
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
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Financial Data Summary:</h4>
                <div className="space-y-1">
                  {getIncludedDataList().map((item, index) => (
                    <p key={index} className="text-sm text-gray-700 dark:text-gray-300">{item}</p>
                  ))}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                  * Detailed financial data will be attached as encrypted files for your security.
                </p>
              </div>

              {/* System Message */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">System Information:</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  This message was sent because <strong>{userFirstName}</strong> hasn't checked in for <strong>{checkInFrequency} days</strong>. 
                  This is part of their Last Wish system to ensure their financial legacy is preserved and shared with loved ones.
                </p>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This message was generated automatically by Balanze's Last Wish system. 
                  For questions about this system, please contact Balanze support.
                </p>
              </div>
            </div>
          </div>

          {/* Recipients List */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Recipients ({recipients.length}):</h4>
            <div className="space-y-2">
              {recipients.map((recipient) => (
                <div key={recipient.id} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{recipient.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{recipient.email} • {recipient.relationship}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}; 