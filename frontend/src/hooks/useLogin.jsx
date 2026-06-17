// hooks/useLogin.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { fetchUserDetails } from '@/api/userAPI';
import { loginUser, sendOtp, verifyOtp as verifyOtpApi, resendVerificationEmail } from '@/api/auth'; // ← added resendVerificationEmail

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_OTP_ATTEMPTS = 5; // mirrors the server-side cap — used for UI feedback

// ─────────────────────────────────────────────────────────────────────────────
// useFormValidation
// ─────────────────────────────────────────────────────────────────────────────

export const useFormValidation = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });

  const validateEmail = useCallback((value) =>
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? 'Please enter a valid email'
      : '',
    []);

  const validatePassword = useCallback((value) =>
    value.length < 1 ? 'Password is required' : '',
    []);

  const handleEmailChange = useCallback((e) => setEmail(e.target.value), []);
  const handlePasswordChange = useCallback((e) => setPassword(e.target.value), []);

  const handleBlur = useCallback((field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const emailError = touched.email ? validateEmail(email) : '';
  const passwordError = touched.password ? validatePassword(password) : '';

  return {
    email,
    password,
    touched,
    setTouched,
    emailError,
    passwordError,
    hasEmailSuccess: touched.email && !emailError && !!email,
    hasPasswordSuccess: touched.password && !passwordError && !!password,
    handleEmailChange,
    handlePasswordChange,
    handleBlur,
    validateEmail,
    validatePassword,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// useLoginAuth
// ─────────────────────────────────────────────────────────────────────────────

export const useLoginAuth = (setIsLoggedIn, setRole) => {
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [emailUnverified, setEmailUnverified] = useState(false);
  const [resendStatus, setResendStatus] = useState(null); // null | 'sending' | 'sent' | 'error'
  const [resendError, setResendError] = useState(null);
  const [cooldown, setCooldown] = useState(0);   // seconds remaining

  const cooldownRef = useRef(null);

  // ── Clear cooldown timer on unmount ───────────────────────────────────────
  useEffect(() => () => clearInterval(cooldownRef.current), []);

  // ── Start the 30s countdown ───────────────────────────────────────────────
  const startCooldown = useCallback(() => {
    clearInterval(cooldownRef.current);
    setCooldown(30);

    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          setResendStatus(null); // re-enable the button
          return 0;
        }
        return prev - 1;
      });
    }, 1_000);
  }, []);

  // ── Resend verification email ─────────────────────────────────────────────
  const resendVerification = useCallback(async (email) => {
    setResendStatus('sending');
    setResendError(null);
    try {
      await resendVerificationEmail(email);
      setResendStatus('sent');
      startCooldown(); // begin 30s cooldown after every successful send
    } catch (err) {
      const message = err?.message ?? 'Failed to resend. Please try again.';
      setResendStatus('error');
      setResendError(message);
      console.error('[resendVerification]', message);
    }
  }, [startCooldown]);

  // ── Step 1: verify credentials + send OTP ────────────────────────────────
  const handleLogin = useCallback(async (
    email,
    password,
    validateEmail,
    validatePassword,
    setTouched,
    options = {},
  ) => {
    const { coordinates, onCredentialsValid } = options;

    setTouched({ email: true, password: true });

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    if (emailErr || passwordErr) {
      setError(emailErr || passwordErr);
      return;
    }

    setIsLoading(true);
    setError('');
    setEmailUnverified(false);
    setResendStatus(null);
    setResendError(null);
    setCooldown(0);
    clearInterval(cooldownRef.current);

    try {
      const res = await loginUser({ email, password, coordinates: coordinates ?? null });

      if (res.trustedDevice) {
        // ── Trusted device: server already issued tokens, skip OTP entirely ──
        const userData = await fetchUserDetails(res.user.id);
        flushSync(() => {
          setRole(userData.role);
          setIsLoggedIn(true);
        });
        navigate(userData.role === 'admin' ? '/dashboard' : '/studio', { replace: true });
      } else {
        // ── Unknown device: OTP was sent, open the modal ──────────────────────
        onCredentialsValid?.();
      }
    } catch (err) {
      const message = err.message || 'Login failed. Please try again.';
      if (message === 'Please verify your email before logging in.') {
        setEmailUnverified(true);
        resendVerification(email);
      } else {
        setError(message);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [resendVerification, navigate, setIsLoggedIn, setRole]);

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const requestOtp = useCallback(async (email) => {
    setError('');
    try {
      await sendOtp({ email });
    } catch (err) {
      const message = err.message || 'Failed to send OTP. Please try again.';
      setError(message);
      throw new Error(message);
    }
  }, []);

  // ── Step 2: verify OTP + complete login ──────────────────────────────────
  const verifyOtp = useCallback(async (email, otp) => {
    setError('');
    setIsLoading(true);

    try {
      const res = await verifyOtpApi({ email, otp });

      if (!res?.user?.id) {
        throw new Error('Unexpected server response during OTP verification.');
      }

      const userData = await fetchUserDetails(res.user.id);

      flushSync(() => {
        setRole(userData.role);
        setIsLoggedIn(true);
      });

      navigate(userData.role === 'admin' ? '/dashboard' : '/studio', { replace: true });
    } catch (err) {
      const newAttempts = otpAttempts + 1;
      setOtpAttempts(newAttempts);
      const message = err.message || 'OTP verification failed. Please try again.';
      setError(message);
      throw Object.assign(new Error(message), { attempts: newAttempts });
    } finally {
      setIsLoading(false);
    }
  }, [navigate, otpAttempts, setIsLoggedIn, setRole]);

  const otpLocked = otpAttempts >= MAX_OTP_ATTEMPTS;

  return {
    error, isLoading, setError,
    otpAttempts, otpLocked, requestOtp, verifyOtp,
    handleLogin,
    emailUnverified, resendStatus, resendError, cooldown, resendVerification,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// usePasswordVisibility
// ─────────────────────────────────────────────────────────────────────────────

export const usePasswordVisibility = () => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return { showPassword, togglePasswordVisibility };
};

// ─────────────────────────────────────────────────────────────────────────────
// useGeolocation
// ─────────────────────────────────────────────────────────────────────────────

export const useGeolocation = ({ onPosition } = {}) => {
  const [position, setPosition] = useState(null);
  const [geoError, setGeoError] = useState('');
  const onPositionRef = useRef(onPosition);

  useEffect(() => { onPositionRef.current = onPosition; }, [onPosition]);

  useEffect(() => {
    if (!navigator?.geolocation) {
      setGeoError('Geolocation is not supported by this browser.');
      return;
    }

    let cancelled = false;

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        if (cancelled) return;
        const snapshot = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        };
        setPosition(snapshot);
        onPositionRef.current?.(snapshot);
      },
      (err) => {
        if (cancelled) return;
        const messages = {
          1: 'Location permission denied.',
          2: 'Location unavailable.',
          3: 'Location request timed out.',
        };
        setGeoError(messages[err.code] ?? 'Failed to retrieve location.');
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );

    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { position, geoError };
};
