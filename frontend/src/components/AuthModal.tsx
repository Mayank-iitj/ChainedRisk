import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Shield, AlertCircle, ArrowRight, Server, RefreshCw } from 'lucide-react';
import {
  authenticateWithGoogle,
  fetchPublicConfig,
  loginUser,
  registerUser,
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
  initialMode = 'signin'
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('aimerpaix@gmail.com');
  const [password, setPassword] = useState('••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>(
    (window as any).__RUNTIME_CONFIG__?.GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID
  );
  const [customApiUrl, setCustomApiUrl] = useState<string>(getApiOrigin());
  const [showApiConfig, setShowApiConfig] = useState<boolean>(false);
  const [apiTesting, setApiTesting] = useState<boolean>(false);
  const [apiSuccessMsg, setApiSuccessMsg] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your email.');
      return;
    }
    setLoading(true);
    setError(null);
    setApiSuccessMsg(null);
    try {
      if (mode === 'signin') {
        const authRes = await loginUser(email, password || 'password123');
        onLoginSuccess(authRes.user);
        onClose();
      } else {
        const username = email.split('@')[0] || `user_${Date.now()}`;
        const authRes = await registerUser({
          username,
          email,
          password: password || 'password123',
          full_name: email.split('@')[0],
          org_name: 'Apex SecCorp'
        });
        onLoginSuccess(authRes.user);
        onClose();
      }
    } catch (err: any) {
      console.error('Authentication failed:', err);
      const is502 = String(err).includes('502');
      if (is502) {
        setError('Backend API unreachable (502 Bad Gateway). Please verify your Backend URL below.');
        setShowApiConfig(true);
      } else {
        setError(err.message || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
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
        setError('Backend API unreachable (502 Bad Gateway). Please verify your Backend URL below.');
        setShowApiConfig(true);
      } else {
        setError(err.message || 'Google authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerGooglePrompt = () => {
    setError(null);
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If prompt notification is not displayed automatically, trigger the rendered GSI button
          const btn = googleBtnRef.current?.querySelector('div[role="button"]') as HTMLElement;
          if (btn) {
            btn.click();
          } else {
            setError('Please click the Google Sign-In button below.');
          }
        }
      });
    } else {
      setError('Google Sign-In is initializing. Please click the Google button below.');
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
        {/* Subtle Close Button Top Right */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition cursor-pointer border border-neutral-800"
          aria-label="Close login dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 2-Column Split Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-stretch min-h-[520px]">
          {/* ========================================================= */}
          {/* LEFT PANEL: Iridescent Aurora Silk Wave Art & Typography */}
          {/* ========================================================= */}
          <div className="relative rounded-[24px] overflow-hidden bg-[#07070A] flex flex-col justify-between p-7 sm:p-8 min-h-[300px] md:min-h-[520px] shadow-inner border border-white/5">
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

                {/* Deep Silk Wave Folds (Shadows) */}
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

                {/* Brilliant Golden Edge Rim Lighting */}
                <path
                  d="M160,-40 Q310,140 410,230 Q460,280 475,340 Q490,410 440,510"
                  stroke="url(#goldenCrest)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  filter="url(#crispGlow)"
                />

                {/* Ultra-Fine Ethereal Accent Streak */}
                <path
                  d="M200,-40 C320,120 420,210 460,270 C485,310 492,360 470,430"
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                  opacity="0.85"
                  strokeLinecap="round"
                />

                {/* Subtle Amber Horizon Particle Shimmer */}
                <circle cx="430" cy="245" r="1.5" fill="#FDE68A" opacity="0.9" />
                <circle cx="450" cy="275" r="1" fill="#FDE68A" opacity="0.7" />
                <circle cx="380" cy="210" r="1.5" fill="#FFFFFF" opacity="0.8" />
              </svg>

              {/* Gentle Vignette Overlays for Maximum Contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/20 pointer-events-none" />
            </div>

            {/* Top-Left Circular Brand Badge (matches 'a.' in the reference image) */}
            <div className="relative z-20 flex items-center justify-between">
              <div className="w-9 h-9 rounded-full bg-black/90 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg group">
                <span className="text-[#FBBF24] font-black text-sm tracking-tighter lowercase select-none">
                  c.
                </span>
              </div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-white/50 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/5">
                ChainedRisk
              </span>
            </div>

            {/* Bottom-Left Typography (matches "Be a Part of Something Beautiful") */}
            <div className="relative z-20 space-y-1 mt-auto pt-24">
              <h2 className="text-[32px] sm:text-[36px] leading-[1.12] font-light text-white tracking-tight">
                Be a Part of<br />
                <span className="font-light text-white/95">Something </span>
                <span className="font-extrabold text-white">Beautiful</span>
              </h2>
              <p className="text-[11px] text-neutral-400 font-sans pt-1">
                Zero-Trust Deterministic Attack Path Correlation.
              </p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT PANEL: Clean Dark Obsidian Login Form              */}
          {/* ========================================================= */}
          <div className="flex flex-col justify-center px-6 sm:px-10 py-6 sm:py-8 bg-[#0C0D0E] relative">
            <div className="max-w-[340px] w-full mx-auto space-y-6">
              {/* Header Titles */}
              <div className="text-center space-y-1.5">
                <h3 className="text-[26px] font-bold text-white tracking-tight">
                  {mode === 'signin' ? 'Login' : 'Create an account'}
                </h3>
                <p className="text-xs text-neutral-400 font-normal">
                  Enter your credentials to access your account
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
                    Specify the direct backend API origin (e.g. your Render backend service URL) if reverse-proxying is unreachable:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={customApiUrl}
                      onChange={(e) => setCustomApiUrl(e.target.value)}
                      placeholder="https://chainedrisk-api.onrender.com"
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

              {/* Form Inputs */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="aimerpaix@gmail.com"
                    required
                    className="w-full bg-[#17181C] border border-[#272930] hover:border-[#3A3C44] focus:border-[#FBBF24] focus:ring-1 focus:ring-[#FBBF24] rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-500 outline-none transition duration-150 font-sans"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#17181C] border border-[#272930] hover:border-[#3A3C44] focus:border-[#FBBF24] focus:ring-1 focus:ring-[#FBBF24] rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-500 outline-none transition duration-150 font-sans tracking-widest"
                  />
                </div>

                {/* Remember Me Checkbox & API settings link */}
                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      onClick={() => setRememberMe(!rememberMe)}
                      className={`w-4 h-4 rounded border transition flex items-center justify-center cursor-pointer ${
                        rememberMe
                          ? 'bg-[#FBBF24] border-[#FBBF24] text-black'
                          : 'bg-[#17181C] border-[#363842]'
                      }`}
                    >
                      {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <label
                      onClick={() => setRememberMe(!rememberMe)}
                      className="text-xs text-neutral-400 cursor-pointer select-none font-normal"
                    >
                      Remember me
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowApiConfig(!showApiConfig)}
                    className="text-[11px] text-neutral-500 hover:text-neutral-300 flex items-center gap-1 cursor-pointer transition"
                  >
                    <Server className="w-3 h-3" />
                    <span>API Endpoint</span>
                  </button>
                </div>

                {/* Primary Amber Login Button (identical to reference photo) */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#FBBF24] hover:bg-[#F59E0B] active:bg-[#D97706] text-black font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_24px_rgba(251,191,36,0.28)] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  <span>{loading ? 'Authenticating...' : mode === 'signin' ? 'Login' : 'Create Account'}</span>
                </button>
              </form>

              {/* Rendered Google Identity Services Button */}
              <div className="pt-1 flex flex-col items-center">
                <div ref={googleBtnRef} className="min-h-[44px] flex justify-center w-full" />
              </div>

              {/* Footer Switcher */}
              <div className="text-center text-xs text-neutral-400 pt-1">
                {mode === 'signin' ? (
                  <>
                    Not a member?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        setError(null);
                      }}
                      className="text-[#FBBF24] hover:underline font-semibold cursor-pointer ml-0.5"
                    >
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setError(null);
                      }}
                      className="text-[#FBBF24] hover:underline font-semibold cursor-pointer ml-0.5"
                    >
                      Login
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
