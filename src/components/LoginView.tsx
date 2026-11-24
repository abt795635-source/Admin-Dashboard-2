import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, PackageCheck, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginViewProps {
  appName: string;
}

export function LoginView({ appName }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Enter both your admin email address and password.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        setErrorMessage(error.message || 'Invalid email or password.');
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to reach authentication service.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col justify-center items-center px-6 py-12">
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-white border border-black/[0.08] flex items-center justify-center mb-4">
            <PackageCheck className="w-6 h-6 text-[#0071E3]" strokeWidth={1.8} />
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight text-[#1D1D1F] leading-tight">
            {appName}
          </h1>
          <p className="mt-1.5 text-[15px] text-[#6E6E73]">
            Sign in to manage Cash-on-Delivery orders
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.08] p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {errorMessage && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-3.5 py-3 text-[13px] text-[#991B1B]"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="admin-email"
                className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#F5F5F7]/70 border border-black/[0.1] text-[14px] text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:bg-white focus:border-[#0071E3] focus:ring-3 focus:ring-[#0071E3]/15 transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-11 pl-10 pr-11 rounded-xl bg-[#F5F5F7]/70 border border-black/[0.1] text-[14px] text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:bg-white focus:border-[#0071E3] focus:ring-3 focus:ring-[#0071E3]/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.04] transition-colors focus-visible:outline-2 focus-visible:outline-[#0071E3]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] active:bg-[#0066CC] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[14px] font-medium transition-colors flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071E3] whitespace-nowrap"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[12px] text-[#86868B]">
          Authenticated via Supabase · Orders table access requires an admin account
        </p>
      </div>
    </div>
  );
}
