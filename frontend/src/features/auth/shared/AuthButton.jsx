import { Loader2 } from 'lucide-react';

const variants = {
  primary:
    'border-transparent bg-blue-800 text-white shadow-sm hover:bg-blue-900 focus-visible:ring-blue-200',
  secondary:
    'border-blue-200 bg-white text-blue-800 hover:bg-blue-50 focus-visible:ring-blue-100',
  subtle:
    'border-transparent bg-blue-50 text-blue-800 hover:bg-blue-100 focus-visible:ring-blue-100',
};

const sizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-5 py-3.5 text-base',
};

export default function AuthButton({
  children,
  type = 'button',
  variant = 'primary',
  size = 'lg',
  isLoading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border font-bold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
