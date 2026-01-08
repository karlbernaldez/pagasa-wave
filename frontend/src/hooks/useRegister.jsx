// hooks/useRegister.js
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '@/api/auth';

/**
 * Manages form data state
 */
export const useFormData = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    contact: '',
    password: '',
    confirmPassword: '',
    address: '',
    agency: '',
    position: '',
    birthday: '',
  });

  const updateFormData = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  return { formData, updateFormData, setFormData };
};

/**
 * Manages validation errors and touched state
 */
export const useFormValidationState = () => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const setFieldTouched = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const resetValidation = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return {
    errors,
    touched,
    setErrors,
    setTouched,
    setFieldTouched,
    setFieldError,
    resetValidation,
  };
};

/**
 * Validation logic for form fields
 */
export const useFieldValidation = (formData) => {
  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        return value.trim().length < 2 ? 'Must be at least 2 characters' : '';
      
      case 'username':
        if (value.length < 3) return 'Username must be at least 3 characters';
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Only letters, numbers, and underscore allowed';
        return '';
      
      case 'email':
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Please enter a valid email' : '';
      
      case 'contact':
        return !/^(?:\+63|0)(9\d{9}|2\d{7,8}|[3-9]\d{7})$/.test(value.replace(/\s/g, ''))
          ? 'Please enter a valid Philippine phone number'
          : '';
      
      case 'password':
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) return 'Must contain uppercase, lowercase, and number';
        return '';
      
      case 'confirmPassword':
        return value !== formData.password ? 'Passwords do not match' : '';
      
      case 'birthday':
        if (!value) return 'Date of birth is required';
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        if (birthDate > today) return 'Birth date cannot be in the future';
        if (age < 16) return 'Must be at least 16 years old';
        if (age > 120) return 'Please enter a valid birth date';
        return '';
      
      case 'address':
      case 'agency':
      case 'position':
        return value.trim().length < 2 ? 'This field is required' : '';
      
      default:
        return '';
    }
  }, [formData.password]);

  return { validateField };
};

/**
 * Manages multi-step form navigation
 */
export const useMultiStepForm = (formData, validateField, setTouched, setErrors) => {
  const [currentStep, setCurrentStep] = useState(1);

  const nextStep = useCallback(() => {
    const step1Fields = ['firstName', 'lastName', 'username', 'email'];
    const step1Errors = {};
    const step1Touched = {};

    step1Fields.forEach(field => {
      step1Touched[field] = true;
      const error = validateField(field, formData[field]);
      if (error) step1Errors[field] = error;
    });

    setTouched(prev => ({ ...prev, ...step1Touched }));
    setErrors(prev => ({ ...prev, ...step1Errors }));

    if (Object.keys(step1Errors).length === 0) {
      setCurrentStep(2);
    }
  }, [formData, validateField, setTouched, setErrors]);

  const prevStep = useCallback(() => {
    setCurrentStep(1);
  }, []);

  return {
    currentStep,
    nextStep,
    prevStep,
  };
};

/**
 * Manages password visibility toggles
 */
export const usePasswordToggles = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleConfirmPassword = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  return {
    showPassword,
    showConfirmPassword,
    setShowPassword,
    setShowConfirmPassword,
    togglePassword,
    toggleConfirmPassword,
  };
};

/**
 * Handles form submission and registration
 */
export const useRegistrationSubmit = (formData, validateField, setTouched, setErrors) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newErrors = {};
    const newTouched = {};

    Object.keys(formData).forEach(key => {
      newTouched[key] = true;
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    setTouched(newTouched);
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        await registerUser(formData);
        alert('Registration successful! Welcome to WaveLab!');
        navigate('/login');
      } catch (error) {
        console.error('Registration error:', error.message);
        alert('Registration failed. Please try again.');
      }
    }
    
    setIsSubmitting(false);
  }, [formData, validateField, setTouched, setErrors, navigate]);

  return {
    isSubmitting,
    handleSubmit,
  };
};

/**
 * Date utilities for birthday field
 */
export const useDateUtils = () => {
  const getMaxDate = useCallback(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }, []);

  const getMinDate = useCallback(() => {
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 120);
    return minDate.toISOString().split('T')[0];
  }, []);

  return { getMaxDate, getMinDate };
};