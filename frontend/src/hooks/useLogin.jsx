// hooks/useLogin.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { fetchUserDetails } from '@/api/userAPI';
import { loginUser, sendOtp, verifyOtp as verifyOtpApi } from '@/api/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_OTP_ATTEMPTS = 5; // mirrors the server-side cap — used for UI feedback

// ─────────────────────────────────────────────────────────────────────────────
// useFormValidation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Manages email/password field state and inline validation.
 */
export const useFormValidation = () => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [touched,  setTouched]  = useState({ email: false, password: false });

  const validateEmail = useCallback((value) =>
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? 'Please enter a valid email'
      : '',
  []);

  const validatePassword = useCallback((value) =>
    value.length < 1 ? 'Password is required' : '',
  []);

  const handleEmailChange    = useCallback((e) => setEmail(e.target.value),    []);
  const handlePasswordChange = useCallback((e) => setPassword(e.target.value), []);

  const handleBlur = useCallback((field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const emailError    = touched.email    ? validateEmail(email)       : '';
  const passwordError = touched.password ? validatePassword(password) : '';

  return {
    email,
    password,
    touched,
    setTouched,
    emailError,
    passwordError,
    hasEmailSuccess:    touched.email    && !emailError    && !!email,
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

/**
 * Orchestrates the two-step login flow:
 *   Step 1 — validateCredentials  → server confirms email + password
 *   Step 2 — requestOtp           → server sends a 6-digit code
 *   Step 3 — verifyOtp            → code confirmed, tokens issued, user navigated
 */
export const useLoginAuth = (setIsLoggedIn, setRole) => {
  const navigate           = useNavigate();
  const [error, setError]  = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);

  // ── Step 1: validate credentials ──────────────────────────────────────────
  /**
   * Calls /api/auth/login. On success, the server marks the email as
   * "credentials verified" so the OTP step is unlocked server-side.
   *
   * @param {string}   email
   * @param {string}   password
   * @param {Function} validateEmail
   * @param {Function} validatePassword
   * @param {Function} setTouched
   * @param {{ captchaToken?: string, onCredentialsValid?: () => void }} [options]
   */
  const handleLogin = useCallback(async (
    email,
    password,
    validateEmail,
    validatePassword,
    setTouched,
    options = {},
  ) => {
    const { captchaToken, onCredentialsValid } = options;

    // Force both fields to "touched" so inline errors appear immediately.
    setTouched({ email: true, password: true });

    const emailErr    = validateEmail(email);
    const passwordErr = validatePassword(password);

    if (emailErr || passwordErr) {
      setError(emailErr || passwordErr);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await loginUser({ email, password, captchaToken });
      onCredentialsValid?.();
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Step 2: request OTP ────────────────────────────────────────────────────
  /**
   * Asks the server to send a fresh OTP to the given address.
   * Throws on failure so the caller (e.g. a "Resend" button) can react.
   *
   * @param {string} email
   */
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

  // ── Step 3: verify OTP → complete login ───────────────────────────────────
  /**
   * Submits the OTP, fetches the full user profile on success, then atomically
   * updates auth context via flushSync before navigating.
   *
   * Tracks client-side attempt count so the UI can disable the form after
   * MAX_OTP_ATTEMPTS, matching the server-side lock.
   *
   * @param {string} email
   * @param {string} otp
   */
  const verifyOtp = useCallback(async (email, otp) => {
    setError('');
    setIsLoading(true);

    try {
      const res = await verifyOtpApi({ email, otp });

      if (!res?.user?.id) {
        throw new Error('Unexpected server response during OTP verification.');
      }

      const userData = await fetchUserDetails(res.user.id);

      // Commit both state updates synchronously before React schedules the
      // navigation — prevents a window where isLoggedIn is true but role is stale.
      flushSync(() => {
        setRole(userData.role);
        setIsLoggedIn(true);
      });

      navigate(userData.role === 'admin' ? '/dashboard' : '/studio', { replace: true });
    } catch (err) {
      const newAttempts = otpAttempts + 1;
      setOtpAttempts(newAttempts);

      // Propagate so the OTP form can decide whether to lock the UI.
      const message = err.message || 'OTP verification failed. Please try again.';
      setError(message);
      throw Object.assign(new Error(message), { attempts: newAttempts });
    } finally {
      setIsLoading(false);
    }
  }, [navigate, otpAttempts, setIsLoggedIn, setRole]);

  const otpLocked = otpAttempts >= MAX_OTP_ATTEMPTS;

  return {
    error,
    isLoading,
    otpAttempts,
    otpLocked,
    setError,
    handleLogin,
    requestOtp,
    verifyOtp,
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

/**
 * Returns the user's coordinates via the Geolocation API.
 *
 * Stores position in a ref (not window) and exposes it as a plain value.
 * The optional `onPosition` callback fires once the position is obtained so
 * callers can push it into context, state, or an API call without coupling
 * this hook to any particular store.
 *
 * @param {{ onPosition?: (coords: GeolocationCoordinates) => void }} [options]
 * @returns {{ position: GeolocationCoordinates | null, geoError: string }}
 */
export const useGeolocation = ({ onPosition } = {}) => {
  const [position, setPosition]   = useState(null);
  const [geoError, setGeoError]   = useState('');
  const onPositionRef              = useRef(onPosition);

  // Keep the callback ref current without re-running the effect.
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
          latitude:  coords.latitude,
          longitude: coords.longitude,
          accuracy:  coords.accuracy,
        };
        setPosition(snapshot);
        onPositionRef.current?.(snapshot);
      },
      (err) => {
        if (cancelled) return;
        // Don't expose raw GeolocationPositionError codes to the UI.
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
  }, []); // intentionally empty — runs once on mount

  return { position, geoError };
};