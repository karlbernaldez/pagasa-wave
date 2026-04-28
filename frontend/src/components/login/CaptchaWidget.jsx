import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { tokens } from '@/styles/tokens';

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
const SCRIPT_ID = 'recaptcha-v2-script';
const CALLBACK = '__onRecaptchaLoad__';
const { colors } = tokens;

function loadRecaptchaScript() {
  if (window.grecaptcha?.render) {
    return Promise.resolve(window.grecaptcha);
  }

  if (window.__recaptchaLoadPromise__) {
    return window.__recaptchaLoadPromise__;
  }

  window.__recaptchaLoadPromise__ = new Promise((resolve, reject) => {
    window[CALLBACK] = () => {
      window.grecaptcha.ready(() => resolve(window.grecaptcha));
    };

    const existingScript = document.getElementById(SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?onload=${CALLBACK}&render=explicit`;
    script.async = true;
    script.defer = true;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return window.__recaptchaLoadPromise__;
}

/**
 * Props:
 *   onVerify  (token: string | null) => void
 *
 * Ref handle:
 *   reset()  — resets the widget and clears the token
 */
const CaptchaWidget = forwardRef(function CaptchaWidget({ onVerify }, ref) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onVerifyRef = useRef(onVerify);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    onVerifyRef.current = onVerify;
  }, [onVerify]);

  const resetCaptcha = () => {
    if (widgetIdRef.current !== null && window.grecaptcha?.reset) {
      window.grecaptcha.reset(widgetIdRef.current);
    }

    onVerifyRef.current?.(null);
  };

  useImperativeHandle(ref, () => ({
    reset: resetCaptcha,
  }));

  useEffect(() => {
    let isMounted = true;

    if (!SITE_KEY) {
      console.error('[CaptchaWidget] VITE_RECAPTCHA_SITE_KEY is not set.');
      setLoadError(true);
      return undefined;
    }

    loadRecaptchaScript()
      .then((grecaptcha) => {
        if (!isMounted || !containerRef.current || widgetIdRef.current !== null) return;

        widgetIdRef.current = grecaptcha.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme: 'light',
          callback: (token) => onVerifyRef.current?.(token),
          'expired-callback': () => onVerifyRef.current?.(null),
          'error-callback': () => onVerifyRef.current?.(null),
        });

        setIsReady(true);
      })
      .catch((error) => {
        console.error('[CaptchaWidget] Failed to load reCAPTCHA.', error);
        if (isMounted) setLoadError(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label
          className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider"
          style={{ color: colors.brand.primary }}
        >
          <ShieldCheck size={13} style={{ color: colors.brand.primary }} aria-hidden="true" />
          Verification
        </label>

        <button
          type="button"
          onClick={resetCaptcha}
          disabled={!isReady}
          className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold transition-colors hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
          style={{ color: colors.text.light.muted }}
          aria-label="Reset CAPTCHA"
        >
          <RefreshCw size={11} aria-hidden="true" />
          Reset
        </button>
      </div>

      {loadError && (
        <p role="alert" className="text-xs font-medium" style={{ color: colors.brand.danger }}>
          CAPTCHA failed to load. Check the site key or refresh the page.
        </p>
      )}

      <div ref={containerRef} aria-label="reCAPTCHA verification" />
    </div>
  );
});

export default CaptchaWidget;
