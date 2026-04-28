import AuthPageShell from '@/features/auth/shared/AuthPageShell.jsx';
import AuthCard from '@/features/auth/shared/AuthCard.jsx';

import RegisterForm from './components/RegisterForm.jsx';

export default function RegisterPage() {
  return (
    <AuthPageShell
      description="Create your official forecasting workspace account for secure marine data analysis, collaboration, and forecast preparation."
    >
      <AuthCard className="max-w-3xl">
        <RegisterForm />
      </AuthCard>
    </AuthPageShell>
  );
}