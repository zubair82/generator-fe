import React, { useState, useRef } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, Info, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';

interface UpdateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpdateProfileModal({ isOpen, onClose }: UpdateProfileModalProps) {
  const { user, token, updateUser } = useAuth();
  const { addToast } = useUI();

  // Resolve teacher id from user object
  const teacherId = user?.teacher_id || user?.id || '';

  // Form states initialized with existing user values
  const [displayName, setDisplayName] = useState(user?.display_name || user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [upiId, setUpiId] = useState(user?.upi_id || '');
  const [phone, setPhone] = useState(user?.phone || user?.phone_number || '');

  // Banner image states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.banner_path || null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isBannerUploaded, setIsBannerUploaded] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        addToast('Please select a valid image file (PNG, JPG, WebP)', 'error');
        return;
      }
      setSelectedFile(file);
      setIsBannerUploaded(false);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleUploadBanner = async () => {
    if (!selectedFile) {
      addToast('Please choose an image file first', 'warning');
      return;
    }
    if (!teacherId) {
      addToast('Teacher ID not found. Please log in again.', 'error');
      return;
    }

    try {
      setIsUploadingBanner(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/upload-banner/${teacherId}`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to upload banner (Status ${response.status})`);
      }

      setIsBannerUploaded(true);
      addToast('Banner uploaded successfully!', 'success');
    } catch (err: any) {
      console.error('Banner upload error:', err);
      addToast(err.message || 'Error uploading banner image', 'error');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      addToast('Display Name is required', 'warning');
      return;
    }

    try {
      setIsUpdatingProfile(true);
      const authUrl = import.meta.env.VITE_AUTH_URL || 'http://localhost:8000';
      const bannerPath = teacherId ? `/banner/${teacherId}` : (user?.banner_path || '');

      const payload = {
        display_name: displayName.trim(),
        bio: bio.trim(),
        upi_id: upiId.trim(),
        phone: phone.trim(),
        banner_path: bannerPath
      };

      const authToken = token || localStorage.getItem('auth_token');
      const response = await fetch(`${authUrl}/api/v1/teacher/details`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to update profile (Status ${response.status})`);
      }

      // Update state in context
      if (updateUser) {
        updateUser({
          display_name: displayName.trim(),
          bio: bio.trim(),
          upi_id: upiId.trim(),
          phone: phone.trim(),
          banner_path: bannerPath
        });
      }

      addToast('Profile updated successfully!', 'success');
      onClose();
    } catch (err: any) {
      console.error('Update profile error:', err);
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between sticky top-0 bg-white dark:bg-[#252b3b] z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Update Profile
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customize your educator branding, payout details, and student banner
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Form */}
        <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
          {/* Educator Summary Header */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#1a1e29] border border-slate-200/80 dark:border-slate-700/50">
            <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {(displayName || user?.name || 'T').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {displayName || user?.name || 'Educator'}
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  {user?.role || 'TEACHER'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {user?.email || 'educator@examsimula.com'}
              </p>
            </div>
          </div>

          {/* Banner Upload Area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Channel & Storefront Banner
              </label>
              <span className="text-[11px] font-semibold text-slate-400">
                Fixed 5:1 (1200 &times; 240px)
              </span>
            </div>

            {/* Banner Dropzone / Preview */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full aspect-[5/1] rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50 dark:bg-[#1a1e29] overflow-hidden flex flex-col items-center justify-center cursor-pointer group transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />

              {previewUrl ? (
                <div className="relative w-full h-full">
                  <img
                    src={previewUrl}
                    alt="Banner preview"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-2">
                    <ImageIcon className="w-4 h-4" />
                    <span>Change Image</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Click to upload channel banner
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Recommended: 1200 &times; 240px (Fixed 5:1 ratio &bull; PNG, JPG, WebP up to 5MB)
                  </p>
                </div>
              )}
            </div>

            {/* Banner Action Bar */}
            <div className="flex items-center justify-between mt-2.5">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                <Info className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-[11px]">
                  Tutor Tip: Upload a 1200x240px banner to promote your YouTube channel, batches, or brand when students view your tests.
                </span>
              </div>

              {/* Upload Button */}
              <button
                type="button"
                onClick={handleUploadBanner}
                disabled={!selectedFile || isUploadingBanner || isBannerUploaded}
                className="shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                {isUploadingBanner ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : isBannerUploaded ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Uploaded</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload Banner</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Display Name *
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Zubair Ahmad"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a1e29] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* UPI ID */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                UPI ID (for Student Test Payouts)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. yourname@okhdfcbank"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a1e29] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
              />
            </div>

            {/* Phone Number */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a1e29] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Bio */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Bio & Credentials
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Briefly describe your teaching experience, subjects, institutions, or achievements..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a1e29] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdatingProfile}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUpdatingProfile ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <span>Update Profile</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

