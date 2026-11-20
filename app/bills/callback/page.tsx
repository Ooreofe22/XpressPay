import { Suspense } from 'react'
import { BillCallbackClient } from './BillCallbackClient'

interface BillCallbackPageProps {
    searchParams: Promise<{
        reference?: string | string[]
    }>
}

function BillCallbackFallback() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-[420px] space-y-4 rounded-[28px] border border-card-border/80 bg-card p-8 elevation-3" aria-busy="true">
                <div className="skeleton mx-auto h-4 w-40 rounded-full" />
                <div className="skeleton mx-auto h-11 w-56 rounded-[12px]" />
                <div className="skeleton mt-8 h-4 w-full rounded-full" />
                <div className="skeleton h-4 w-4/5 rounded-full" />
                <div className="skeleton mt-6 h-14 w-full rounded-[14px]" />
            </div>
        </div>
    )
}

export default async function BillCallbackPage({ searchParams }: BillCallbackPageProps) {
    const { reference } = await searchParams
    const paymentReference = Array.isArray(reference) ? reference[0] : reference

    return (
        <Suspense fallback={<BillCallbackFallback />}>
            <BillCallbackClient reference={paymentReference} />
        </Suspense>
    )
}