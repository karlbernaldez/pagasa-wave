import { Waves } from 'lucide-react';

import AuthPageShell from '@/features/auth/shared/AuthPageShell.jsx';
import AuthCard from '@/features/auth/shared/AuthCard.jsx';
import LoginForm from './components/LoginForm.jsx';
import InlineOtpPanel from './components/InlineOtpPanel.jsx';
import UnverifiedEmailBanner from './components/UnverifiedEmailBanner.jsx';

import { useLoginFlow } from './hooks/useLoginFlow.js';

export default function LoginPage() {
  const login = useLoginFlow();

  return (
    <AuthPageShell>
      <AuthCard>
        {!login.otp.isOpen ? (
          <>
            <header className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 text-cyan-700 shadow-inner">
                <Waves className="h-9 w-9" />
              </div>

              <h2 className="text-4xl font-extrabold tracking-tight text-blue-950">
                Welcome back
              </h2>

              <p className="mt-3 text-lg font-medium text-slate-500">
                Sign in to continue to WaveLab
              </p>
            </header>

            {login.unverifiedEmail.isVisible && (
              <div className="mb-5">
                <UnverifiedEmailBanner {...login.unverifiedEmail} />
              </div>
            )}

            <LoginForm {...login.form} />
          </>
        ) : (
          <InlineOtpPanel {...login.otp} />
        )}
      </AuthCard>
    </AuthPageShell>
  );
}