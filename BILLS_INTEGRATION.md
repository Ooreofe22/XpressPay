# Bills page → backend integration

## What changed

- **`components/screens/BillsScreen.tsx`** — rewritten. Previously showed 4 hardcoded
  provider circle arrays with no-op `onSeeAll`. Now fetches real billers from
  `GET /billers` on mount, groups them by `categoryPath`, and tapping any circle opens
  the real payment flow. Added a live search box (was decorative before) and loading/
  error states.
- **`components/bills/BillPaymentFlow.tsx`** — new. The actual multi-step flow: details →
  (validate, for electricity/cable only) → confirm → redirect to gateway. Styled to
  match `SendMoneyScreen.tsx`'s existing conventions exactly (same semantic Tailwind
  classes: `bg-primary`, `bg-card`, `border-card-border`, `elevation-1`, etc.) — not a
  reskin, it uses the real design tokens already in this project's `globals.css`.
- **`app/bills/callback/page.tsx`** — new. This didn't exist before at all. It's the
  page gateway redirects back to after checkout — reads `?reference=` from the URL,
  calls `GET /billers/payments/verify/{reference}` (which actively triggers server-side
  confirmation), and shows a receipt-style result. Polls briefly if still `pending`.
- **`lib/api.ts`** — new. Typed fetch wrapper for all the biller/payment endpoints.
- **`types/index.ts`** — added `Biller`, `BillerValidateResult`, `BillCheckoutResponse`.

## Backend config you need to set

`paystack.callback.url` on the backend must point to this frontend's callback route,
e.g. `https://your-frontend-domain.com/bills/callback` (or `http://localhost:3000/bills/callback`
for local dev against a local backend).

## Auth is now wired (update)

The section below describing missing auth wiring is **resolved**. Summary of what changed:

- `lib/auth-api.ts` (new) — real calls to `/auth/signup/*` and `/auth/login/*`, plus
  `/wallet/balance` and `/wallet/accounts`.
- `lib/localPin.ts` (new) — the 4-digit PIN screen (`WelcomeBackScreen.tsx`) is a
  **local device unlock gate**, not a backend concept — the backend is phone+OTP only.
  First entry for a phone on a device sets the PIN (hashed via Web Crypto, stored in
  `localStorage`); every entry after that validates against it.
- `WelcomeBackScreen.tsx` — redesigned. Was a full-screen numeric keypad (mobile-app
  style, including a non-functional fingerprint icon) — replaced with 4 keyboard-typeable
  boxes matching the OTP screens' exact visual pattern. Now also doubles as the shared
  final step for **both** signup and login (see below).
- `SignUpBVN.tsx` — added a phone number field. The original mock copy implied the
  phone was "linked to your BVN," but the real backend needs an actual phone number to
  send an OTP to, since BVN is format-checked only, not looked up against a registry.
- `SignUpOTP.tsx` — on successful verify, now routes to `login-welcome`
  (`WelcomeBackScreen`) instead of straight to `dashboard` — reuses the exact same
  finishing screen/code login uses, per your request, instead of a separate
  signup-specific completion screen.
- **Backend change:** `AuthController.issueTokens()` now also returns `userId` and
  `phone` in the response body — needed because the frontend has to build a `User`
  object after login/signup completes, and there was previously no way to get the
  phone/id without decoding the JWT client-side.

### Known limitation, disclosed not hidden

The backend `User` entity only stores `{ id, phone, status }` — no name, no email.
`AppContext.completeLogin()` builds a placeholder name (`User 5678`, last 4 digits of
phone) and email (`{phone}@payxpress.ng`, matching the same placeholder pattern the
backend itself uses for Paystack). `accountBalance` and `accountNumber` are real,
pulled from `/wallet/balance` and `/wallet/accounts`. If you want a real name field,
that requires a backend change (add `name` to signup, likely as a new step) — not
done here since it wasn't asked for and changes the signup screens' fields.

## What's honestly NOT done — don't assume this is complete (original notes below)

1. ~~No real auth token exists yet~~ — **fixed, see "Auth is now wired" above.**

2. **The "Transactions" tab in `BillsScreen.tsx` is still the old static placeholder.**
   `fetchBillPaymentHistory()` exists in `lib/api.ts` but isn't called anywhere yet —
   wasn't in scope for "the bills page I missed," but flagging it since it's an
   obvious next step once auth is real.

3. **`Transaction.timestamp` is typed as `Date`** but anything coming from `fetch()`
   is actually a JSON string at runtime, not a real `Date` instance. Nothing I wrote
   calls date methods on it, so it's not an active bug right now, but if you wire the
   history tab and call `.toLocaleDateString()` on a fetched transaction, it'll throw.
   Parse with `new Date(t.timestamp)` when consuming API responses.

4. **Only airtime, data, electricity, cable are wired** — matches backend scope.
   WAEC PIN (education) exists on the backend but has no frontend entry point yet.

## Next logical step

Wire the auth screens (`SignUpOTP.tsx`, `LoginOTPScreen.tsx`) to the real
`/auth/signup/verify-otp` and `/auth/login/verify-otp` endpoints, and store the
returned `accessToken` in `localStorage` under `payxpress_access_token` right after
success. That one change unblocks everything else in this integration.
