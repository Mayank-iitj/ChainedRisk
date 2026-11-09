import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, X, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { authenticateWithGoogle, fetchPublicConfig } from '../api';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

const DEFAULT_GOOGLE_CLIENT_ID = '506395453665-diof91lvuhuhp4kgji3umibrjunuthq8.apps.googleusercontent.com';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>(DEFAULT_GOOGLE_CLIENT_ID);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPublicConfig()
      .then((cfg) => {
        if (cfg?.google_client_id) {
          setClientId(cfg.google_client_id);
        }
      })
      .catch((err) => console.error('Failed to load public config:', err));
  }, []);

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
              text: mode === 'signin' ? 'signin_with' : 'signup_with',
              shape: 'rectangular',
              width: 320,
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
  }, [isOpen, clientId, mode]);

  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response || !response.credential) {
      setError('Google Sign-In was cancelled or failed.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const authRes = await authenticateWithGoogle({ id_token: response.credential });
      onLoginSuccess(authRes.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerGooglePrompt = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setError('Google Sign-In prompt was skipped or blocked by browser. Please use the button directly.');
        }
      });
    } else {
      setError('Google Sign-In script is still initializing. Please retry in a moment.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn select-none"
    >
      <div className="bg-[#0A0A0A] border border-[#262626] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative animate-scaleUp">
        {/* Header Banner */}
        <div className="bg-black text-white px-7 py-6 relative border-b border-[#262626]">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-neutral-400 hover:text-white transition p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-black border border-white flex items-center justify-center text-white">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-[11px] font-mono tracking-widest uppercase text-white font-bold">
              IDENTITY PROTOCOL
            </span>
          </div>

          <h3 className="text-xl font-bold tracking-tight text-white font-mono">
            {mode === 'signin' ? 'Sign In with Google' : 'Create Account with Google'}
          </h3>
          <p className="text-xs text-neutral-400 mt-1 font-mono">
            Enterprise authentication strictly enforced via Google OAuth 2.0.
          </p>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 mt-5 p-1 bg-black rounded-lg border border-[#262626]">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white text-black font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-black font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              New Enclave
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-black border border-white text-white text-xs font-mono rounded-lg flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {/* Modal Main Content */}
        <div className="p-7 space-y-6">
          <div className="space-y-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 text-center flex items-center justify-center gap-2">
              <Lock className="w-3.5 h-3.5 text-white" />
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
                className="w-full py-3 px-4 bg-white hover:bg-neutral-200 border border-white rounded-lg text-xs font-mono uppercase tracking-wider text-black font-bold transition shadow-lg flex items-center justify-center gap-3 cursor-pointer group disabled:opacity-50"
              >
                <span>{loading ? 'AUTHENTICATING...' : `LAUNCH GOOGLE AUTH (${mode === 'signup' ? 'REGISTER' : 'SIGN IN'})`}</span>
                <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition" />
              </button>
            </div>
          </div>

          {/* Telemetry info card */}
          <div className="p-3.5 bg-black border border-[#262626] rounded-lg space-y-1.5 font-mono text-[10px]">
            <div className="flex items-center justify-between text-neutral-400">
              <span>CLIENT ID:</span>
              <span className="text-white">{clientId ? `${clientId.slice(0, 18)}...` : 'Initializing'}</span>
            </div>
            <div className="flex items-center justify-between text-neutral-400">
              <span>SECURITY SCOPE:</span>
              <span className="text-white font-bold">openid, email, profile</span>
            </div>
            <div className="flex items-center justify-between text-neutral-400">
              <span>POLICY:</span>
              <span className="text-white font-bold">GOOGLE OAUTH ONLY (NO DEMO)</span>
            </div>
          </div>

          {/* Onboarding Notice */}
          <div className="p-3 bg-black border border-[#262626] rounded-lg flex items-start gap-2.5 text-[11px] text-neutral-300 font-mono">
            <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
            <div>
              New accounts trigger the <strong>3-Step Security Enclave Onboarding</strong> to map your custom DMZ and internal crown-jewel scope.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
