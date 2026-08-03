import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { AppProvider } from '@/context/AppContext'
import { BillCallbackClient } from './BillCallbackClient'

interface BillCallbackPageProps {
  searchParams: Promise<{
    reference?: string | string[]
  }>
}

function BillCallbackFallback() {
  return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
  )
}

export default async function BillCallbackPage({ searchParams }: BillCallbackPageProps) {
  const { reference } = await searchParams
  const paymentReference = Array.isArray(reference) ? reference[0] : reference

  return (
      <Suspense fallback={<BillCallbackFallback />}>
        <AppProvider>
          <BillCallbackClient reference={paymentReference} />
        </AppProvider>
      </Suspense>
  )
}
