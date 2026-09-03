import { Suspense } from 'react';
import RegisterClient from './register-client';

export const metadata = {
    title: 'Emporium Capitals | Criar Conta',
    description: 'Create an Emporium Capitals account to start your passive income journey, manage your investments, and access master trading tools.',
};

export default function Page() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#010214] flex items-center justify-center"><div className="size-8 border-4 border-[#ef4d45] border-t-transparent rounded-full animate-spin" /></div>}>
            <RegisterClient />
        </Suspense>
    );
}
