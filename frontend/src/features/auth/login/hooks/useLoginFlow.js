import { useCallback, useEffect, useRef, useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  useFormValidation,
  useLoginAuth,
  usePasswordVisibility,
  useGeolocation,
} from '@/hooks/useLogin';

import { useAuth } from '@/hooks/useAuth';

const OTP_ACTION = {
  OPEN: 'open',
  CLOSE: 'close',
  SET_ERROR: 'setError',
  SET_LOADING: 'setLoading',
};

const OTP_INITIAL = {
  open: false,
  error: null,
  loading: false,
};

function otpReducer(state, action) {
  switch (action.type) {
    case OTP_ACTION.OPEN:
      return { open: true, error: null, loading: false };
    case OTP_ACTION.CLOSE:
      return { open: false, error: null, loading: false };
    case OTP_ACTION.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case OTP_ACTION.SET_LOADING:
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

export function useLoginFlow() {
  const navigate = useNavigate();
  const { setIsLoggedIn, setRole } = useAuth();
  const { position } = useGeolocation();

  const form = useFormValidation();
  const passwordVisibility = usePasswordVisibility();

  const {
    error,
    isLoading,
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
  } = useLoginAuth(setIsLoggedIn, setRole);

  const captchaRef = useRef(null);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [otpState, dispatchOtp] = useReducer(otpReducer, OTP_INITIAL);

  useEffect(() => {
    document.title = 'WaveLab — Sign in';
  }, []);

  const resetCaptcha = useCallback(() => {
    setCaptchaToken(null);
    captchaRef.current?.resetCaptcha?.();
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      try {
        await handleLogin(
          form.email,
          form.password,
          form.validateEmail,
          form.validatePassword,
          form.setTouched,
          {
            captchaToken,
            coordinates: position,
            onCredentialsValid: () => {
              dispatchOtp({ type: OTP_ACTION.OPEN });
            },
          }
        );
      } catch {
        resetCaptcha();
      }
    },
    [form, handleLogin, captchaToken, position, resetCaptcha]
  );

  const handleOtpVerify = useCallback(
    async (otp) => {
      dispatchOtp({ type: OTP_ACTION.SET_LOADING, payload: true });

      try {
        await verifyOtp(form.email, otp);
        dispatchOtp({ type: OTP_ACTION.CLOSE });
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Invalid or expired code.';

        dispatchOtp({ type: OTP_ACTION.SET_ERROR, payload: message });
        throw err;
      }
    },
    [form.email, verifyOtp]
  );

  const handleOtpResend = useCallback(async () => {
    dispatchOtp({ type: OTP_ACTION.SET_ERROR, payload: null });
    await requestOtp(form.email);
  }, [form.email, requestOtp]);

  const handleOtpClose = useCallback(() => {
    dispatchOtp({ type: OTP_ACTION.CLOSE });
  }, []);

  return {
    form: {
      ref: captchaRef,
      formState: form,
      auth: { error, isLoading },
      visibility: passwordVisibility,
      captchaVerified: Boolean(captchaToken),
      onCaptchaVerify: setCaptchaToken,
      onSubmit: handleSubmit,
      onNavigate: navigate,
    },

    otp: {
      isOpen: otpState.open,
      email: form.email,
      error: otpState.error,
      isLoading: otpState.loading,
      otpAttempts,
      otpLocked,
      onVerify: handleOtpVerify,
      onResend: handleOtpResend,
      onClose: handleOtpClose,
    },

    unverifiedEmail: {
      isVisible: emailUnverified,
      email: form.email,
      status: resendStatus,
      error: resendError,
      cooldown,
      onResend: () => resendVerification(form.email),
    },
  };
}
