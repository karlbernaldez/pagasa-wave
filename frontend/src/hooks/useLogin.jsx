// hooks/useLogin.js
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserDetails } from '@/api/userAPI';
import { loginUser } from '@/api/auth';

/**
 * Manages form validation state and logic
 */
export const useFormValidation = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });

  const validateEmail = useCallback((email) => {
    return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) 
      ? 'Please enter a valid email' 
      : '';
  }, []);

  const validatePassword = useCallback((password) => {
    return password.length < 1 ? 'Password is required' : '';
  }, []);

  const handleEmailChange = useCallback((e) => {
    setEmail(e.target.value);
  }, []);

  const handlePasswordChange = useCallback((e) => {
    setPassword(e.target.value);
  }, []);

  const handleBlur = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const emailError = touched.email ? validateEmail(email) : '';
  const passwordError = touched.password ? validatePassword(password) : '';
  const hasEmailSuccess = touched.email && !emailError && email;
  const hasPasswordSuccess = touched.password && !passwordError && password;

  return {
    email,
    password,
    touched,
    setTouched,
    emailError,
    passwordError,
    hasEmailSuccess,
    hasPasswordSuccess,
    handleEmailChange,
    handlePasswordChange,
    handleBlur,
    validateEmail,
    validatePassword,
  };
};

/**
 * Handles login authentication logic
 */
export const useLoginAuth = (setIsLoggedIn) => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = useCallback(async (email, password, validateEmail, validatePassword, setTouched) => {
    setTouched({ email: true, password: true });

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setError(emailError || passwordError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await loginUser({ email, password });
      if (!res) throw new Error('No response received from the server.');
      
      const userData = await fetchUserDetails(res.user.id);

      setIsLoggedIn(true);

      if (userData.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/studio');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, setIsLoggedIn]);

  return {
    error,
    isLoading,
    setError,
    handleLogin,
  };
};

/**
 * Manages password visibility toggle
 */
export const usePasswordVisibility = () => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  return {
    showPassword,
    togglePasswordVisibility,
  };
};

/**
 * Handles geolocation for user location
 */
export const useGeolocation = () => {
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          window.userLocation = coords;
        },
        (err) => {
          console.error('Geolocation error:', err);
        }
      );
    }
  }, []);
};