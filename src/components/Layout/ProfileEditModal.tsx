import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import imageCompression from 'browser-image-compression';
import { CustomDropdown } from '../Purchases/CustomDropdown';

interface ProfileEditModalProps {
  open: boolean;
  onClose: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ open, onClose }) => {
  const { profile, updateProfile } = useAuthStore();
  
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [profilePicture, setProfilePicture] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<{ currency?: boolean }>({});
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && profile) {
      setName(profile.fullName || '');
      setCurrency(profile.local_currency || 'USD');
      setProfilePicture(profile.profilePicture);
    }
  }, [open, profile?.fullName, profile?.local_currency, profile?.profilePicture]);

  // Dynamic, reactive currency options
  const allCurrencyOptions = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'BDT', label: 'BDT - Bangladeshi Taka' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
  ];
  const currencyOptions = useMemo(() => {
    const selected = profile?.selected_currencies ?? [];
    if (selected.length > 0) {
      return allCurrencyOptions.filter(opt => selected.includes(opt.value));
    }
    return allCurrencyOptions;
  }, [profile?.selected_currencies]);

  if (!open) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    const options = {
      maxSizeMB: 0.128,
      maxWidthOrHeight: 256,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      setUploading(true);
      setUploadError(null);
      
      const ext = compressedFile.name.split('.').pop();
      const fileName = `${profile.id}-avatar.${ext}`;
      
      // First, upload the file to Supabase Storage.
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: true, // This will overwrite the file if it already exists.
        });

      if (uploadError) {
        throw uploadError;
      }

      // Then, update the user's profile with the new filename.
      const { error: updateError } = await updateProfile({ profilePicture: fileName });

      if (updateError) {
        throw updateError;
      }
      
      // Finally, get the public URL to display the new image in the modal.
      // Only add timestamp when uploading new image, not for regular display
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setProfilePicture(urlData.publicUrl);

    } catch (err: any) {
      setUploadError('Failed to upload image: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    setTouched(t => ({ ...t, currency: true }));
    if (!currency) {
      setError('Please select a currency');
      setLoading(false);
      return;
    }
    try {
      // Only update the name and currency here. The profile picture is
      // handled separately by the handleFileChange function.
      const { error: updateError } = await updateProfile({
        fullName: name,
        local_currency: currency,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex flex-col items-center space-y-2">
            <div className="relative">
              {profile?.profilePicture ? (
                <img
                  src={supabase.storage.from('avatars').getPublicUrl(profile.profilePicture + '?t=' + Date.now()).data.publicUrl}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                  onError={e => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.className = 'w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-3xl font-bold text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600';
                    fallback.innerText = getInitials(name);
                    target.parentNode?.appendChild(fallback);
                  }}
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-3xl font-bold text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600">
                  {getInitials(name)}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-gradient-primary text-white rounded-full p-1 border-2 border-white dark:border-gray-800 hover:bg-gradient-primary-hover focus:outline-none"
                disabled={uploading}
                title="Change profile picture"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>
            {uploading && <div className="text-xs text-gray-500">{uploadError || 'Uploading...'}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Currency</label>
            <CustomDropdown
              options={currencyOptions}
              value={currency}
              onChange={val => { setCurrency(val); setTouched(t => ({ ...t, currency: true })); }}
              placeholder="Select currency"
              className={`bg-white dark:bg-gray-700 text-gray-900 dark:text-white border ${error && touched.currency && !currency ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
            />
          </div>
          {error && touched.currency && !currency && <div className="text-red-600 text-sm mt-1">{error}</div>}
          {success && <div className="text-green-600 text-sm">Profile updated!</div>}
          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-gradient-primary text-white hover:bg-gradient-primary-hover disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 

