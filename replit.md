# Better Credit Partners Website

## Overview
A professional, CROA-compliant credit consulting website for Better Credit Partners. The site provides credit education and dispute assistance services, with full compliance for Florida and Texas state regulations.

## Tech Stack
- **Frontend**: React with TypeScript, TailwindCSS, Shadcn UI components
- **Backend**: Express.js with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form with Zod validation

## Project Structure
```
client/
  src/
    components/        # Reusable UI components
      header.tsx       # Navigation header with theme toggle
      footer.tsx       # Footer with compliance disclosures
      theme-provider.tsx # Dark/light mode provider
      theme-toggle.tsx # Theme toggle button
      ui/              # Shadcn UI components
    pages/             # Page components
      home.tsx         # Landing page with hero, services, differences
      how-it-works.tsx # Step-by-step process
      services.tsx     # Service offerings
      pricing.tsx      # Pricing with state disclosures
      about.tsx        # Company information
      contact.tsx      # Contact form
      legal.tsx        # Legal & disclosures (CROA, FL, TX)
      privacy.tsx      # Privacy policy
      terms.tsx        # Terms of service
    App.tsx            # Main app with routing
server/
  routes.ts            # API endpoints
  storage.ts           # In-memory storage
shared/
  schema.ts            # Data models and Zod schemas
```

## Pages
1. **Home** - Hero section, services overview, differentiators, trust badges
2. **How It Works** - 4-step process with compliance callouts
3. **Services** - Service cards with features and disclaimers
4. **Pricing** - $99/month plan with FL/TX state disclosures
5. **About** - Mission, values, states served
6. **Contact** - Contact form with validation
7. **Legal & Disclosures** - CROA, Florida, Texas disclosures
8. **Privacy Policy** - Data handling and security
9. **Terms of Service** - Service limitations and agreements

## API Endpoints
- `POST /api/contact` - Submit contact form message

## Brand Manual
The site follows the Better Credit Partners brand manual:
- **Primary Color**: #123f56 (Dark Teal)
- **Accent Color**: #52ceff (Light Cyan)
- **Success Color**: #409645 (Green)
- **Secondary Accent**: #c0d353 (Lime Green)
- **Dark Background**: #060414 (Near Black)
- **Typography**: Inter font family (all weights)
- **Tone**: Clear, respectful, encouraging, and empowering

## Key Features
- Dark/light mode toggle with brand colors
- Responsive design for all screen sizes
- CROA-compliant language throughout
- State compliance disclosures for all 11 served states
- Brand-aligned professional design
- Accessible UI with proper ARIA labels

## States Served
AL, AK, KY, MT, NJ, NM, ND, RI, SD, VT, WY (11 states)

## Compliance Notes
- No guaranteed results or specific point increases promised
- Clear cancellation rights (3 business days)
- Transparent pricing with mandatory disclosures
- Client education focused approach
- Direct dispute rights clearly communicated
- CROA and FCRA compliant across all served states

## Development
The application runs on port 5000 with the `npm run dev` command.
