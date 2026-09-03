import WithdrawClient from './withdraw-client';

export const metadata = {
    title: 'Emporium Capitals | Withdraw',
    description: 'Request a withdrawal from your Emporium Capitals account.',
};

export default function Page() {
    return <WithdrawClient />;
}
