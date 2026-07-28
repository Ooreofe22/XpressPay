'use client'

import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/ui/Logo'

export function SignUpPhone() {
  const { setAuthScreen } = useApp()
  const [phone, setPhone] = useState('')

  const handleNext = () => {
    if (phone.length >= 10) {
      setAuthScreen('signup-otp')
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col px-4 py-6">
      {/* Back Button */}
      <button
        onClick={() => setAuthScreen('signup-bvn')}
        className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-secondary rounded-lg"
      >
        <ArrowLeft size={24} />
      </button>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between pt-8">
        <div className="space-y-6">
          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">What's your number?</h1>
            <p className="text-muted-foreground text-sm">
              We'll send a verification code to your registered number to make sure it's yours.
            </p>
          </div>

          {/* Phone Input with Country Selector */}
          <div className="space-y-3">
            <div className="flex gap-2 bg-secondary rounded-lg p-3 border border-card-border">
              {/* Country dropdown */}
              <button className="flex items-center gap-1 text-foreground font-medium min-w-fit hover:opacity-70">
                <Logo size="sm" />
                <ChevronDown size={16} />
              </button>

              {/* Phone input */}
              <Input
                type="tel"
                placeholder="Enter Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                maxLength={11}
                className="flex-1 bg-transparent border-0 placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* Next Button */}
        <Button
          variant="primary"
          size="lg"
          onClick={handleNext}
          disabled={phone.length < 10}
          className="w-full"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
