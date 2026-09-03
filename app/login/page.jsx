import { Suspense } from 'react';
import LoginClient from './login-client';

export const metadata = {
    title: 'Emporium Capitals | Login',
    description: 'Sign In to your Emporium Capitals account to manage your investments, view payouts, and access master trading tools.',
};

export default function Page() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#010214] flex items-center justify-center">
                <div className="size-8 border-4 border-[#ef4d45] border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <LoginClient />
        </Suspense>
    );
}
