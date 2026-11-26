'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/components/providers/app-provider';

export function ProfileView() {
  const { user, firebaseUser, updateUser, pushToast } = useApp();

  const [draftName, setDraftName] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const currentName =
    draftName ??
    user?.fullName ??
    firebaseUser?.displayName ??
    firebaseUser?.email?.split('@')[0] ??
    '';
  const currentEmail = user?.email ?? firebaseUser?.email ?? '';
  const persistedAvatar = user?.avatarUrl || firebaseUser?.photoURL || '';
  const displayedAvatar = avatarPreviewUrl || persistedAvatar;
  const avatarInitial =
    (currentName.trim()[0] || currentEmail.trim()[0] || 'U').toUpperCase();

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      pushToast({
        title: 'Invalid image',
        description: 'Please select an image file (PNG, JPG, WebP, or GIF).',
        variant: 'error',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      pushToast({
        title: 'File too large',
        description: 'Avatar image must be smaller than 5 MB.',
        variant: 'error',
      });
      return;
    }

    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    setAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = currentName.trim();
    if (!trimmedName || !currentEmail.trim() || saving) return;

    setSaving(true);
    try {
      await updateUser({
        fullName: trimmedName,
        email: currentEmail.trim(),
        roleTitle: user?.roleTitle || 'Workspace Owner',
        avatarFile,
      });
      setDraftName(null);
      setAvatarFile(null);
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
        setAvatarPreviewUrl(null);
      }
      pushToast({
        title: 'Profile updated',
        description: 'Your account details have been saved.',
        variant: 'success',
      });
    } catch (err) {
      // If avatar upload failed (e.g., storage permissions), still save the name update
      if (avatarFile) {
        try {
          await updateUser({
            fullName: trimmedName,
            email: currentEmail.trim(),
            roleTitle: user?.roleTitle || 'Workspace Owner',
          });
          setDraftName(null);
          pushToast({
            title: 'Name saved, avatar upload unavailable',
            description:
              err instanceof Error
                ? err.message
                : 'Your display name was saved, but image storage is not enabled.',
            variant: 'error',
          });
          return;
        } catch (innerErr) {
          pushToast({
            title: 'Failed to update profile',
            description:
              innerErr instanceof Error ? innerErr.message : 'Please try again.',
            variant: 'error',
          });
          return;
        }
      }

      pushToast({
        title: 'Failed to update profile',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Profile
        </h1>
        <p className="mt-1 text-sm font-normal text-gray-500">
          View and update your account details
        </p>
      </div>

      <div className="max-w-xl space-y-8">
        <div className="flex items-start gap-5">
          <div className="inline-flex flex-col space-y-2">
            <div className="inline-flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-400">
              {displayedAvatar ? (
                <img
                  src={displayedAvatar}
                  alt={currentName || 'Profile avatar'}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <p className="text-4xl font-medium text-white">{avatarInitial}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="profilePic"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Avatar
            </label>
            <div className="relative">
              <input
                id="profilePic"
                type="file"
                accept="image/*"
                aria-label="Avatar"
                disabled={saving}
                onChange={handleAvatarChange}
                className="min-w-0 rounded-md bg-white px-1.5 py-1 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:px-2 file:py-1 file:font-semibold file:transition-all file:duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Name
                </label>
              </div>
              <div className="mt-2">
                <div className="relative">
                  <input
                    id="name"
                    name="name"
                    aria-label="Name"
                    type="text"
                    required
                    disabled={saving}
                    placeholder="John"
                    value={currentName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="block w-full rounded-xl border-0 bg-white px-3 py-2 text-gray-900 caret-blue-600 shadow-sm ring-1 ring-inset ring-gray-300 transition-all duration-150 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium leading-6 text-gray-900 after:ml-0.5 after:text-red-500 after:content-['*']"
                >
                  Email
                </label>
              </div>
              <div className="mt-2">
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    aria-label="Email"
                    required
                    type="email"
                    placeholder="you@example.com"
                    disabled
                    value={currentEmail}
                    className="block w-full rounded-xl border-0 bg-white px-3 py-2 text-gray-900 caret-blue-600 shadow-sm ring-1 ring-inset ring-gray-300 transition-all duration-150 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Contact support@cadence.ai to change the email address.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving || !currentName.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
