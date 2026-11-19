'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Menu, X } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { CtaLink, Wordmark } from './primitives'

const navLinks = [
  { label: 'Transfers', href: '#transfers' },
  { label: 'Bills & cards', href: '#product' },
  { label: 'Security', href: '#security' },
]

export function LandingNav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,border-color] duration-300 ${
        scrolled || open
          ? 'border-b border-border bg-background/80 backdrop-blur-xl backdrop-saturate-150'
          : 'border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex h-14 w-full max-w-[1120px] items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="PayXpress home">
          <Wordmark />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[14px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link
            href="/app?screen=login-email"
            className="rounded-full px-3.5 py-2 text-[14px] font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Log in
          </Link>
          <CtaLink href="/app?screen=signup-email" size="sm">
            Open account
          </CtaLink>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden md:hidden"
          >
            <div className="mx-auto flex w-full max-w-[1120px] flex-col px-5 pb-6 pt-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-border py-4 text-[17px] font-medium text-foreground"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/app?screen=login-email"
                onClick={() => setOpen(false)}
                className="py-4 text-[17px] font-medium text-foreground"
              >
                Log in
              </Link>
              <CtaLink href="/app?screen=signup-email" className="mt-2 w-full">
                Open a free account
              </CtaLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
