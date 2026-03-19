# Better Credit Partners - Design Guidelines

## Brand Manual Reference
Based on the Better Credit Partners brand manual with the following core identity:
- **Purpose**: Support individuals in taking informed, ethical actions to improve their credit profiles
- **Tone**: Clear, respectful, encouraging, and empowering
- **Position**: Guides, not saviors - long-term partners in financial growth

## Design Approach
**System Selected**: Brand-aligned professional services design
**Rationale**: Trust-focused industry requiring clear information hierarchy, compliance-first layout, and accessibility. Design emphasizes credibility, protection, progress, and partnership.

## Color Palette (From Brand Manual)
- **Primary**: #123f56 (Dark Teal) - Main brand color for buttons, links, accents
- **Accent**: #52ceff (Light Cyan) - Highlights, secondary accents
- **Success**: #409645 (Green) - Positive indicators, success states
- **Secondary**: #c0d353 (Lime Green) - Alternative accent color
- **Dark**: #060414 (Near Black) - Dark mode backgrounds, hero sections
- **Light**: #ffffff (White) - Light mode backgrounds

## Typography System
- **Primary Font**: Inter (Google Fonts) - as specified in brand manual
- **Weight Usage**:
  - Titles: Bold or Extra Bold (font-bold, font-extrabold)
  - Subtitles: Regular or Extra Light Italic
  - Paragraphs: Extra Light, Regular, or Bold
- **Hierarchy**:
  - H1: text-4xl md:text-5xl, font-bold, leading-tight
  - H2: text-3xl md:text-4xl, font-semibold
  - H3: text-2xl, font-semibold
  - Body: text-base md:text-lg, leading-relaxed
  - Legal/Disclosure Text: text-sm, leading-normal
  - CTAs: text-lg, font-semibold

## Layout System
- **Spacing Primitives**: Tailwind units 4, 6, 8, 12, 16, 20, 24 (e.g., p-8, mb-12, py-20)
- **Container**: max-w-7xl with px-6 md:px-8 for consistency
- **Section Padding**: py-16 md:py-24 for major sections
- **Component Spacing**: gap-8 md:gap-12 between elements

## Page-Specific Layouts

### Home Page
- **Hero Section**: Full-width with professional stock image (business handshake/document signing), h-[600px], content overlay with backdrop-blur-sm on dark overlay
- **Structure**: 6 sections total
  1. Hero with trust indicators (years in business, clients served)
  2. "What We Do" - 3-column grid (lg:grid-cols-3)
  3. "How We're Different" - 2-column feature comparison with icons
  4. Trust badges/compliance logos section
  5. Process preview (linking to How It Works)
  6. CTA section with contact form preview

### How It Works
- Timeline/stepper layout with 4 major steps
- Each step: left-aligned number badge, right content block
- Progress connector line between steps
- Compliance callout box at bottom (border-l-4 accent, bg-subtle, p-6)

### Services Page
- Card-based grid layout (grid-cols-1 md:grid-cols-2)
- Each service card: icon, title, description, "Learn More" link
- Educational focus with bullet points
- Disclaimer section prominently displayed

### Pricing Page
- Single-column centered layout (max-w-3xl)
- Pricing card with clear breakdown
- Mandatory disclosure in dedicated callout box (border-2, rounded-lg, p-8)
- State-specific notes in expandable accordions
- CTA below pricing with cancellation rights visible

### Legal & Disclosures
- Document-style layout with table of contents sidebar (sticky on desktop)
- Clear section dividers with h-1 borders
- Highlighted boxes for critical CROA, Florida, Texas disclosures (p-6, rounded-lg, border-l-4)
- Print-friendly formatting

### Contact Page
- 2-column layout: Form (left, 60%) + Info sidebar (right, 40%)
- Required business information prominently displayed
- Office hours, response time expectations
- Map placeholder for physical address

## Component Library

### Navigation
- Sticky header with backdrop-blur-md
- Logo left, nav links center, CTA button right
- Mobile: Hamburger menu with full-screen overlay

### Cards
- Elevated cards: shadow-md hover:shadow-lg transition
- Padding: p-6 md:p-8
- Rounded: rounded-xl
- Border: border border-slate-200

### Buttons
- Primary CTA: px-8 py-4, rounded-lg, font-semibold, shadow-md
- Secondary: outlined variant with border-2
- Blurred backgrounds on image overlays: backdrop-blur-md bg-white/90

### Disclosure/Callout Boxes
- Warning style: border-l-4 border-amber-500, bg-amber-50, p-6
- Info style: border-l-4 border-blue-500, bg-blue-50, p-6
- Legal: border-2, p-8, rounded-lg

### Forms
- Input fields: h-12, px-4, rounded-md, border-2
- Labels: text-sm, font-medium, mb-2
- Validation states with colored borders

### Footer
- 4-column grid on desktop (lg:grid-cols-4)
- Compliance links prominently featured
- Required disclosures in dedicated section
- Structured: Company Info | Quick Links | Legal | Contact

## Icons
- **Library**: Heroicons (outline for UI, solid for emphasis)
- Usage: Checkmarks for features, shield for trust, document for legal, phone/email for contact

## Images
- **Hero Image**: Professional business consulting scene (handshake, professional meeting, or person reviewing documents) - warm, trustworthy aesthetic
- **About Page**: Team photo or professional office environment
- Image treatment: Subtle overlay (bg-gradient-to-r from-slate-900/80 to-slate-900/60) for text legibility

## Accessibility
- Minimum touch targets: 44x44px
- Form labels always visible
- Focus states: ring-2 ring-offset-2
- ARIA labels on all interactive elements
- Color contrast: minimum WCAG AA compliance

## Key Design Principles
1. **Trust First**: Professional, credible aesthetic throughout
2. **Compliance Visible**: Legal disclosures never buried
3. **Educational Tone**: Approachable but authoritative
4. **Transparency**: Clear pricing, process, limitations
5. **Responsive**: Mobile-optimized for all content, especially legal text