# PayXpress - Mobile Banking App

A comprehensive Nigerian fintech mobile banking application built with Next.js 16, React 19, and Tailwind CSS. PayXpress provides a seamless experience for money transfers, bill payments, card management, and account management.

## Features

### 5 Main Tabs
- **Home**: Account balance, quick actions, recent transactions
- **Send**: Money transfer with saved contacts
- **Pay**: Bill payments (Airtime, Data, Cable, Electricity, Betting)
- **Cards**: Debit/Credit card management with CVV display
- **More**: Settings, profile, KYC upgrades, support

### Core Functionality
- **Authentication**: Secure 4-digit passcode login (demo: 1234)
- **Balance Management**: Real-time account balance with visibility toggle
- **Money Transfer**: Multi-step transfer flow with confirmation and receipt
- **Bill Payments**: Quick access to 5+ VAS providers
- **Card Management**: Display card details with copy/share functionality
- **Transaction History**: Complete transaction tracking with status
- **KYC Levels**: Bronze, Silver, Gold tier verification system

### Design Features
- Dark mode optimized UI with purple accent (#7C3AED)
- Mobile-first responsive design (390px optimized)
- Smooth animations and transitions
- Accessibility-compliant components
- Nigeria-focused localization (NGN currency, banks, providers)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19.2.4
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **State Management**: React Context API
- **Fonts**: Geist Sans/Mono via next/font

## Project Structure

```
├── app/
│   ├── layout.tsx           # Root layout with AppProvider
│   ├── page.tsx             # Main app entry point
│   └── globals.css          # Design system tokens
├── components/
│   ├── auth/                # Login, KYC, Splash screens
│   ├── layout/              # Header, Navigation
│   ├── screens/             # Home, Send, Bills, Cards, More
│   ├── ui/                  # Button, Card, Input, Avatar, Badge
│   └── layout/              # BottomNavigation
├── context/
│   └── AppContext.tsx       # Global state management
├── types/
│   └── index.ts             # TypeScript interfaces
└── lib/
    └── utils.ts             # Utility functions
```

## Installation

### Using Shadcn CLI (Recommended)
```bash
npx shadcn-cli@latest init --preset payxpress-fintech
```

### Manual Setup
```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Demo Credentials

- **Passcode**: `1234`
- **User**: Chukwu Okafor
- **Account Balance**: ₦450,000
- **KYC Level**: GOLD

## Key Screens

### 1. Login Screen
- 4-digit passcode input with visual feedback
- Demo credentials clearly displayed
- Security messaging

### 2. Home Dashboard
- Account balance with eye icon toggle
- Quick action buttons (Send, Pay, Add Money, Withdraw)
- Recent transactions list with status
- Account info and KYC level badge

### 3. Send Money
- Contact search and selection
- Multi-step flow: Select → Amount → Confirm
- Transaction confirmation with all details
- Success receipt modal

### 4. Pay Bills
- 5 service categories (Airtime, Data, Cable, TV, Betting)
- Provider selection for each service
- Amount and ID input
- Confirmation before payment

### 5. Cards Management
- Card display with masked number
- CVV visibility toggle
- Card copy functionality
- Active/Inactive status
- Recent card transactions

### 6. More / Settings
- User profile summary
- Menu items for settings, support, legal
- Account statements access
- KYC upgrade option
- Logout functionality

## Design System

### Color Palette
- **Background**: #0D0D0D
- **Primary**: #7C3AED (Purple)
- **Cards**: #1A1A1A
- **Borders**: #2A2A2A
- **Success**: #10B981
- **Warning**: #F59E0B
- **Danger**: #EF4444

### Typography
- **Heading Font**: Geist Sans (Bold, 600-700 weight)
- **Body Font**: Geist Sans (Regular, 400 weight)
- **Line Height**: 1.4-1.6 (relaxed)

### Components
- Custom buttons with 4 variants (primary, secondary, ghost, danger)
- Card system with gradient support
- Input fields with icons and validation
- Avatar with fallback initials
- Badge component with multiple styles
- Passcode input with auto-focus

## State Management

The app uses React Context API (`AppContext`) for global state:

```typescript
- user: User | null
- isAuthenticated: boolean
- transactions: Transaction[]
- bankContacts: BankContact[]
- cards: Card[]
- currentTab: 'home' | 'send' | 'pay' | 'cards' | 'more'
```

## Mock Data

All data is provided via context and persists during the session:

- **Users**: Pre-populated with demo user (Chukwu Okafor)
- **Transactions**: Sample transactions with various types and statuses
- **Contacts**: Pre-saved bank contacts for quick transfers
- **Cards**: Single debit card with transaction history

## Responsive Design

The app is optimized for mobile-first design:
- **Mobile**: 390px (primary target)
- **Tablet**: 768px and above
- **Desktop**: 1024px and above

All touch targets are ≥44px for accessibility.

## Accessibility

- Semantic HTML elements throughout
- ARIA labels and roles
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly
- Proper heading hierarchy

## Performance Optimizations

- Image optimization with Next.js Image
- CSS-in-JS with Tailwind for small bundle
- Component code splitting
- Lazy loading for modal components
- CSS animations with GPU acceleration

## Future Enhancements

- Real backend API integration
- Biometric authentication
- Real-time notifications
- Transaction scheduling
- Budget tracking and analytics
- Multiple account support
- International transfers
- Investment features

## Deployment

### Deploy to Vercel (Recommended)
```bash
vercel
```

### Deploy to Other Platforms
```bash
pnpm build
# Deploy the .next folder
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari 14+

## License

MIT License - feel free to use this project for learning and commercial purposes.

## Support

For issues, feature requests, or contributions, please create an issue or pull request on GitHub.

---

Built with care for the Nigerian fintech ecosystem. Fast, secure, and beautiful mobile banking.
