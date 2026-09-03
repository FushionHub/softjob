import { Suspense } from 'react';
import OnboardingClient from './onboarding-client';

export const metadata = {
  title: 'Emporium Capitals | Complete Your Profile',
  description: 'Complete your profile after Google sign-in',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#010214] flex items-center justify-center"><div className="size-10 border-4 border-[#ef4d45] border-t-transparent rounded-full animate-spin"/></div>}>
      <OnboardingClient />
    </Suspense>
  );
}
