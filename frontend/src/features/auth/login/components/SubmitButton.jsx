import { Loader2, LogIn } from 'lucide-react';

export default function SubmitButton({ isLoading, disabled }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-700 to-teal-600 px-4 py-4 text-lg font-extrabold text-white shadow-lg shadow-cyan-900/20 transition hover:from-cyan-800 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? (
        <>
          <Loader2 size={22} className="animate-spin" />
          Signing In...
        </>
      ) : (
        <>
          <LogIn size={22} />
          Sign In
        </>
      )}
    </button>
  );
}