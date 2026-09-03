import AdminLayoutClient from './admin-layout-client'
import DashboardClient from './dashboard-client'

export default function AdminPage() {
  return (
    <AdminLayoutClient>
      <DashboardClient />
    </AdminLayoutClient>
  )
}
