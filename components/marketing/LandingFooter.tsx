import React from 'react'
import Link from 'next/link'
import { ArrowUpRight, AtSign, Globe, MessageCircle, Send } from 'lucide-react'

const columns = [
  {
    heading: 'Product',
    links: ['Transfers', 'Airtime & Bills', 'Cards', 'Insights', 'Business'],
  },
  {
    heading: 'Company',
    links: ['About', 'Careers', 'Press', 'Blog', 'Contact'],
  },
  {
    heading: 'Legal',
    links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Licensing', 'Complaints'],
  },
]

const socials = [
  { icon: AtSign, label: 'X / Twitter' },
  { icon: MessageCircle, label: 'WhatsApp' },
  { icon: Globe, label: 'Website' },
  { icon: Send, label: 'Telegram' },
]

export function LandingFooter() {
  return (
    <footer id="support" className="border-t border-border bg-card">
      {/* CTA band */}
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
        <div className="balance-gradient relative overflow-hidden rounded-3xl px-6 py-12 text-center sm:px-12 sm:py-16">
          <h2 className="mx-auto max-w-xl text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to move money the modern way?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-pretty text-base leading-relaxed text-white/75">
            Open a PayXpress account in minutes. No paperwork, no queues, no hidden fees.
          </p>
          <Link
            href="/app"
            className="mt-8 inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-accent px-6 text-sm font-semibold text-accent-foreground transition-all duration-200 hover:bg-accent/90 active:translate-y-px elevation-2"
          >
            Get Started
            <ArrowUpRight size={17} strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      {/* Footer grid */}
      <div className="mx-auto w-full max-w-6xl px-5 pb-12 sm:px-8">
        <div className="grid gap-10 border-t border-border pt-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5" aria-label="PayXpress home">
              <span className="balance-gradient relative flex h-8 w-8 items-center justify-center rounded-[9px]">
                <ArrowUpRight size={18} className="text-white" strokeWidth={2.75} />
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent ring-2 ring-card" />
              </span>
              <span className="text-[17px] font-bold tracking-tight text-foreground">PayXpress</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Fast, secure payments for Nigerians. Licensed by the CBN and insured by the NDIC.
            </p>
            <div className="mt-5 flex gap-2">
              {socials.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href="#"
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <Icon size={16} />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((column) => (
            <div key={column.heading}>
              <p className="text-sm font-semibold text-foreground">{column.heading}</p>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} PayXpress Financial Technologies. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            PayXpress is licensed by the Central Bank of Nigeria.
          </p>
        </div>
      </div>
    </footer>
  )
}
