import DashboardClient from './dashboard-client';

export const metadata = {
  title: 'Emporium Capitals | Dashboard',
  description: 'Track profit, deposits, trades and referrals in real time.',
};

export default function Page() {
  return <DashboardClient />;
}
