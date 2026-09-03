import AdminLayoutClient from '../admin-layout-client'
import UsersClient from './users-client'

export default function UsersPage() {
  return (
    <AdminLayoutClient>
      <UsersClient />
    </AdminLayoutClient>
  )
}
