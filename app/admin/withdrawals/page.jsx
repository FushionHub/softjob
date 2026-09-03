import AdminLayoutClient from '../admin-layout-client'
import WithdrawalsClient from './withdrawals-client'

export default function WithdrawalsPage() {
  return (
    <AdminLayoutClient>
      <WithdrawalsClient />
    </AdminLayoutClient>
  )
}
