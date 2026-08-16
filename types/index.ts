export interface User {
  id: string
  name: string
  email: string
  phone?: string
  accountNumber: string
  accountBalance: number
  avatar: string
  kyc: {
    verified: boolean
    level: 'bronze' | 'silver' | 'gold'
  }
}

export interface Transaction {
  id: string
  type: 'sent' | 'received' | 'payment' | 'deposit'
  recipient?: string
  amount: number
  description: string
  timestamp: Date
  status: 'pending' | 'completed' | 'failed'
  reference: string
  billerName?: string
  billerCategoryPath?: string
  paymentMethod?: 'BALANCE' | 'GATEWAY'
  xpressReferenceId?: string
  billerResponseMessage?: string
}

export interface BankContact {
  id: string
  name: string
  accountNumber: string
  bankName: string
  bankCode: string
  avatar?: string
}

export interface Card {
  id: string
  cardNumber: string
  cardHolder: string
  expiryDate: string
  cvv: string
  type: 'debit' | 'credit'
  isActive: boolean
  balance?: number
}

export interface Airtime {
  id: string
  provider: 'MTN' | 'Airtel' | '9mobile' | 'Glo'
  amount: number
  denomination: string
}

export interface Biller {
  uniqueCode: string
  name: string
  categoryPath: string // "airtime" | "data" | "electricity" | "cable"
  requiresValidate: boolean
  fixedAmount: boolean
  amount: number | null
  minimumAmount: number | null
  imageUrl: string | null
}

export interface BillerValidateResult {
  valid: boolean
  name?: string
  address?: string
  amount?: string
  minimumVending?: string
  message?: string
}

export interface BillCheckoutResponse {
  authorizationUrl: string
  reference: string
  amount: number
}


export interface Beneficiary {
  id: string
  name: string
  accountNumber: string
  bankName: string
  bankCode: string
}

export interface BillBeneficiary {
  id: string
  billerUniqueCode: string
  billerName: string
  billerCategoryPath: string
  accountNumber?: string
  accountType?: string
  phoneNumber?: string
  label?: string
}