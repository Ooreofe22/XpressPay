'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { CheckCircle2, AlertCircle } from 'lucide-react'

type KYCStep = 'welcome' | 'documents' | 'verification' | 'success'

export function KYCScreen() {
  const [step, setStep] = useState<KYCStep>('welcome')
  const [documentType, setDocumentType] = useState<string>('')
  const [documentNumber, setDocumentNumber] = useState('')
  const [loading, setLoading] = useState(false)

  const documentTypes = [
    { id: 'nin', label: 'National ID (NIN)', placeholder: '11 digits' },
    { id: 'passport', label: 'International Passport', placeholder: 'Passport number' },
    { id: 'drivers', label: "Driver's License", placeholder: 'License number' },
    { id: 'voters', label: "Voter's Card", placeholder: 'Card number' },
  ]

  const handleVerify = async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setLoading(false)
    setStep('success')
  }

  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
              <span className="text-2xl">🆔</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Upgrade to Gold Level</h1>
            <p className="text-sm text-muted-foreground">
              Complete KYC verification to unlock higher transaction limits
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-8 space-y-4">
            <div className="flex gap-3">
              <CheckCircle2 size={20} className="text-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Higher Limits</p>
                <p className="text-xs text-muted-foreground">Increase transaction limits</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 size={20} className="text-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Premium Features</p>
                <p className="text-xs text-muted-foreground">Access exclusive features</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 size={20} className="text-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Priority Support</p>
                <p className="text-xs text-muted-foreground">Dedicated support team</p>
              </div>
            </div>
          </div>

          {/* Limits Comparison */}
          <div className="bg-card border border-border rounded-xl p-4 mb-8 space-y-2">
            <p className="text-xs text-muted-foreground uppercase font-semibold mb-3">Current Limits</p>
            <div className="flex justify-between items-center text-sm">
              <span className="text-foreground">Daily Limit</span>
              <span className="font-semibold text-primary">₦500,000 → ₦5,000,000</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-foreground">Monthly Limit</span>
              <span className="font-semibold text-primary">₦2,000,000 → ₦50,000,000</span>
            </div>
          </div>

          {/* Actions */}
          <Button
            variant="primary"
            size="lg"
            className="w-full mb-2"
            onClick={() => setStep('documents')}
          >
            Start Verification
          </Button>
          <Button variant="ghost" size="lg" className="w-full">
            Maybe Later
          </Button>
        </div>
      </div>
    )
  }

  if (step === 'documents') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <button
              onClick={() => setStep('welcome')}
              className="text-primary text-sm font-medium hover:opacity-70 transition-opacity mb-4"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-foreground">Select Document Type</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Choose a valid government-issued ID
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 mb-8">
            {documentTypes.map((doc) => (
              <button
                key={doc.id}
                onClick={() => {
                  setDocumentType(doc.id)
                  setStep('verification')
                }}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  documentType === doc.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-border'
                }`}
              >
                <p className="font-medium text-foreground">{doc.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{doc.placeholder}</p>
              </button>
            ))}
          </div>

          <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-xs text-warning font-medium flex gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              Ensure your document is valid and clearly visible
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'verification') {
    const selectedDoc = documentTypes.find((d) => d.id === documentType)

    // @ts-ignore
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <button
              onClick={() => setStep('documents')}
              className="text-primary text-sm font-medium hover:opacity-70 transition-opacity mb-4"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-foreground">Enter Document Details</h1>
            <p className="text-sm text-muted-foreground mt-1">{selectedDoc?.label}</p>
          </div>

          <Card className="card-gradient mb-6">
            <CardContent className="py-4">
              <Input
                label="Document Number"
                placeholder={selectedDoc?.placeholder}
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
              />
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="flex gap-3 text-sm">
              <span className="text-muted-foreground">→</span>
              <span className="text-foreground">Keep your information private and secure</span>
            </div>
            <div className="flex gap-3 text-sm">
              <span className="text-muted-foreground">→</span>
              <span className="text-foreground">We never share your details with third parties</span>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={() => setStep('documents')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              loading={loading}
              disabled={!documentNumber || loading}
              onClick={handleVerify}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-8">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-success/20 rounded-full mb-4">
              <CheckCircle2 size={48} className="text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Verification Successful!</h1>
            <p className="text-sm text-muted-foreground">
              Your account has been upgraded to Gold Level
            </p>
          </div>

          <Card className="card-gradient mb-8">
            <CardContent className="py-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Level</span>
                <Badge variant="success">GOLD</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Daily Limit</span>
                <span className="text-sm font-bold text-success">₦5,000,000</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monthly Limit</span>
                <span className="text-sm font-bold text-success">₦50,000,000</span>
              </div>
            </CardContent>
          </Card>

          <Button variant="primary" size="lg" className="w-full" onClick={() => setStep('welcome')}>
            Done
          </Button>
        </div>
      </div>
    )
  }

  return null
}
