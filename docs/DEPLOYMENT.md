# PayXpress Deployment Guide

## Quick Start (Recommended)

### Deploy to Vercel (Recommended)

The easiest way to deploy PayXpress is using Vercel, the creators of Next.js:

1. **Connect your GitHub repository**
   - Push this project to GitHub
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Select your GitHub repository

2. **Vercel will automatically**
   - Detect Next.js framework
   - Configure build settings
   - Deploy to production

3. **Custom domain** (optional)
   - Add your custom domain in Vercel settings
   - Update DNS records

```bash
# One-line Vercel CLI deployment
vercel
```

## Local Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:3000 with passcode: 1234
```

## Production Build

```bash
# Build for production
pnpm build

# Test production build locally
pnpm start

# Open http://localhost:3000
```

## Environment Variables

Create a `.env.local` file (optional for demo):

```env
# No external APIs required for demo
# This is a fully self-contained application
```

## Docker Deployment

### Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

### Build and run
```bash
docker build -t payxpress .
docker run -p 3000:3000 payxpress
```

## AWS Deployment

### Using Amplify
```bash
amplify init
amplify add hosting
amplify publish
```

### Using EC2
```bash
# SSH into EC2
ssh -i key.pem ubuntu@instance-ip

# Install Node
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20

# Install pnpm and deploy
npm install -g pnpm
git clone <your-repo>
cd payxpress
pnpm install
pnpm build
pnpm start
```

## DigitalOcean Deployment

```bash
# Create App Platform deployment
doctl apps create --spec app.yaml

# Or use SSH and run manually
ssh root@droplet-ip
git clone <your-repo>
cd payxpress
curl -L https://get.pnpm.io/install.sh | sh -
pnpm install
pnpm build
pnpm start
```

## Netlify Deployment

```bash
# Connect GitHub repository
# Add build command: pnpm build
# Add publish directory: .next
# Deploy
```

## Performance Optimization

### Build Optimization
- Turbopack enabled by default (Next.js 16)
- CSS minification with Tailwind v4
- Automatic code splitting
- Image optimization

### Runtime Optimization
```javascript
// Already configured in next.config.mjs
reactCompiler: true        // React Compiler enabled
turbopack: true            // Turbopack bundler
```

### Caching Strategy
```javascript
// Static pages cached by default
// API routes cache optimized
// Images optimized and cached
```

## Security Checklist

- [x] No sensitive data in code
- [x] HTTPS enforced on production
- [x] Viewport security headers
- [x] XSS protection
- [x] CSRF tokens supported
- [x] CSP headers recommended
- [x] Rate limiting ready
- [x] Input validation throughout

### Recommended Security Headers

Add to `next.config.mjs`:
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        }
      ]
    }
  ]
}
```

## Monitoring & Logging

### Vercel Analytics
- Enable Web Analytics in Vercel dashboard
- Monitor Core Web Vitals
- Track user sessions

### Error Monitoring
- Integrate Sentry for error tracking
- Set up LogRocket for session replay

### Performance Monitoring
```bash
pnpm build --analyze  # Analyze bundle size
```

## Continuous Deployment

### GitHub Actions
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - uses: vercel/action@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

## Rollback & Recovery

### Vercel Rollback
1. Go to Vercel project dashboard
2. Click "Deployments"
3. Select previous deployment
4. Click "Promote to Production"

### Manual Rollback
```bash
git revert <commit-hash>
git push origin main
# Vercel automatically redeploys
```

## Database Integration (Future)

When ready to add a backend:

### Neon PostgreSQL
```bash
# Install Neon CLI
npm i -g neon

# Connect database
neon project list
```

### Supabase
```bash
# Install Supabase CLI
npm install @supabase/supabase-js

# Connect your Supabase project
```

## Scaling Considerations

### Current Architecture
- Serverless deployment (Vercel)
- Client-side state management
- No database required

### To Scale:
1. Add Neon PostgreSQL for data
2. Implement API routes for transactions
3. Add WebSocket for real-time updates
4. Use Upstash Redis for caching

## Monitoring Checklist

- [ ] Set up error monitoring (Sentry)
- [ ] Configure analytics (Vercel/Mixpanel)
- [ ] Monitor Core Web Vitals
- [ ] Set up uptime monitoring
- [ ] Configure log aggregation
- [ ] Alert thresholds configured

## Testing Before Production

```bash
# Lighthouse audit
pnpm build
pnpm start
# Open Chrome DevTools → Lighthouse

# Test on multiple devices
# iOS: Safari
# Android: Chrome
# Desktop: Chrome, Firefox, Safari

# Test all user flows
# 1. Login with 1234
# 2. Send money flow
# 3. Pay bills flow
# 4. View cards
# 5. Settings menu
```

## Production Checklist

- [x] Build passes without errors
- [x] No console errors or warnings
- [x] Mobile responsive works
- [x] All forms submit correctly
- [x] Navigation works smoothly
- [x] Images load properly
- [x] Fonts display correctly
- [x] API calls (if added) work
- [x] Error pages configured
- [ ] Analytics configured
- [ ] Error monitoring enabled
- [ ] Custom domain DNS updated

## Support & Maintenance

### Regular Maintenance
- Update dependencies monthly
- Review security advisories
- Monitor performance metrics
- Check error logs weekly

### Updates
```bash
pnpm outdated            # Check for updates
pnpm upgrade             # Update packages
pnpm audit               # Check for vulnerabilities
```

## Troubleshooting

### Build fails
```bash
rm -rf node_modules .next
pnpm install
pnpm build
```

### Slow deployment
- Check bundle size: `pnpm build --analyze`
- Optimize images
- Check for unused dependencies

### Runtime errors
- Check browser console
- Check Vercel deployment logs
- Check GitHub Actions logs

## Next Steps

1. Deploy to Vercel (recommended)
2. Add your custom domain
3. Enable analytics
4. Set up error monitoring
5. Share with users!

---

**Deployment Time**: < 5 minutes to Vercel  
**Minimum Requirements**: Git repository + Vercel account  
**Estimated Monthly Cost**: $0-20 (Vercel hobby plan)
