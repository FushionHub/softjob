import AdminLayoutClient from '../admin-layout-client'
import DepositsClient from './deposits-client'

export default function DepositsPage() {
  return (
    <AdminLayoutClient>
      <DepositsClient />
    </AdminLayoutClient>
  )
}
