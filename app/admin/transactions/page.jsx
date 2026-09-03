import AdminLayoutClient from '../admin-layout-client'
import TransactionsClient from './transactions-client'

export default function TransactionsPage() {
  return (
    <AdminLayoutClient>
      <TransactionsClient />
    </AdminLayoutClient>
  )
}
