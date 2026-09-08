// hooks/useLogin.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  checkAuthSession,
  loginUser,
  sendOtp,
  verifyOtp as verifyOtpApi,
  resendVerificationEmail,
} from '@/api/auth';
import { resolveAuthenticatedLandingPath } from '@/core/auth/resolveLandingPath';

const MAX_OTP_ATTEMPTS = 5;

export const useFormValidation = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });

  const validateEmail = useCallback(
    (value) => (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Please enter a valid email' : ''),
    []
  );

  const validatePassword = useCallback(
    (value) => (value.length < 1 ? 'Password is required' : ''),
    []
  );

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

export const useLoginAuth = (setIsLoggedIn, setRole) => {
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [emailUnverified, setEmailUnverified] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);
  const [resendError, setResendError] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  const cooldownRef = useRef(null);

  useEffect(() => () => clearInterval(cooldownRef.current), []);

  const startCooldown = useCallback(() => {
    clearInterval(cooldownRef.current);
    setCooldown(30);

    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          setResendStatus(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1_000);
  }, []);

  const resendVerification = useCallback(
    async (email) => {
      setResendStatus('sending');
      setResendError(null);
      try {
        await resendVerificationEmail(email);
        setResendStatus('sent');
        startCooldown();
      } catch (err) {
        const message = err?.message ?? 'Failed to resend. Please try again.';
        setResendStatus('error');
        setResendError(message);
        console.error('[resendVerification]', message);
      }
    },
    [startCooldown]
  );

  const finishAuthenticatedLogin = useCallback(async () => {
    const { authenticated, user } = await checkAuthSession({ force: true });
    if (!authenticated || !user) {
      throw new Error('Unable to verify the authenticated session.');
    }

    flushSync(() => {
      setRole(user.role);
      setIsLoggedIn(true);
    });

    navigate(resolveAuthenticatedLandingPath(user, '/'), { replace: true });
  }, [navigate, setIsLoggedIn, setRole]);

  const handleLogin = useCallback(
    async (
      email,
      password,
      validateEmail,
      validatePassword,
      setTouched,
      options = {}
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
          await finishAuthenticatedLogin();
        } else {
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
    },
    [finishAuthenticatedLogin, resendVerification]
  );

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

  const verifyOtp = useCallback(
    async (email, otp) => {
      setError('');
      setIsLoading(true);

      try {
        const res = await verifyOtpApi({ email, otp });

        if (!res?.user?.id) {
          throw new Error('Unexpected server response during OTP verification.');
        }

        await finishAuthenticatedLogin();
      } catch (err) {
        const newAttempts = otpAttempts + 1;
        setOtpAttempts(newAttempts);
        const message = err.message || 'OTP verification failed. Please try again.';
        setError(message);
        throw Object.assign(new Error(message), { attempts: newAttempts });
      } finally {
        setIsLoading(false);
      }
    },
    [finishAuthenticatedLogin, otpAttempts]
  );

  const otpLocked = otpAttempts >= MAX_OTP_ATTEMPTS;

  return {
    error,
    isLoading,
    setError,
    otpAttempts,
    otpLocked,
    requestOtp,
    verifyOtp,
    handleLogin,
    emailUnverified,
    resendStatus,
    resendError,
    cooldown,
    resendVerification,
  };
};

export const usePasswordVisibility = () => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return { showPassword, togglePasswordVisibility };
};

export const useGeolocation = ({ onPosition } = {}) => {
  const [position, setPosition] = useState(null);
  const [geoError, setGeoError] = useState('');
  const onPositionRef = useRef(onPosition);

  useEffect(() => {
    onPositionRef.current = onPosition;
  }, [onPosition]);

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
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 }
    );

    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { position, geoError };
};
