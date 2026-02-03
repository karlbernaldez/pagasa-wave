import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, User, Mail, Lock, Phone, MapPin, Building, Briefcase, Eye, EyeOff, Check,
    AlertCircle, Cloud, Droplets, Wind, Waves, Loader2, ArrowRight, ArrowLeft
} from 'lucide-react';
import { useFormData, useFormValidationState, useFieldValidation, useMultiStepForm, usePasswordToggles, useRegistrationSubmit, useDateUtils } from '@/hooks/useRegister';
import ModernDatePicker from '@/components/ui/ModernDatePicker';

// Input Field Component
const InputField = ({
    icon: Icon,
    type = "text",
    name,
    placeholder,
    label,
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
    getMinDate
}) => {
    const isPassword = name === 'password' || name === 'confirmPassword';
    const showPasswordState = name === 'password' ? showPassword : showConfirmPassword;
    const setShowPasswordState = name === 'password' ? setShowPassword : setShowConfirmPassword;
    const hasError = errors[name] && touched[name];
    const hasSuccess = !errors[name] && formData[name] && touched[name];

    const inputProps = {
        type: isPassword && !showPasswordState ? "password" : type,
        name,
        value: formData[name],
        onChange: handleInputChange,
        onBlur: handleBlur,
        placeholder,
        ...(name === 'birthday' && {
            max: getMaxDate(),
            min: getMinDate()
        })
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-blue-200/80 text-sm font-medium ml-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300/60 group-focus-within:text-blue-300 transition-colors">
                    <Icon size={20} />
                </div>
                <input
                    {...inputProps}
                    className={`
                        w-full pl-12 pr-12 py-3.5 bg-white/5 backdrop-blur-sm rounded-xl text-white
                        border ${hasError ? 'border-red-500/50 focus:border-red-500/70' : 'border-white/10 focus:border-blue-400/50'}
                        placeholder:text-white/30 outline-none
                        transition-all duration-200
                        focus:bg-white/10 focus:shadow-lg focus:shadow-blue-500/10
                        hover:bg-white/[0.07]
                    `}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPasswordState(!showPasswordState)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300/60 hover:text-blue-300 transition-colors"
                    >
                        {showPasswordState ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                )}
                {!isPassword && hasSuccess && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400 animate-scale-in">
                        <Check size={20} />
                    </div>
                )}
                {!isPassword && hasError && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400">
                        <AlertCircle size={20} />
                    </div>
                )}
            </div>
            {hasError && (
                <div className="flex items-center gap-2 text-red-300/90 text-xs ml-1 animate-slide-down">
                    <AlertCircle size={12} />
                    <span>{errors[name]}</span>
                </div>
            )}
        </div>
    );
};

const Register = () => {
    const navigate = useNavigate();

    // Custom hooks
    const { formData, updateFormData } = useFormData();
    const { errors, touched, setErrors, setTouched, setFieldTouched, setFieldError } = useFormValidationState();
    const { validateField } = useFieldValidation(formData);
    const { currentStep, nextStep, prevStep } = useMultiStepForm(formData, validateField, setTouched, setErrors);
    const {
        showPassword,
        showConfirmPassword,
        setShowPassword,
        setShowConfirmPassword
    } = usePasswordToggles();
    const { isSubmitting, handleSubmit } = useRegistrationSubmit(formData, validateField, setTouched, setErrors);
    const { getMaxDate, getMinDate } = useDateUtils();

    useEffect(() => {
        document.title = "WaveLab - Register";
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        updateFormData(name, value);

        if (touched[name]) {
            setFieldError(name, validateField(name, value));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setFieldTouched(name);
        setFieldError(name, validateField(name, value));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse-slow animation-delay-1000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />

                {/* Weather Icons */}
                <div className="absolute top-20 left-20 text-blue-400/10 animate-float pointer-events-none">
                    <Cloud size={100} strokeWidth={1.5} />
                </div>
                <div className="absolute top-32 right-32 text-cyan-400/10 animate-float animation-delay-1000 pointer-events-none">
                    <Droplets size={80} strokeWidth={1.5} />
                </div>
                <div className="absolute bottom-32 left-32 text-blue-300/10 animate-float animation-delay-2000 pointer-events-none">
                    <Wind size={90} strokeWidth={1.5} />
                </div>
                <div className="absolute bottom-40 right-40 text-cyan-300/10 animate-float animation-delay-1500 pointer-events-none">
                    <Waves size={70} strokeWidth={1.5} />
                </div>

                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
            </div>

            {/* Main Content */}
            <div className={`relative z-10 w-full transition-all duration-500 ${currentStep === 2 ? 'max-w-6xl' : 'max-w-2xl'}`}>
                {/* Header Section */}
                <div className="text-center mb-8 space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-2xl shadow-blue-500/20 mb-2">
                        <img
                            src="/pagasa-logo.png"
                            alt="PAGASA Logo"
                            className="w-14 h-14 object-contain drop-shadow-lg"
                        />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold text-white tracking-tight">
                            Join WaveLab
                        </h1>
                        <div className="flex items-center justify-center gap-2 text-blue-300/90">
                            <div className="h-px w-8 bg-gradient-to-r from-transparent to-blue-400/50" />
                            <p className="text-sm font-medium tracking-wide uppercase">PAGASA</p>
                            <div className="h-px w-8 bg-gradient-to-l from-transparent to-blue-400/50" />
                        </div>
                    </div>
                </div>

                {/* Progress Indicator */}
                <div className="flex justify-center items-center gap-3 mb-8">
                    <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                        transition-all duration-300
                        ${currentStep >= 1
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-white/5 text-white/40 border border-white/10'}
                    `}>
                        1
                    </div>
                    <div className={`
                        h-1 w-16 rounded-full transition-all duration-300
                        ${currentStep >= 2
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                            : 'bg-white/10'}
                    `} />
                    <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                        transition-all duration-300
                        ${currentStep >= 2
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-white/5 text-white/40 border border-white/10'}
                    `}>
                        2
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden p-8 md:p-10">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-3xl" />

                    <div className="relative">
                        <form onSubmit={handleSubmit}>
                            {/* Step 1 */}
                            {currentStep === 1 && (
                                <div className="space-y-5 animate-slide-in">
                                    <h2 className="text-xl font-semibold text-white mb-6">Personal Information</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <InputField
                                            icon={User}
                                            name="firstName"
                                            placeholder="Enter first name"
                                            label="First Name"
                                            formData={formData}
                                            errors={errors}
                                            touched={touched}
                                            showPassword={showPassword}
                                            showConfirmPassword={showConfirmPassword}
                                            setShowPassword={setShowPassword}
                                            setShowConfirmPassword={setShowConfirmPassword}
                                            handleInputChange={handleInputChange}
                                            handleBlur={handleBlur}
                                            getMaxDate={getMaxDate}
                                            getMinDate={getMinDate}
                                        />
                                        <InputField
                                            icon={User}
                                            name="lastName"
                                            placeholder="Enter last name"
                                            label="Last Name"
                                            formData={formData}
                                            errors={errors}
                                            touched={touched}
                                            showPassword={showPassword}
                                            showConfirmPassword={showConfirmPassword}
                                            setShowPassword={setShowPassword}
                                            setShowConfirmPassword={setShowConfirmPassword}
                                            handleInputChange={handleInputChange}
                                            handleBlur={handleBlur}
                                            getMaxDate={getMaxDate}
                                            getMinDate={getMinDate}
                                        />
                                    </div>

                                    <InputField
                                        icon={User}
                                        name="username"
                                        placeholder="Choose a username"
                                        label="Username"
                                        formData={formData}
                                        errors={errors}
                                        touched={touched}
                                        showPassword={showPassword}
                                        showConfirmPassword={showConfirmPassword}
                                        setShowPassword={setShowPassword}
                                        setShowConfirmPassword={setShowConfirmPassword}
                                        handleInputChange={handleInputChange}
                                        handleBlur={handleBlur}
                                        getMaxDate={getMaxDate}
                                        getMinDate={getMinDate}
                                    />

                                    <InputField
                                        icon={Mail}
                                        type="email"
                                        name="email"
                                        placeholder="Enter your email"
                                        label="Email Address"
                                        formData={formData}
                                        errors={errors}
                                        touched={touched}
                                        showPassword={showPassword}
                                        showConfirmPassword={showConfirmPassword}
                                        setShowPassword={setShowPassword}
                                        setShowConfirmPassword={setShowConfirmPassword}
                                        handleInputChange={handleInputChange}
                                        handleBlur={handleBlur}
                                        getMaxDate={getMaxDate}
                                        getMinDate={getMinDate}
                                    />

                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="
                                            w-full py-3.5 mt-2
                                            bg-gradient-to-r from-blue-500 to-cyan-500 
                                            text-white font-semibold rounded-xl
                                            shadow-lg shadow-blue-500/25
                                            hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02]
                                            active:scale-[0.98]
                                            transition-all duration-200
                                            flex items-center justify-center gap-2
                                            group
                                        "
                                    >
                                        Continue to Next Step
                                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            )}

                            {/* Step 2 - Improved Layout */}
                            {currentStep === 2 && (
                                <div className="space-y-5 animate-slide-in">
                                    <h2 className="text-xl font-semibold text-white mb-6">
                                        Complete Your Profile
                                    </h2>

                                    {/* Contact Info & Birthday Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        <InputField
                                            icon={Phone}
                                            type="tel"
                                            name="contact"
                                            placeholder="Enter phone number"
                                            label="Phone Number"
                                            formData={formData}
                                            errors={errors}
                                            touched={touched}
                                            showPassword={showPassword}
                                            showConfirmPassword={showConfirmPassword}
                                            setShowPassword={setShowPassword}
                                            setShowConfirmPassword={setShowConfirmPassword}
                                            handleInputChange={handleInputChange}
                                            handleBlur={handleBlur}
                                            getMaxDate={getMaxDate}
                                            getMinDate={getMinDate}
                                        />

                                        <ModernDatePicker
                                            value={formData.birthday}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                            placeholder="Select date of birth"
                                            label="Date of Birth"
                                            error={errors.birthday}
                                            touched={touched.birthday}
                                            hasSuccess={!errors.birthday && formData.birthday && touched.birthday}
                                            getMaxDate={getMaxDate}
                                            getMinDate={getMinDate}
                                        />

                                        <InputField
                                            icon={MapPin}
                                            name="address"
                                            placeholder="Enter your address"
                                            label="Address"
                                            formData={formData}
                                            errors={errors}
                                            touched={touched}
                                            showPassword={showPassword}
                                            showConfirmPassword={showConfirmPassword}
                                            setShowPassword={setShowPassword}
                                            setShowConfirmPassword={setShowConfirmPassword}
                                            handleInputChange={handleInputChange}
                                            handleBlur={handleBlur}
                                            getMaxDate={getMaxDate}
                                            getMinDate={getMinDate}
                                        />
                                    </div>

                                    {/* Agency & Position Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <InputField
                                            icon={Building}
                                            name="agency"
                                            placeholder="Enter agency name"
                                            label="Agency"
                                            formData={formData}
                                            errors={errors}
                                            touched={touched}
                                            showPassword={showPassword}
                                            showConfirmPassword={showConfirmPassword}
                                            setShowPassword={setShowPassword}
                                            setShowConfirmPassword={setShowConfirmPassword}
                                            handleInputChange={handleInputChange}
                                            handleBlur={handleBlur}
                                            getMaxDate={getMaxDate}
                                            getMinDate={getMinDate}
                                        />

                                        <InputField
                                            icon={Briefcase}
                                            name="position"
                                            placeholder="Enter your position"
                                            label="Position"
                                            formData={formData}
                                            errors={errors}
                                            touched={touched}
                                            showPassword={showPassword}
                                            showConfirmPassword={showConfirmPassword}
                                            setShowPassword={setShowPassword}
                                            setShowConfirmPassword={setShowConfirmPassword}
                                            handleInputChange={handleInputChange}
                                            handleBlur={handleBlur}
                                            getMaxDate={getMaxDate}
                                            getMinDate={getMinDate}
                                        />
                                    </div>

                                    {/* Password Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <InputField
                                            icon={Lock}
                                            name="password"
                                            placeholder="Create a password"
                                            label="Password"
                                            formData={formData}
                                            errors={errors}
                                            touched={touched}
                                            showPassword={showPassword}
                                            showConfirmPassword={showConfirmPassword}
                                            setShowPassword={setShowPassword}
                                            setShowConfirmPassword={setShowConfirmPassword}
                                            handleInputChange={handleInputChange}
                                            handleBlur={handleBlur}
                                            getMaxDate={getMaxDate}
                                            getMinDate={getMinDate}
                                        />

                                        <InputField
                                            icon={Lock}
                                            name="confirmPassword"
                                            placeholder="Confirm your password"
                                            label="Confirm Password"
                                            formData={formData}
                                            errors={errors}
                                            touched={touched}
                                            showPassword={showPassword}
                                            showConfirmPassword={showConfirmPassword}
                                            setShowPassword={setShowPassword}
                                            setShowConfirmPassword={setShowConfirmPassword}
                                            handleInputChange={handleInputChange}
                                            handleBlur={handleBlur}
                                            getMaxDate={getMaxDate}
                                            getMinDate={getMinDate}
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="
                                                flex-1 py-3.5
                                                bg-white/5 backdrop-blur-sm
                                                text-white font-medium rounded-xl
                                                border border-white/10
                                                hover:bg-white/10 hover:border-white/20
                                                transition-all duration-200
                                                flex items-center justify-center gap-2
                                                group
                                            "
                                        >
                                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="
                                                flex-1 py-3.5
                                                bg-gradient-to-r from-blue-500 to-cyan-500 
                                                text-white font-semibold rounded-xl
                                                shadow-lg shadow-blue-500/25
                                                hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02]
                                                active:scale-[0.98]
                                                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                                                transition-all duration-200
                                                flex items-center justify-center gap-2
                                            "
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 size={20} className="animate-spin" />
                                                    Creating Account...
                                                </>
                                            ) : (
                                                'Create Account'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="text-center mt-8 pt-6 border-t border-white/10">
                                <p className="text-blue-200/60 text-sm">
                                    Already have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={() => navigate('/login')}
                                        className="text-blue-300 font-semibold hover:text-cyan-300 transition-colors"
                                    >
                                        Sign in here
                                    </button>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>

                <p className="text-center text-blue-200/40 text-xs mt-6">
                    By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>

            {/* Custom Animations */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-20px);
                    }
                }

                @keyframes pulse-slow {
                    0%, 100% {
                        opacity: 0.3;
                    }
                    50% {
                        opacity: 0.6;
                    }
                }

                @keyframes slide-in {
                    from {
                        opacity: 0;
                        transform: translateX(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes slide-down {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes scale-in {
                    from {
                        opacity: 0;
                        transform: scale(0.8) translateY(-50%);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(-50%);
                    }
                }

                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }

                .animate-pulse-slow {
                    animation: pulse-slow 8s ease-in-out infinite;
                }

                .animate-slide-in {
                    animation: slide-in 0.4s ease-out;
                }

                .animate-slide-down {
                    animation: slide-down 0.3s ease-out;
                }

                .animate-scale-in {
                    animation: scale-in 0.3s ease-out;
                }

                .animation-delay-1000 {
                    animation-delay: 1s;
                }

                .animation-delay-1500 {
                    animation-delay: 1.5s;
                }

                .animation-delay-2000 {
                    animation-delay: 2s;
                }
            `}</style>
        </div>
    );
};

export default Register;