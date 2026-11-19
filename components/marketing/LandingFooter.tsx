import React from 'react'
import Link from 'next/link'
import { Container, Wordmark } from './primitives'

const columns = [
  {
    heading: 'Product',
    links: ['Transfers', 'Airtime and bills', 'Cards', 'Insights'],
  },
  {
    heading: 'Company',
    links: ['About', 'Careers', 'Press', 'Contact'],
  },
  {
    heading: 'Legal',
    links: ['Privacy', 'Terms', 'Cookies', 'Licensing', 'Complaints'],
  },
]

export function LandingFooter() {
  return (
    <footer id="support" className="border-t border-border py-14">
      <Container>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label="PayXpress home">
              <Wordmark />
            </Link>
            <p className="mt-4 max-w-xs text-[14px] leading-[1.5] text-muted-foreground">
              Transfers, bills and cards for Nigeria.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.heading}>
              <p className="text-[13px] font-semibold text-foreground">{column.heading}</p>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[14px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-[13px] text-muted-foreground sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} PayXpress Financial Technologies.</p>
          <p>Licensed by the Central Bank of Nigeria. Deposits insured by the NDIC.</p>
        </div>
      </Container>
    </footer>
  )
}
