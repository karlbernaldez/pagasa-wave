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
  BadgeCheck,
  Clock3,
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
import AuthFooter from '@/features/auth/shared/AuthFooter.jsx';
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
      <header className="mb-7 border-b border-slate-200 pb-6 text-left">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">
              WaveLab access
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-blue-950 sm:text-4xl">
              Create your account
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Set up your secure forecasting workspace profile. Use your official contact and agency details so administrators can verify your access.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500 sm:text-sm">
          <span className="inline-flex items-center gap-2">
            <BadgeCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            Verified workspace access
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-cyan-700" aria-hidden="true" />
            Two short steps
          </span>
        </div>
      </header>

      <RegisterProgress currentStep={currentStep} />

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {currentStep === 1 && (
          <section aria-labelledby="account-details-heading" className="space-y-5">
            <div>
              <h2 id="account-details-heading" className="text-lg font-extrabold text-blue-950">
                Account details
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Enter the information you will use to identify and sign in to WaveLab.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <RegisterField icon={User} name="firstName" placeholder="Juan" label="First name" {...sharedFieldProps} />
              <RegisterField icon={User} name="lastName" placeholder="Dela Cruz" label="Last name" {...sharedFieldProps} />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <RegisterField icon={User} name="username" placeholder="Choose a username" label="Username" {...sharedFieldProps} />
              <RegisterField icon={Mail} type="email" name="email" placeholder="name@agency.gov.ph" label="Official email address" {...sharedFieldProps} />
            </div>

            <div className="flex justify-end border-t border-slate-200 pt-5">
              <AuthButton type="button" variant="primary" size="lg" icon={ArrowRight} onClick={nextStep} className="w-full sm:w-auto sm:min-w-48">
                Continue to profile
              </AuthButton>
            </div>
          </section>
        )}

        {currentStep === 2 && (
          <section aria-labelledby="professional-profile-heading" className="space-y-5">
            <div>
              <h2 id="professional-profile-heading" className="text-lg font-extrabold text-blue-950">
                Professional profile
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Complete your contact, organization, and security information for account verification.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <RegisterField icon={Phone} type="tel" name="contact" placeholder="09XX XXX XXXX" label="Phone number" {...sharedFieldProps} />
              <ModernDatePicker
                value={formData.birthday}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder="Select date of birth"
                label="Date of birth"
                error={errors.birthday}
                touched={touched.birthday}
                hasSuccess={!errors.birthday && formData.birthday && touched.birthday}
                getMaxDate={getMaxDate}
                getMinDate={getMinDate}
              />
            </div>

            <RegisterField icon={MapPin} name="address" placeholder="Office or residential address" label="Address" {...sharedFieldProps} />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <RegisterField icon={Building} name="agency" placeholder="e.g. PAGASA" label="Agency or organization" {...sharedFieldProps} />
              <RegisterField icon={Briefcase} name="position" placeholder="e.g. Weather Specialist" label="Position or role" {...sharedFieldProps} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
              <div className="mb-4">
                <h3 className="text-sm font-extrabold text-blue-950">Secure your account</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Choose a strong password that you do not use for another service.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <RegisterField icon={Lock} name="password" placeholder="Create a password" label="Password" {...sharedFieldProps} />
                <RegisterField icon={Lock} name="confirmPassword" placeholder="Re-enter your password" label="Confirm password" {...sharedFieldProps} />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between">
              <AuthButton type="button" variant="secondary" size="lg" icon={ArrowLeft} onClick={prevStep} className="w-full sm:w-auto sm:min-w-32">
                Back
              </AuthButton>

              <AuthButton type="submit" variant="primary" size="lg" isLoading={isSubmitting} disabled={isSubmitting} className="w-full sm:w-auto sm:min-w-48">
                Create account
              </AuthButton>
            </div>
          </section>
        )}
      </form>

      <div className="mt-7 border-t border-slate-200 pt-5">
        <AuthFooter
          switchText="Already have an account?"
          switchActionText="Sign in"
          onSwitchAction={() => navigate('/login')}
          termsPrefix="By creating an account, you agree to our"
        />
      </div>
    </>
  );
}
