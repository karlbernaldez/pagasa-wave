import AuthPageShell from '@/features/auth/shared/AuthPageShell.jsx';
import AuthCard from '@/features/auth/shared/AuthCard.jsx';

import RegisterForm from './components/RegisterForm.jsx';

export default function RegisterPage() {
  return (
    <AuthPageShell>
      <AuthCard className="max-w-4xl border-white/70 bg-white/95 p-6 shadow-xl backdrop-blur sm:p-8 lg:p-10">
        <RegisterForm />
      </AuthCard>
    </AuthPageShell>
  );
}
