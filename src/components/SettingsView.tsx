import React, { useState, useEffect } from 'react';
import { Check, RotateCcw, LogOut } from 'lucide-react';
import { DEFAULT_APP_NAME, SUPABASE_URL } from '../lib/supabase';

interface SettingsViewProps {
  appName: string;
  onSaveAppName: (nextName: string) => Promise<void>;
  userEmail: string;
  onSignOut: () => void;
}

export function SettingsView({
  appName,
  onSaveAppName,
  userEmail,
  onSignOut,
}: SettingsViewProps) {
  const [draftName, setDraftName] = useState(appName);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setDraftName(appName);
  }, [appName]);

  const trimmed = draftName.trim();
  const isDirty = trimmed !== appName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetName = trimmed || DEFAULT_APP_NAME;
    setSaving(true);
    try {
      await onSaveAppName(targetName);
      setDraftName(targetName);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2200);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      await onSaveAppName(DEFAULT_APP_NAME);
      setDraftName(DEFAULT_APP_NAME);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2200);
    } finally {
      setSaving(false);
    }
  };

  const hostLabel = (() => {
    try {
      return new URL(SUPABASE_URL).hostname;
    } catch {
      return SUPABASE_URL;
    }
  })();

  return (
    <div className="max-w-2xl space-y-6">
      {/* Application Branding */}
      <section className="bg-white rounded-2xl border border-black/[0.08] p-6 sm:p-8">
        <h2 className="text-[17px] font-semibold text-[#1D1D1F]">
          Application Branding
        </h2>
        <p className="mt-1 text-[13.5px] text-[#6E6E73]">
          Customize the workspace name displayed in the sidebar, header, sign-in screen, and browser title.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="app-name-input"
              className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
            >
              Application name
            </label>
            <input
              id="app-name-input"
              type="text"
              maxLength={48}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder={DEFAULT_APP_NAME}
              className="w-full h-11 px-3.5 rounded-xl bg-[#F5F5F7]/70 border border-black/[0.1] text-[14px] text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:bg-white focus:border-[#0071E3] focus:ring-3 focus:ring-[#0071E3]/15 transition-all"
            />
            <p className="mt-1.5 text-[12px] text-[#86868B]">
              Preview: <span className="text-[#1D1D1F] font-medium">{trimmed || DEFAULT_APP_NAME}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="submit"
              disabled={saving || (!isDirty && trimmed.length > 0)}
              className="h-10 px-4 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13.5px] font-medium transition-colors inline-flex items-center gap-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071E3]"
            >
              {savedNotice ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved</span>
                </>
              ) : (
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              )}
            </button>

            {appName !== DEFAULT_APP_NAME && (
              <button
                type="button"
                disabled={saving}
                onClick={handleReset}
                className="h-10 px-4 rounded-xl border border-black/[0.1] hover:bg-[#F5F5F7] text-[#1D1D1F] text-[13.5px] font-medium transition-colors inline-flex items-center gap-2 whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#6E6E73]" />
                <span>Reset to Default</span>
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Admin Session & Workspace Details */}
      <section className="bg-white rounded-2xl border border-black/[0.08] p-6 sm:p-8">
        <h2 className="text-[17px] font-semibold text-[#1D1D1F]">
          Account &amp; Workspace
        </h2>
        <p className="mt-1 text-[13.5px] text-[#6E6E73]">
          Active administrator session and connected Supabase project.
        </p>

        <div className="mt-5 divide-y divide-black/[0.06] text-[13.5px]">
          <div className="py-3 flex items-center justify-between gap-4">
            <span className="text-[#6E6E73]">Signed-in admin</span>
            <span className="font-medium text-[#1D1D1F]">{userEmail}</span>
          </div>
          <div className="py-3 flex items-center justify-between gap-4">
            <span className="text-[#6E6E73]">Data source</span>
            <span className="font-mono text-[12.5px] text-[#1D1D1F]">{hostLabel}</span>
          </div>
          <div className="py-3 flex items-center justify-between gap-4">
            <span className="text-[#6E6E73]">Orders table</span>
            <span className="font-mono text-[12.5px] text-[#1D1D1F]">public.orders</span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-black/[0.06]">
          <button
            type="button"
            onClick={onSignOut}
            className="h-10 px-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B91C1C] text-[13.5px] font-medium transition-colors inline-flex items-center gap-2 whitespace-nowrap"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </section>
    </div>
  );
}
