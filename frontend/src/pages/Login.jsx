import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Cloud, Droplets, Wind, AlertCircle, Check, Loader2, Waves } from 'lucide-react';
import useAuthRedirect from '@/hooks/useAuthRedirect';
import { useFormValidation, useLoginAuth, usePasswordVisibility, useGeolocation } from '@/hooks/useLogin';

const Login = ({ isLoggedIn, setIsLoggedIn }) => {
  const navigate = useNavigate();

  // Custom hooks
  const {
    email,
    password,
    touched,
    setTouched,
    emailError,
    passwordError,
    hasEmailSuccess,
    handleEmailChange,
    handlePasswordChange,
    handleBlur,
    validateEmail,
    validatePassword,
  } = useFormValidation();

  const { error, isLoading, handleLogin } = useLoginAuth(setIsLoggedIn);
  const { showPassword, togglePasswordVisibility } = usePasswordVisibility();

  useAuthRedirect();
  useGeolocation();

  useEffect(() => {
    document.title = "WaveLab - Login";
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    handleLogin(email, password, validateEmail, validatePassword, setTouched);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Mesh */}
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

      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl w-12 h-12 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-300 z-50"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
      </button>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-10 space-y-4">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-2xl shadow-blue-500/20 mb-2">
            <img
              src="/pagasa-logo.png"
              alt="PAGASA Logo"
              className="w-16 h-16 object-contain drop-shadow-lg"
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-5xl font-bold text-white tracking-tight">
              WaveLab
            </h1>
            <div className="flex items-center justify-center gap-2 text-blue-300/90">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-blue-400/50" />
              <p className="text-sm font-medium tracking-wide uppercase">PAGASA</p>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-blue-400/50" />
            </div>
            <p className="text-blue-200/60 text-sm max-w-sm mx-auto leading-relaxed">
              Philippine Atmospheric, Geophysical and Astronomical Services Administration
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10 relative overflow-hidden">
          {/* Card Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-3xl" />

          <div className="relative">
            <form onSubmit={onSubmit} className="space-y-5">
              {/* Global Error */}
              {error && (
                <div className="flex items-center gap-3 text-red-200 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm animate-shake">
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-blue-200/80 text-sm font-medium ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300/60 group-focus-within:text-blue-300 transition-colors">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={() => handleBlur('email')}
                    className={`w-full pl-12 pr-12 py-3.5 bg-white/5 backdrop-blur-sm rounded-xl text-white border ${emailError ? 'border-red-500/50 focus:border-red-500/70' : 'border-white/10 focus:border-blue-400/50'} placeholder:text-white/30 outline-none transition-all duration-200 focus:bg-white/10 focus:shadow-lg focus:shadow-blue-500/10 hover:bg-white/[0.07]`} />
                  {hasEmailSuccess && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400 animate-scale-in">
                      <Check size={20} />
                    </div>
                  )}
                </div>
                {emailError && (
                  <div className="flex items-center gap-2 text-red-300/90 text-xs ml-1 animate-slide-down">
                    <AlertCircle size={12} />
                    <span>{emailError}</span>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-blue-200/80 text-sm font-medium ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300/60 group-focus-within:text-blue-300 transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={() => handleBlur('password')}
                    className={`
                      w-full pl-12 pr-12 py-3.5 bg-white/5 backdrop-blur-sm rounded-xl text-white
                      border ${passwordError ? 'border-red-500/50 focus:border-red-500/70' : 'border-white/10 focus:border-blue-400/50'}
                      placeholder:text-white/30 outline-none
                      transition-all duration-200
                      focus:bg-white/10 focus:shadow-lg focus:shadow-blue-500/10
                      hover:bg-white/[0.07]
                    `}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300/60 hover:text-blue-300 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {passwordError && (
                  <div className="flex items-center gap-2 text-red-300/90 text-xs ml-1 animate-slide-down">
                    <AlertCircle size={12} />
                    <span>{passwordError}</span>
                  </div>
                )}
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-blue-300/70 hover:text-blue-300 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="
                  w-full py-3.5 mt-2
                  bg-gradient-to-r from-blue-500 to-cyan-500 
                  text-white font-semibold rounded-xl
                  shadow-lg shadow-blue-500/25
                  hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02]
                  active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  transition-all duration-200
                  flex items-center justify-center gap-2
                  relative overflow-hidden
                  group
                "
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                <span className="relative flex items-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </span>
              </button>

              {/* Divider */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-transparent text-blue-200/40">New to WaveLab?</span>
                </div>
              </div>

              {/* Register Link */}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="
                  w-full py-3.5
                  bg-white/5 backdrop-blur-sm
                  text-blue-300 font-medium rounded-xl
                  border border-white/10
                  hover:bg-white/10 hover:border-white/20
                  transition-all duration-200
                "
              >
                Create an Account
              </button>
            </form>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center text-blue-200/40 text-xs mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
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

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
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

        .animate-shake {
          animation: shake 0.4s ease-in-out;
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

export default Login;