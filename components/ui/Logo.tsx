import React from 'react'
import { ArrowUpRight } from 'lucide-react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showOrbital?: boolean
  animated?: boolean
  /** 'brand' renders a green tile (for light surfaces), 'inverse' renders a white tile (for dark/green surfaces) */
  variant?: 'brand' | 'inverse'
}

export function Logo({ size = 'md', showOrbital = false, animated = false, variant = 'brand' }: LogoProps) {
  const sizeMap = {
    sm: 44,
    md: 72,
    lg: 104,
  }

  const dimension = sizeMap[size]
  const iconSize = dimension * 0.48

  const isInverse = variant === 'inverse'

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Orbital rings */}
      {showOrbital && (
        <>
          <div
            className={`absolute rounded-full border ${isInverse ? 'border-white/25' : 'border-primary/25'} ${animated ? 'animate-spin' : ''}`}
            style={{
              width: `${dimension * 1.45}px`,
              height: `${dimension * 1.45}px`,
              animationDuration: animated ? '10s' : undefined,
            }}
          >
            {/* Orange orbit dot */}
            <div
              className="absolute rounded-full bg-accent"
              style={{
                width: `${dimension * 0.12}px`,
                height: `${dimension * 0.12}px`,
                top: `${dimension * 0.02}px`,
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            />
          </div>
          <div
            className={`absolute rounded-full border ${isInverse ? 'border-white/15' : 'border-primary/15'} ${animated ? 'animate-spin' : ''}`}
            style={{
              width: `${dimension * 1.85}px`,
              height: `${dimension * 1.85}px`,
              animationDuration: animated ? '16s' : undefined,
              animationDirection: 'reverse',
            }}
          />
        </>
      )}

      {/* Logo tile */}
      <div
        className={`relative flex items-center justify-center elevation-2 ${
          isInverse ? 'bg-white' : 'balance-gradient'
        }`}
        style={{
          width: `${dimension}px`,
          height: `${dimension}px`,
          borderRadius: `${dimension * 0.28}px`,
        }}
      >
        <ArrowUpRight
          size={iconSize}
          className={isInverse ? 'text-primary' : 'text-white'}
          strokeWidth={2.75}
        />
        {/* Orange accent dot */}
        <div
          className="absolute rounded-full bg-accent"
          style={{
            width: `${dimension * 0.16}px`,
            height: `${dimension * 0.16}px`,
            bottom: `${dimension * 0.18}px`,
            right: `${dimension * 0.18}px`,
          }}
        />
      </div>
    </div>
  )
}
