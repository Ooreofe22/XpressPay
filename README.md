# PayXpress Web

The web app for **PayXpress**, a Nigerian bill payments and wallet app.
Live at **[paypei.online](https://paypei.online)**.

Users sign up with a one time code, fund a wallet, and pay for airtime, data, electricity, cable TV and exam PINs. Payments go through Paystack checkout, and every payment gets a shareable receipt. An admin dashboard lets staff watch transactions, manage billers and reconcile payments.

The API lives in a separate repo: [xpressPay-backend](https://github.com/Ooreofe22/xpressPay-backend) (Java, Spring Boot).

## Features

**Customer app**
- Sign up and log in with phone or email plus a one time code, then a 4 digit passcode
- Wallet balance, recent transactions and a search screen
- Bill payments: airtime, data, electricity, cable TV and exam PINs, with customer validation before you pay
- Paystack checkout with a callback page that confirms the payment with the server
- Receipt page for every payment (`/receipt/[id]`)
- Saved beneficiaries for repeat payments

**Admin dashboard** (`/admin`)
- Separate admin login
- Overview stats, transactions list and customer accounts
- Biller catalogue management
- Reconciliation view to find payments that did not complete

**Landing page** with product showcase and a live transfer demo.

## Tech stack

| Area | Tools |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn style components |
| State | React Context |
| Payments | Paystack (through the backend) |
| Hosting | Vercel (web), Render (API) |

## Project structure

```
app/
  page.tsx            landing page
  app/                customer app (after login)
  bills/              bill payment flow and Paystack callback
  receipt/[id]/       payment receipts
  admin/              admin dashboard
components/
  auth/               sign up, login, OTP and passcode screens
  screens/            home, send, bills, cards, profile
  bills/              bill payment flow
  admin/              dashboard widgets
  marketing/          landing page sections
lib/
  api.ts              API client
  auth-api.ts         auth calls
  admin-api.ts        admin calls
context/              app state
docs/                 design notes and integration docs
```

## Run locally

You need Node 20+ and the backend running (see the backend repo).

```bash
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_BASE_URL
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Environment variables

| Name | What it is |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | URL of the PayXpress API, for example `http://localhost:8080` |

Real values live in `.env.local`, which is git ignored. Never commit keys.

## Author

**Ooreofeoluwa Popoola**, full stack software engineer (backend focused).
[Portfolio](https://ooreofepopoola.dev) · [LinkedIn](https://www.linkedin.com/in/ooreofeoluwa-popoola-8260ba3b4/) · [GitHub](https://github.com/Ooreofe22)
