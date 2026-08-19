// Mirrors com.payxpress.admin.AdminController's record DTOs. Keep in sync
// with the backend — these are hand-written, not generated.

export type AccountStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED'

export type TxStatus =
  | 'PENDING_PAYMENT'
  | 'PAYSTACK_CONFIRMED'
  | 'FULFILLING'
  | 'FULFILLED'
  | 'FAILED'
  | 'NEEDS_RECONCILIATION'

export interface AdminAccount {
  id: string
  email: string
  balance: number
  status: AccountStatus
  flagged: boolean
  createdAt: string
}

export interface AdminTransaction {
  id: string
  userEmail: string | null
  amount: number
  status: TxStatus
  paymentMethod: 'BALANCE' | 'GATEWAY' | null
  billerUniqueCode: string | null
  billerCategoryPath: string | null
  paystackReference: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminBiller {
  id: string
  uniqueCode: string
  name: string
  categoryPath: string
  active: boolean
  lastSyncedAt: string | null
}

export interface AdminStats {
  totalUsers: number
  totalTransactions: number
  totalVolume: number
  fulfilledCount: number
  reconciliationCount: number
  failedCount: number
  activeBillerCount: number
}
