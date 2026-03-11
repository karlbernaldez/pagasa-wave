import { useEffect, useRef } from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';

const SITE_KEY  = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
const SCRIPT_ID = 'recaptcha-v2-script';
const CALLBACK  = '__onRecaptchaLoad__';

/**
 * Props:
 *   onVerify  (token: string | null) => void
 */
const CaptchaWidget = ({ onVerify }) => {
  const containerRef = useRef(null);
  const widgetIdRef  = useRef(null);

  useEffect(() => {
    if (!SITE_KEY) {
      console.error('[CaptchaWidget] VITE_RECAPTCHA_SITE_KEY is not set.');
      return;
    }

    const renderWidget = () => {
      if (!containerRef.current || widgetIdRef.current !== null) return;
      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey:            SITE_KEY,
        theme:              'dark',
        callback:           (token) => onVerify(token),
        'expired-callback': ()      => onVerify(null),
        'error-callback':   ()      => onVerify(null),
      });
    };

    if (window.grecaptcha?.render) {
      window.grecaptcha.ready(renderWidget);
      return;
    }

    window[CALLBACK] = () => window.grecaptcha.ready(renderWidget);

    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id    = SCRIPT_ID;
      script.src   = `https://www.google.com/recaptcha/api.js?onload=${CALLBACK}&render=explicit`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    return () => { delete window[CALLBACK]; };
  }, [onVerify]);

  const resetWidget = () => {
    if (widgetIdRef.current !== null) {
      window.grecaptcha?.reset(widgetIdRef.current);
      onVerify(null);
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <label className="font-mono-ibm text-cyan-300/70 text-xs tracking-widest uppercase flex items-center gap-2">
          <ShieldCheck size={13} className="text-cyan-400/60" aria-hidden="true" />
          Verification
        </label>
        <button
          type="button"
          onClick={resetWidget}
          className="flex items-center gap-1 font-mono-ibm text-[10px] text-slate-500 hover:text-cyan-400/60 transition-colors"
        >
          <RefreshCw size={10} />
          Reset
        </button>
      </div>

      {/* reCAPTCHA container — wrapped to contain the iframe */}
      <div
        className="rounded-xl overflow-hidden border border-white/5 bg-black/20"
        aria-label="reCAPTCHA verification"
      >
        <div ref={containerRef} />
      </div>
    </div>
  );
};

export default CaptchaWidget;