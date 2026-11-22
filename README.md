# Tsunagu Generations (繋ぐ)

> **"Connecting the wisdom of the past with the energy of today."**

Tsunagu Generations is a community platform bridging older and younger generations through knowledge sharing, skill exchange, daily assistance, and companionship.

---

## 🏗️ Architecture & Project Organization

The codebase is organized in an **Industry-Standard Layered / Hexagonal Architecture**:

```text
tsunagu-generations/
├── 1. FRONTEND LAYER
│   ├── app/                      # Next.js 14 App Router (all pages & routes)
│   │   ├── (auth)                # Login, Register, Onboarding
│   │   ├── posts/                # Browse, New, Details (Leaflet Map), Edit
│   │   ├── quick-post/           # 4-step minimal-typing wizard for O.G.
│   │   ├── search/               # LinkedIn-style search (Posts first, then People)
│   │   ├── requests/             # Incoming & Outgoing service requests
│   │   ├── chat/                 # Real-time simulated chat with auto-reply
│   │   ├── transactions/         # Simulated demo payments
│   │   ├── my-activity/          # Activity history & tabbed hub
│   │   ├── feedback/             # Post-activity star ratings & reviews
│   │   ├── profile/              # Public profile & Tag-based profile editing
│   │   └── about/                # Safety guidelines, FAQ, and Support
│   └── components/               # Design system & domain components
│       ├── ui/                   # Button, Card, Badge, Input, Textarea
│       ├── common/               # Header, Footer, SafetyBanner, StatusBadge
│       ├── posts/                # PostCard
│       ├── search/               # PersonCard
│       └── maps/                 # Leaflet Dynamic Client Map
│
├── 2. BACKEND & SERVICE LAYER
│   └── lib/
│       ├── services/             # Service Layer (Port & Adapter pattern)
│       │   ├── authService.ts    # Authentication & Session
│       │   ├── postService.ts    # Posts CRUD
│       │   ├── requestService.ts # Service request workflows & completion
│       │   ├── chatService.ts    # Chat messaging & canned responses
│       │   ├── searchService.ts  # Hybrid Post & People matching
│       │   └── ...
│       ├── validators/           # Zod form schemas & business rules
│       ├── store/                # Zustand client cache with LocalStorage persistence
│       └── mock/                 # Seed data with 10 users, 15 posts, chats
│
└── 3. DATABASE LAYER
    └── supabase/
        └── schema.sql            # PostgreSQL DDL, relational tables & RLS policies
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm or yarn or pnpm

### 2. Installation
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 👥 Demo Accounts (1-Click Login Available)

Any password with **4+ characters** works in this demo MVP. The database comes pre-seeded with 10 community members.

| User | Generation Group | Email | Expertise / Focus |
|---|---|---|---|
| **Kenji Sato** | Older Generation (O.G.) | `kenji.sato@example.com` | Traditional cooking, calligraphy, garden care |
| **Maya Tanaka** | Younger Generation (Y.G.) | `maya.tanaka@example.com` | Smartphone assistance, Zoom setup, grocery errands |
| **Haruto Takahashi** | Older Generation (O.G.) | `haruto.takahashi@example.com` | Carpentry, bonsai, traditional storytelling |
| **Aoi Suzuki** | Younger Generation (Y.G.) | `aoi.suzuki@example.com` | Tech help, photo scanning, companionship |

*Tip: You can also register a brand new user account directly on `/register`!*

---

## 🔄 Resetting Demo Data
A prominent button in the footer: **"Reset demo data"** instantly resets the in-memory/localStorage store back to the clean seed data.

---

## 🔌 How to Swap Services for Supabase (Phase 2 Migration)

The application strictly calls the service layer (`lib/services/*`) and never touches the Zustand store directly from components. 

To connect Supabase in Phase 2:
1. Run `supabase/schema.sql` in your Supabase SQL Editor.
2. Add your Supabase credentials to `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. In `lib/services/*.ts`, replace the internal `useAppStore` mutations with `@supabase/supabase-js` database queries. Because function signatures match the domain types in `lib/types.ts`, **zero frontend components need to be edited**.

### Relational Tables & RLS Policies in `supabase/schema.sql`:
- `profiles`: User information, age groups, availability, and contact preferences.
- `skills` & `needs`: Normalized skills and assistance requirements.
- `posts`: Service offers and requests with exchange arrangements.
- `requirement_templates`: Quick-post templates for older users.
- `service_requests`: Connections between users (gated chat access).
- `conversations` & `messages`: Private chat threads protected by RLS.
- `notifications`: User notifications with Realtime subscription.
- `transactions`: Demo payments log.
- `reviews` & `activities`: Star ratings and completed activity records.
- `reports` & `blocks`: Moderation and user safety enforcement.

---

## ♿ Accessibility & Usability Highlights
- **18px base font** with high-contrast warm color palette.
- **Larger Text toggle (`Aa`)** in the header (persisted in localStorage).
- **Minimum 48px tap targets** for touch screens and older users.
- **Quick Post Wizard (`/quick-post`)**: 4-step guided wizard requiring zero typing.
- **Leaflet & OpenStreetMap**: Interactive approximate location map (client-only dynamic import, no API key required).
