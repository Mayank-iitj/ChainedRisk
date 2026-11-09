import React, { useState, useEffect, useRef } from 'react';
import { X, Shield, CheckCircle2, AlertCircle, ArrowRight, Lock } from 'lucide-react';
import { fetchGoogleConfig, authenticateWithGoogle } from '../api';
import { UserProfile } from '../types';

declare global {
  interface Window {
    google?: any;
  }
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signin'
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>('506395453665-diof91lvuhuhp4kgji3umibrjunuthq8.apps.googleusercontent.com');
  const [gisLoaded, setGisLoaded] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
  }, [initialMode, isOpen]);

  // Fetch Google Client ID on mount
  useEffect(() => {
    let mounted = true;
    fetchGoogleConfig()
      .then((cfg) => {
        if (mounted && cfg?.client_id) {
          setClientId(cfg.client_id);
        }
      })
      .catch((err) => console.warn('Could not fetch Google config:', err));
    return () => {
      mounted = false;
    };
  }, []);

  // Initialize and render Google Identity Services button if available
  useEffect(() => {
    if (!isOpen) return;

    const checkGis = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        setGisLoaded(true);
        if (clientId && googleBtnRef.current) {
          try {
            window.google.accounts.id.initialize({
              client_id: clientId,
              callback: handleCredentialResponse,
              auto_select: false,
              cancel_on_tap_outside: true,
            });
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              type: 'standard',
              theme: 'filled_black',
              size: 'large',
              text: mode === 'signup' ? 'signup_with' : 'signin_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              width: 380,
            });
          } catch (e) {
            console.warn('Google Identity button render error:', e);
          }
        }
      }
    };

    checkGis();
    const interval = setInterval(checkGis, 500);
    return () => clearInterval(interval);
  }, [isOpen, clientId, mode]);

  if (!isOpen) return null;

  const handleCredentialResponse = async (response: any) => {
    if (!response || !response.credential) {
      setError('Google Sign-In was cancelled or failed to return a credential.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await authenticateWithGoogle({ id_token: response.credential });
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google authentication failed. Please verify token or configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerGooglePrompt = () => {
    if (typeof window !== 'undefined' && window.google?.accounts?.id && clientId) {
      try {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.info('Google One-Tap notification:', notification.getNotDisplayedReason?.() || 'skipped');
          }
        });
      } catch (e) {
        console.warn('Google prompt error:', e);
      }
    } else {
      setError('Google Identity Services SDK is initializing. Please click the Google Sign-In button above.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-md bg-[#121821] rounded-xl shadow-2xl border border-[#1F2A37] overflow-hidden transform transition-all text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="bg-[#0B0F14] text-white px-7 py-6 relative border-b border-[#1F2A37]">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Shield className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-[11px] font-mono tracking-widest uppercase text-indigo-400 font-bold">
              IDENTITY PROTOCOL
            </span>
          </div>

          <h3 className="text-xl font-bold tracking-tight text-slate-100 font-mono">
            {mode === 'signin' ? 'Sign In with Google' : 'Create Account with Google'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Enterprise authentication strictly enforced via Google OAuth 2.0.
          </p>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 mt-5 p-1 bg-[#121821] rounded-lg border border-[#1F2A37]">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              New Enclave
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-red-950/60 border border-red-800/80 text-red-300 text-xs font-mono rounded-lg flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {/* Modal Main Content */}
        <div className="p-7 space-y-6">
          <div className="space-y-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 text-center flex items-center justify-center gap-2">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Google Cloud Identity Platform</span>
            </div>

            {/* Official Google Identity Button Mount */}
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-full flex justify-center py-1">
                <div ref={googleBtnRef} className="min-h-[44px] flex justify-center w-full" />
              </div>

              {/* Custom Google Styled Button */}
              <button
                type="button"
                disabled={loading}
                onClick={handleTriggerGooglePrompt}
                className="w-full py-3 px-4 bg-[#0B0F14] hover:bg-[#1A2230] border border-[#1F2A37] hover:border-indigo-500/80 rounded-lg text-xs font-mono uppercase tracking-wider text-slate-100 transition shadow-lg flex items-center justify-center gap-3 cursor-pointer group disabled:opacity-50"
              >
                {/* Google 'G' Logo SVG */}
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{loading ? 'AUTHENTICATING...' : `LAUNCH GOOGLE AUTH (${mode === 'signup' ? 'REGISTER' : 'SIGN IN'})`}</span>
                <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition" />
              </button>
            </div>
          </div>

          {/* Telemetry info card */}
          <div className="p-3.5 bg-[#0B0F14] border border-[#1F2A37] rounded-lg space-y-1.5 font-mono text-[10px]">
            <div className="flex items-center justify-between text-slate-400">
              <span>CLIENT ID:</span>
              <span className="text-slate-200">{clientId ? `${clientId.slice(0, 18)}...` : 'Initializing'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>SECURITY SCOPE:</span>
              <span className="text-emerald-400 font-bold">openid, email, profile</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>POLICY:</span>
              <span className="text-indigo-400 font-bold">GOOGLE OAUTH ONLY (NO DEMO)</span>
            </div>
          </div>

          {/* Onboarding Notice */}
          <div className="p-3 bg-[#0B0F14] border border-indigo-900/40 rounded-lg flex items-start gap-2.5 text-[11px] text-slate-300 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              New accounts trigger the <strong>3-Step Security Enclave Onboarding</strong> to map your custom DMZ and internal crown-jewel scope.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
