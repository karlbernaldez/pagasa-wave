// hooks/useRegister.js
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '@/api/auth';

/* -----------------------------
   SECURITY HELPERS (XSS GUARD)
------------------------------*/

// blocks < > and typical HTML tags
const hasHtml = (s) => /[<>]/.test(String(s ?? ""));
const hasTagPattern = (s) => /<\/?[a-z][\s\S]*>/i.test(String(s ?? ""));

// normalize user text
const clean = (s) => String(s ?? "").trim();


/* -----------------------------
   FORM DATA STATE
------------------------------*/
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


/* -----------------------------
   VALIDATION STATE
------------------------------*/
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


/* -----------------------------
   FIELD VALIDATION (SECURED)
------------------------------*/
export const useFieldValidation = (formData) => {

  const validateTextNoHTML = (value) => {
    const v = clean(value);
    if (!v) return "This field is required";
    if (hasHtml(v) || hasTagPattern(v)) return "HTML or scripts are not allowed";
    return "";
  };

  const validateField = useCallback((name, value) => {
    const v = clean(value);

    switch (name) {

      /* ---------- NAME ---------- */
      case 'firstName':
      case 'lastName': {
        if (hasHtml(v)) return 'HTML is not allowed';
        if (v.length < 2) return 'Must be at least 2 characters';
        if (!/^[a-zA-Z .'-]+$/.test(v))
          return 'Only letters, spaces, apostrophe, dash allowed';
        return '';
      }

      /* ---------- USERNAME ---------- */
      case 'username':
        if (v.length < 3) return 'Username must be at least 3 characters';
        if (!/^[a-zA-Z0-9_]+$/.test(v))
          return 'Only letters, numbers, underscore allowed';
        return '';

      /* ---------- EMAIL ---------- */
      case 'email':
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
          ? 'Please enter a valid email'
          : '';

      /* ---------- CONTACT ---------- */
      case 'contact':
        return !/^(?:\+63|0)(9\d{9}|2\d{7,8}|[3-9]\d{7})$/.test(v.replace(/\s/g, ''))
          ? 'Please enter a valid Philippine phone number'
          : '';

      /* ---------- PASSWORD ---------- */
      case 'password':
        if (v.length < 8) return 'Password must be at least 8 characters';
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(v))
          return 'Must contain uppercase, lowercase, and number';
        return '';

      case 'confirmPassword':
        return v !== formData.password ? 'Passwords do not match' : '';

      /* ---------- BIRTHDAY ---------- */
      case 'birthday':
        if (!v) return 'Date of birth is required';

        const birthDate = new Date(v);
        const today = new Date();

        if (birthDate > today) return 'Birth date cannot be in the future';

        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();

        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

        if (age < 16) return 'Must be at least 16 years old';
        if (age > 120) return 'Please enter a valid birth date';

        return '';

      /* ---------- ADDRESS / AGENCY / POSITION ---------- */
      case 'address':
      case 'agency':
      case 'position': {
        if (hasHtml(v)) return 'HTML or scripts not allowed';
        if (v.length < 2) return 'This field is required';

        // allow broader real-world characters
        if (!/^[a-zA-Z0-9 .,'\-#()\/&]+$/.test(v))
          return 'Contains invalid characters';

        return '';
      }

      default:
        return '';
    }

  }, [formData.password]);

  return { validateField };
};


/* -----------------------------
   MULTI STEP
------------------------------*/
export const useMultiStepForm = (formData, validateField, setTouched, setErrors) => {
  const [currentStep, setCurrentStep] = useState(1);

  const nextStep = useCallback(() => {

    const step1Fields = ['firstName','lastName','username','email'];
    const step1Errors = {};
    const step1Touched = {};

    step1Fields.forEach(field=>{
      step1Touched[field]=true;
      const error = validateField(field, formData[field]);
      if(error) step1Errors[field]=error;
    });

    setTouched(prev=>({...prev,...step1Touched}));
    setErrors(prev=>({...prev,...step1Errors}));

    if(Object.keys(step1Errors).length===0){
      setCurrentStep(2);
    }

  },[formData,validateField,setTouched,setErrors]);

  const prevStep = useCallback(()=>setCurrentStep(1),[]);

  return { currentStep,nextStep,prevStep };
};


/* -----------------------------
   PASSWORD TOGGLE
------------------------------*/
export const usePasswordToggles = () => {
  const [showPassword,setShowPassword]=useState(false);
  const [showConfirmPassword,setShowConfirmPassword]=useState(false);

  return {
    showPassword,
    showConfirmPassword,
    setShowPassword,
    setShowConfirmPassword
  };
};


/* -----------------------------
   SUBMIT HANDLER
------------------------------*/
export const useRegistrationSubmit = (formData, validateField, setTouched, setErrors) => {

  const navigate = useNavigate();
  const [isSubmitting,setIsSubmitting]=useState(false);

  const handleSubmit = useCallback(async(e)=>{

    e.preventDefault();
    setIsSubmitting(true);

    const newErrors = {};
    const newTouched = {};

    Object.keys(formData).forEach(key=>{
      newTouched[key]=true;
      const error=validateField(key,formData[key]);
      if(error)newErrors[key]=error;
    });

    setTouched(newTouched);
    setErrors(newErrors);

    if(Object.keys(newErrors).length===0){
      try{

        // trim values before sending
        const payload = Object.fromEntries(
          Object.entries(formData).map(([k,v])=>[k, typeof v==='string'?v.trim():v])
        );

        await registerUser(payload);

        alert('Registration successful! Welcome to WaveLab!');
        navigate('/login');

      }catch(err){
        console.error('Registration error:',err.message);
        alert('Registration failed. Please try again.');
      }
    }

    setIsSubmitting(false);

  },[formData,validateField,setTouched,setErrors,navigate]);

  return { isSubmitting,handleSubmit };
};


/* -----------------------------
   DATE UTILS
------------------------------*/
export const useDateUtils = () => {

  const getMaxDate = useCallback(()=>{
    return new Date().toISOString().split('T')[0];
  },[]);

  const getMinDate = useCallback(()=>{
    const d=new Date();
    d.setFullYear(d.getFullYear()-120);
    return d.toISOString().split('T')[0];
  },[]);

  return { getMaxDate,getMinDate };
};
