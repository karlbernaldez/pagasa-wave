import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import { tokens } from '@/styles/tokens';

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

const { colors } = tokens;

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
  };

  return (
    <>
      <header className="mb-6 text-center">
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border shadow-inner"
          style={{
            background: colors.surface.light.muted,
            borderColor: 'rgba(1, 176, 239, 0.26)',
            color: colors.brand.primary,
          }}
        >
          <ShieldCheck className="h-8 w-8" aria-hidden="true" />
        </div>

        <h1
          className="text-4xl font-extrabold tracking-tight"
          style={{ color: colors.brand.secondary }}
        >
          Create account
        </h1>

        <p
          className="mt-2 text-base font-medium"
          style={{ color: colors.text.light.muted }}
        >
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
            <StepHeading
              title="Personal Information"
              description="Tell us who will use this forecasting workspace account."
            />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <RegisterField
                icon={User}
                name="firstName"
                placeholder="Enter first name"
                label="First Name"
                required
                {...sharedFieldProps}
              />

              <RegisterField
                icon={User}
                name="lastName"
                placeholder="Enter last name"
                label="Last Name"
                required
                {...sharedFieldProps}
              />
            </div>

            <RegisterField
              icon={User}
              name="username"
              placeholder="Choose a username"
              label="Username"
              required
              {...sharedFieldProps}
            />

            <RegisterField
              icon={Mail}
              type="email"
              name="email"
              placeholder="you@example.com"
              label="Email Address"
              required
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
            <StepHeading
              title="Complete Your Profile"
              description="Add your agency details and secure your account."
            />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <RegisterField
                icon={Phone}
                type="tel"
                name="contact"
                placeholder="Enter phone number"
                label="Phone Number"
                required
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
              required
              {...sharedFieldProps}
            />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <RegisterField
                icon={Building}
                name="agency"
                placeholder="Enter agency name"
                label="Agency"
                required
                {...sharedFieldProps}
              />

              <RegisterField
                icon={Briefcase}
                name="position"
                placeholder="Enter your position"
                label="Position"
                required
                {...sharedFieldProps}
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <RegisterField
                icon={ShieldCheck}
                name="password"
                placeholder="Create a password"
                label="Password"
                required
                {...sharedFieldProps}
              />

              <RegisterField
                icon={CheckCircle2}
                name="confirmPassword"
                placeholder="Confirm your password"
                label="Confirm Password"
                required
                {...sharedFieldProps}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
              <AuthButton
                type="button"
                variant="secondary"
                size="lg"
                icon={ArrowLeft}
                onClick={prevStep}
                className="w-full"
              >
                Back
              </AuthButton>

              <AuthButton
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                className="w-full"
              >
                Create Account
              </AuthButton>
            </div>
          </div>
        )}
      </form>

      <div
        className="mt-6 border-t pt-5 text-center"
        style={{ borderColor: 'rgba(1, 176, 239, 0.18)' }}
      >
        <p
          className="text-sm font-medium"
          style={{ color: colors.text.light.muted }}
        >
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="font-extrabold underline underline-offset-2 transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100"
            style={{ color: colors.brand.primary }}
          >
            Sign in here
          </button>
        </p>

        <p
          className="mt-4 text-xs font-medium"
          style={{ color: colors.text.light.muted }}
        >
          By creating an account, you agree to our{' '}
          <button
            type="button"
            className="font-bold underline underline-offset-2 transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100"
            style={{ color: colors.brand.primary }}
          >
            Terms of Use
          </button>{' '}
          and{' '}
          <button
            type="button"
            className="font-bold underline underline-offset-2 transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100"
            style={{ color: colors.brand.primary }}
          >
            Privacy Policy
          </button>
        </p>
      </div>
    </>
  );
}

function StepHeading({ title, description }) {
  return (
    <div>
      <h2
        className="text-lg font-extrabold"
        style={{ color: colors.brand.secondary }}
      >
        {title}
      </h2>
      <p
        className="mt-1 text-sm font-medium"
        style={{ color: colors.text.light.muted }}
      >
        {description}
      </p>
    </div>
  );
}
