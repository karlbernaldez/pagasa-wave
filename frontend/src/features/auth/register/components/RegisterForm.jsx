import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Building,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

import {
  useFormData,
  useFormValidationState,
  useFieldValidation,
  useMultiStepForm,
  usePasswordToggles,
  useRegistrationSubmit,
  useDateUtils,
} from '@/hooks/useRegister';

import AuthButton from '@/features/auth/shared/AuthButton.jsx';
import ModernDatePicker from '@/components/ui/ModernDatePicker';

import RegisterField from './RegisterField.jsx';
import RegisterProgress from './RegisterProgress.jsx';

export default function RegisterForm() {
  const navigate = useNavigate();

  const { formData, updateFormData } = useFormData();

  const {
    errors,
    touched,
    setErrors,
    setTouched,
    setFieldTouched,
    setFieldError,
  } = useFormValidationState();

  const { validateField } = useFieldValidation(formData);

  const { currentStep, nextStep, prevStep } = useMultiStepForm(
    formData,
    validateField,
    setTouched,
    setErrors
  );

  const {
    showPassword,
    showConfirmPassword,
    setShowPassword,
    setShowConfirmPassword,
  } = usePasswordToggles();

  const { isSubmitting, handleSubmit } = useRegistrationSubmit(
    formData,
    validateField,
    setTouched,
    setErrors
  );

  const { getMaxDate, getMinDate } = useDateUtils();

  useEffect(() => {
    document.title = 'WaveLab — Create Account';
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    updateFormData(name, value);

    if (touched[name]) {
      setFieldError(name, validateField(name, value));
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;

    setFieldTouched(name);
    setFieldError(name, validateField(name, value));
  };

  const sharedFieldProps = {
    formData,
    errors,
    touched,
    showPassword,
    showConfirmPassword,
    setShowPassword,
    setShowConfirmPassword,
    handleInputChange,
    handleBlur,
    getMaxDate,
    getMinDate,
  };

  return (
    <>
      <header className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 text-cyan-700 shadow-inner">
          <ShieldCheck className="h-8 w-8" />
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-blue-950">
          Create account
        </h1>

        <p className="mt-2 text-base font-medium text-slate-500">
          Register for access to WaveLab
        </p>
      </header>

      <RegisterProgress currentStep={currentStep} />

      <form
        onSubmit={handleSubmit}
        className="max-h-[58vh] overflow-y-auto pr-1"
        noValidate
      >
        {currentStep === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-extrabold text-blue-950">
              Personal Information
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <RegisterField
                icon={User}
                name="firstName"
                placeholder="Enter first name"
                label="First Name"
                {...sharedFieldProps}
              />

              <RegisterField
                icon={User}
                name="lastName"
                placeholder="Enter last name"
                label="Last Name"
                {...sharedFieldProps}
              />
            </div>

            <RegisterField
              icon={User}
              name="username"
              placeholder="Choose a username"
              label="Username"
              {...sharedFieldProps}
            />

            <RegisterField
              icon={Mail}
              type="email"
              name="email"
              placeholder="you@example.com"
              label="Email Address"
              {...sharedFieldProps}
            />

            <AuthButton
              type="button"
              variant="primary"
              size="lg"
              icon={ArrowRight}
              onClick={nextStep}
              className="w-full"
            >
              Continue
            </AuthButton>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-extrabold text-blue-950">
              Complete Your Profile
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <RegisterField
                icon={Phone}
                type="tel"
                name="contact"
                placeholder="Enter phone number"
                label="Phone Number"
                {...sharedFieldProps}
              />

              <ModernDatePicker
                value={formData.birthday}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder="Select date of birth"
                label="Date of Birth"
                error={errors.birthday}
                touched={touched.birthday}
                hasSuccess={
                  !errors.birthday && formData.birthday && touched.birthday
                }
                getMaxDate={getMaxDate}
                getMinDate={getMinDate}
              />
            </div>

            <RegisterField
              icon={MapPin}
              name="address"
              placeholder="Enter your address"
              label="Address"
              {...sharedFieldProps}
            />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <RegisterField
                icon={Building}
                name="agency"
                placeholder="Enter agency name"
                label="Agency"
                {...sharedFieldProps}
              />

              <RegisterField
                icon={Briefcase}
                name="position"
                placeholder="Enter your position"
                label="Position"
                {...sharedFieldProps}
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <RegisterField
                icon={Lock}
                name="password"
                placeholder="Create a password"
                label="Password"
                {...sharedFieldProps}
              />

              <RegisterField
                icon={Lock}
                name="confirmPassword"
                placeholder="Confirm your password"
                label="Confirm Password"
                {...sharedFieldProps}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <AuthButton
                type="button"
                variant="secondary"
                size="lg"
                icon={ArrowLeft}
                onClick={prevStep}
                className="flex-1"
              >
                Back
              </AuthButton>

              <AuthButton
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                className="flex-1"
              >
                Create Account
              </AuthButton>
            </div>
          </div>
        )}
      </form>

      <div className="mt-6 border-t border-slate-200 pt-5 text-center">
        <p className="text-sm font-medium text-slate-500">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="font-extrabold text-cyan-700 underline underline-offset-2 hover:text-cyan-900"
          >
            Sign in here
          </button>
        </p>

        <p className="mt-4 text-xs font-medium text-slate-500">
          By creating an account, you agree to our{' '}
          <button type="button" className="font-bold text-cyan-700 underline">
            Terms of Use
          </button>{' '}
          and{' '}
          <button type="button" className="font-bold text-cyan-700 underline">
            Privacy Policy
          </button>
        </p>
      </div>
    </>
  );
}
