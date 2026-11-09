import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Shield, AlertCircle, Server, RefreshCw, Lock, Zap, ShieldCheck } from 'lucide-react';
import {
  authenticateWithGoogle,
  fetchPublicConfig,
  getApiOrigin,
  setApiOrigin,
  testBackendConnection
} from '../api';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  initialMode?: 'signin' | 'signup';
}

declare global {
  interface Window {
    google?: any;
  }
}

const DEFAULT_GOOGLE_CLIENT_ID = '506395453665-diof91lvuhuhp4kgji3umibrjunuthq8.apps.googleusercontent.com';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>(
    (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) ||
    (window as any).__RUNTIME_CONFIG__?.GOOGLE_CLIENT_ID ||
    DEFAULT_GOOGLE_CLIENT_ID
  );
  const [customApiUrl, setCustomApiUrl] = useState<string>(getApiOrigin());
  const [showApiConfig, setShowApiConfig] = useState<boolean>(false);
  const [apiTesting, setApiTesting] = useState<boolean>(false);
  const [apiSuccessMsg, setApiSuccessMsg] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPublicConfig()
      .then((cfg) => {
        if (cfg?.google_client_id) {
          setClientId(cfg.google_client_id);
        }
      })
      .catch((err) => {
        console.warn('Failed to load public config (backend may require configuration):', err);
      });
  }, []);

  const handleSaveApiUrl = async () => {
    setApiTesting(true);
    setError(null);
    setApiSuccessMsg(null);
    try {
      const cleanUrl = customApiUrl.trim().replace(/\/+$/, '');
      const res = await testBackendConnection(cleanUrl);
      if (res.ok) {
        setApiOrigin(cleanUrl);
        setApiSuccessMsg('Connected successfully! Backend is reachable.');
        fetchPublicConfig()
          .then((cfg) => {
            if (cfg?.google_client_id) {
              setClientId(cfg.google_client_id);
            }
          })
          .catch(() => {});
      } else {
        setError(`Cannot connect to backend: ${res.error || 'Server returned error status'}`);
      }
    } catch (err: any) {
      setError(err.message || 'Connection test failed');
    } finally {
      setApiTesting(false);
    }
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response || !response.credential) {
      setError('Google Sign-In was cancelled or failed.');
      return;
    }
    setLoading(true);
    setError(null);
    setApiSuccessMsg(null);
    try {
      const authRes = await authenticateWithGoogle({ id_token: response.credential });
      onLoginSuccess(authRes.user);
      onClose();
    } catch (err: any) {
      console.error('Google auth failed:', err);
      const is502 = String(err).includes('502');
      if (is502) {
        setError('Backend API unreachable (502 Bad Gateway). Please check the backend connection.');
        setShowApiConfig(true);
      } else {
        setError(err.message || 'Google authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !clientId) return;

    const init = () => {
      if (window.google?.accounts?.id && clientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'rectangular',
              width: 300,
            });
          }
        } catch (err) {
          console.error('Error initializing Google Identity:', err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      init();
    } else {
      const existingScript = document.getElementById('google-gsi-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-gsi-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => init();
        document.body.appendChild(script);
      } else {
        const poll = setInterval(() => {
          if (window.google?.accounts?.id) {
            clearInterval(poll);
            init();
          }
        }, 100);
        return () => clearInterval(poll);
      }
    }
  }, [isOpen, clientId]);

  const handleTriggerGooglePrompt = () => {
    setError(null);
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const btn = googleBtnRef.current?.querySelector('div[role="button"]') as HTMLElement;
          if (btn) {
            btn.click();
          } else {
            setError('Please click the Google button below.');
          }
        }
      });
    } else {
      setError('Google Sign-In is initializing. Please click below.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0B0C0E]/90 backdrop-blur-md animate-fadeIn select-none"
    >
      {/* Outer Card with subtle depth & textured border */}
      <div className="relative w-full max-w-[880px] bg-[#0C0D0E] border border-[#22242A] rounded-[32px] shadow-[0_25px_70px_rgba(0,0,0,0.85)] p-3 sm:p-4 overflow-hidden animate-scaleUp">
        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition cursor-pointer border border-neutral-800"
          aria-label="Close login dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 2-Column Split Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-stretch min-h-[500px]">
          {/* ========================================================= */}
          {/* LEFT PANEL: Iridescent Aurora Silk Wave Art & Typography */}
          {/* ========================================================= */}
          <div className="relative rounded-[24px] overflow-hidden bg-[#07070A] flex flex-col justify-between p-7 sm:p-8 min-h-[300px] md:min-h-[500px] shadow-inner border border-white/5">
            {/* Background Multi-Layer Iridescent Ribbon Wave SVG */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <svg
                viewBox="0 0 500 650"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full object-cover scale-105"
                preserveAspectRatio="xMidYMid slice"
              >
                <defs>
                  {/* Cosmic deep gradient */}
                  <linearGradient id="deepDark" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0B0914" />
                    <stop offset="40%" stopColor="#0E0D1B" />
                    <stop offset="70%" stopColor="#07070C" />
                    <stop offset="100%" stopColor="#030305" />
                  </linearGradient>

                  {/* Spectral ultraviolet to electric cyan ribbon */}
                  <linearGradient id="auroraSpectrum" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="18%" stopColor="#FB7185" />
                    <stop offset="38%" stopColor="#D946EF" />
                    <stop offset="58%" stopColor="#818CF8" />
                    <stop offset="80%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#0284C7" />
                  </linearGradient>

                  {/* Golden amber crest lighting */}
                  <linearGradient id="goldenCrest" x1="100%" y1="0%" x2="0%" y2="80%">
                    <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.95" />
                    <stop offset="30%" stopColor="#F59E0B" stopOpacity="0.9" />
                    <stop offset="60%" stopColor="#D97706" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#7C2D12" stopOpacity="0" />
                  </linearGradient>

                  {/* Soft deep violet glow */}
                  <radialGradient id="violetSwell" cx="70%" cy="30%" r="65%">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity="0.45" />
                    <stop offset="50%" stopColor="#A855F7" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>

                  <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="35" result="blur" />
                  </filter>
                  <filter id="crispGlow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#F59E0B" floodOpacity="0.6" />
                  </filter>
                </defs>

                {/* Base Obsidian Backdrop */}
                <rect width="100%" height="100%" fill="url(#deepDark)" />

                {/* Ambient Radial Color Swell */}
                <rect width="100%" height="100%" fill="url(#violetSwell)" />

                {/* Blurred Ambient Underwave */}
                <path
                  d="M120,-80 C260,60 380,180 480,360 C520,440 500,560 440,650 L520,650 L520,-80 Z"
                  fill="url(#auroraSpectrum)"
                  opacity="0.35"
                  filter="url(#softGlow)"
                />

                {/* Deep Silk Wave Folds */}
                <path
                  d="M0,280 C120,290 280,240 380,140 C440,80 490,10 520,-50 L520,650 L0,650 Z"
                  fill="#06070A"
                  opacity="0.88"
                />

                {/* Primary Iridescent Ribbon */}
                <path
                  d="M80,-50 C180,90 290,190 390,260 C440,295 470,330 480,380 C490,440 450,520 400,600 C370,640 320,670 280,690 L520,690 L520,-50 Z"
                  fill="url(#auroraSpectrum)"
                  opacity="0.75"
                />

                {/* Secondary Deep Indigo Sheen Fold */}
                <path
                  d="M0,450 C90,460 210,400 310,320 C380,260 440,180 490,80 L520,80 L520,650 L0,650 Z"
                  fill="#080A12"
                  opacity="0.75"
                />

                {/* Highlight Filament with Amber Edge */}
                <path
                  d="M100,-40 C200,95 305,195 400,265 C445,300 475,335 485,385"
                  stroke="url(#goldenCrest)"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  filter="url(#crispGlow)"
                />
              </svg>
            </div>

            {/* Top Left Brand Dot Badge */}
            <div className="relative z-10">
              <div className="w-9 h-9 rounded-full bg-black/70 border border-neutral-800 flex items-center justify-center backdrop-blur-md shadow-lg">
                <span className="text-[#FBBF24] font-bold text-sm tracking-tighter">cr.</span>
              </div>
            </div>

            {/* Bottom Left Hero Caption */}
            <div className="relative z-10 space-y-1.5 select-none">
              <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight leading-snug">
                Be a Part of <br />
                <span className="font-extrabold text-white">Something Beautiful</span>
              </h2>
              <p className="text-[11px] text-neutral-400 font-sans pt-1">
                Zero-Trust Deterministic Attack Path Correlation.
              </p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT PANEL: Pure Google OAuth Authentication Panel      */}
          {/* ========================================================= */}
          <div className="flex flex-col justify-between px-6 sm:px-10 py-6 sm:py-8 bg-[#0C0D0E] relative">
            <div className="max-w-[340px] w-full mx-auto space-y-6 my-auto">
              {/* Header Titles */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#17181C] border border-[#272930] text-[11px] font-medium text-neutral-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FBBF24]" />
                  <span>Enterprise Single Sign-On</span>
                </div>
                <h3 className="text-[26px] font-bold text-white tracking-tight">
                  Continue with Google
                </h3>
                <p className="text-xs text-neutral-400 font-normal leading-relaxed">
                  Sign in with your Google Workspace or personal account to access ChainedRisk.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-start gap-2 animate-fadeIn font-sans">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-tight">{error}</span>
                </div>
              )}

              {/* Success Message */}
              {apiSuccessMsg && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-200 text-xs flex items-start gap-2 animate-fadeIn font-sans">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-tight">{apiSuccessMsg}</span>
                </div>
              )}

              {/* API Configuration Panel (Opens on 502 or via toggle) */}
              {showApiConfig && (
                <div className="p-3 bg-[#131418] border border-[#2D3039] rounded-xl space-y-2 animate-fadeIn font-sans text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-[#FBBF24]" /> Backend API Endpoint
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowApiConfig(false)}
                      className="text-neutral-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-tight">
                    Specify your Render backend URL if reverse-proxying is unreachable:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={customApiUrl}
                      onChange={(e) => setCustomApiUrl(e.target.value)}
                      placeholder="https://chainedrisk.onrender.com"
                      className="flex-1 bg-[#1C1E24] border border-[#333640] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-[#FBBF24]"
                    />
                    <button
                      type="button"
                      disabled={apiTesting}
                      onClick={handleSaveApiUrl}
                      className="px-3 py-1.5 bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-semibold rounded-lg text-xs flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      {apiTesting ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Connect'}
                    </button>
                  </div>
                </div>
              )}

              {/* Primary Amber Google OAuth Action Button */}
              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={handleTriggerGooglePrompt}
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-[#FBBF24] hover:bg-[#F59E0B] active:bg-[#D97706] text-black font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_24px_rgba(251,191,36,0.28)] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#1A1A1A"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#1A1A1A"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#1A1A1A"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#1A1A1A"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{loading ? 'Authenticating with Google...' : 'Sign in with Google'}</span>
                </button>

                {/* Rendered Google Identity Services Official Button */}
                <div className="flex justify-center w-full min-h-[44px]">
                  <div ref={googleBtnRef} className="w-full flex justify-center" />
                </div>
              </div>

              {/* Zero-Trust Security Micro-Bullets */}
              <div className="pt-2 border-t border-[#1C1E24] space-y-2 text-[11px] text-neutral-400">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                  <span>Zero manual passwords to manage or leak</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                  <span>Google OAuth 2.0 & OIDC cryptographic verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                  <span>Instant personalized workspace & RBAC provisioning</span>
                </div>
              </div>
            </div>

            {/* Bottom Footer API Endpoint Toggle */}
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => setShowApiConfig(!showApiConfig)}
                className="text-[11px] text-neutral-600 hover:text-neutral-400 inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <Server className="w-3 h-3" />
                <span>API Connection Endpoint</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
