import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import imageCompression from 'browser-image-compression';

interface ProfileEditModalProps {
  open: boolean;
  onClose: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ open, onClose }) => {
  const { profile, updateProfile } = useAuthStore();
  
  const [name, setName] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && profile) {
      setName(profile.fullName || '');
      setProfilePicture(profile.profilePicture);
    }
  }, [open, profile?.fullName, profile?.profilePicture]);

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
    try {
      // Only update the name here. The profile picture is
      // handled separately by the handleFileChange function.
      const { error: updateError } = await updateProfile({
        fullName: name,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-0 w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white">Edit Profile</h2>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSave} className="p-4 sm:p-6">
          {/* Split Layout: Profile Picture Left, Form Right */}
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 mb-4 sm:mb-6">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center md:items-start space-y-3 flex-shrink-0">
              <div className="relative">
                {profile?.profilePicture ? (
                  <img
                    src={supabase.storage.from('avatars').getPublicUrl(profile.profilePicture + '?t=' + Date.now()).data.publicUrl}
                    alt="Profile"
                    className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-gray-100 dark:border-gray-700 shadow-lg ring-2 ring-blue-500/20"
                    onError={e => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = document.createElement('div');
                      fallback.className = 'w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 border-4 border-gray-100 dark:border-gray-700 shadow-lg ring-2 ring-blue-500/20';
                      fallback.innerText = getInitials(name);
                      target.parentNode?.appendChild(fallback);
                    }}
                  />
                ) : (
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 border-4 border-gray-100 dark:border-gray-700 shadow-lg ring-2 ring-blue-500/20">
                    {getInitials(name)}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-2 border-4 border-white dark:border-gray-800 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg transition-all transform hover:scale-110 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                  disabled={uploading}
                  title="Change profile picture"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
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
              {uploading && <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">{uploadError || 'Uploading...'}</div>}
            </div>

            {/* Form Fields Section */}
            <div className="flex-1 space-y-4 w-full">
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Name"
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && <div className="mb-4 p-3 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">{error}</div>}
          {success && <div className="mb-4 p-3 text-sm bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400">Profile updated!</div>}

          {/* Side-by-side Buttons */}
          <div className="flex flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors text-sm sm:text-base"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 font-medium transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 

