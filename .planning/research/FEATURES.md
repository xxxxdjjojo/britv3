# Features Research: UK Property Portal

**Project:** Britestate v3.0
**Confidence:** HIGH

## Table Stakes (Must Have or Users Leave)

### Property Search (Epic 2)
| Feature | Complexity | Notes |
|---------|-----------|-------|
| Location-based search (postcode, area) | Medium | Rightmove/Zoopla baseline |
| Property type, price, bedrooms filters | Low | Every portal has this |
| Map-based search with pins | High | MapLibre + clustering required |
| Photo gallery (multiple images) | Medium | Supabase Storage |
| Save/shortlist properties | Low | Requires auth |
| Property alerts (new matches) | Medium | Realtime + email notifications |
| Sort by price, date, relevance | Low | Database query ordering |

### Authentication (Epic 1)
| Feature | Complexity | Notes |
|---------|-----------|-------|
| Email/password signup & login | Low | Supabase Auth baseline |
| Email verification | Low | Supabase handles this |
| Password reset | Low | Supabase handles this |
| Session persistence | Low | JWT refresh tokens |
| Google OAuth | Low | Supabase social auth |

### Communication (Epic 5)
| Feature | Complexity | Notes |
|---------|-----------|-------|
| Contact agent/landlord about property | Medium | Messaging system |
| Email notifications for messages | Medium | Resend integration |
| In-app notification bell | Medium | Supabase Realtime |

### Financial Tools (Epic 8)
| Feature | Complexity | Notes |
|---------|-----------|-------|
| Mortgage calculator | Low | Client-side calculation |
| Stamp duty calculator | Low | UK tax bands logic |
| Total cost breakdown | Medium | Aggregation of fees |

### Trust & Compliance (Epics 1, 11)
| Feature | Complexity | Notes |
|---------|-----------|-------|
| GDPR consent management | Medium | Must be built from Epic 1 |
| Privacy policy & terms | Low | Content pages |
| Secure data handling | Medium | RLS, encryption |
| Cookie consent | Low | Standard banner |

### Listing Management (Epic 2)
| Feature | Complexity | Notes |
|---------|-----------|-------|
| Create property listing | High | Multi-step form with media upload |
| Edit/update listings | Medium | Form pre-population |
| Listing status (active/draft/sold) | Low | Status field |
| Media upload (photos, floor plans) | High | Supabase Storage with optimization |

### Mobile (Epic 9)
| Feature | Complexity | Notes |
|---------|-----------|-------|
| Responsive design | Medium | Tailwind responsive utilities |
| Touch-friendly interactions | Medium | Mobile-first component design |

## Differentiators (Competitive Advantage)

### AI-Powered Features (Epic 6)
| Feature | Complexity | Competitors Lack |
|---------|-----------|-----------------|
| Semantic/natural language search | Very High | Rightmove/Zoopla have keyword-only |
| AI property recommendations | High | Limited collaborative filtering elsewhere |
| Match scoring (0-100) with explanation | High | No competitor does this |
| AI-generated property descriptions | Medium | Unique to Britestate |
| Automated valuation model (AVM) | Very High | Zoopla has basic version |
| AI business insights for providers | Medium | Checkatrade doesn't offer this |

### Integrated Marketplace (Epic 4)
| Feature | Complexity | Competitors Lack |
|---------|-----------|-----------------|
| Request for Quote (RFQ) system | High | Checkatrade has basic version, not integrated with property |
| Provider verification pipeline | High | Multi-stage verification unique |
| Integrated payments (Stripe Connect) | Very High | No property portal does this |
| Review & rating system | Medium | Standard but integrated with transactions |
| Provider booking & scheduling | High | Calendar integration |
| 27+ service categories | Medium | Content/configuration |

### Transaction Transparency (Epic 10)
| Feature | Complexity | Competitors Lack |
|---------|-----------|-----------------|
| Real-time transaction timeline | High | No competitor has end-to-end tracking |
| Chain visualization | Very High | Unique — shows linked property chains |
| Document repository with e-signatures | High | HelloSign integration |
| Offer management & negotiation | High | Digital offer flow |

### Landlord Tools (Epic 7)
| Feature | Complexity | Competitors Lack |
|---------|-----------|-----------------|
| Portfolio dashboard | High | OpenRent has basic version |
| Tenant management | High | Integrated with marketplace |
| Compliance certificate tracking | Medium | Automated reminders |
| Rent collection tracking | Medium | Payment history |
| Maintenance request pipeline | High | Contractor assignment integration |
| Financial reporting & tax summary | High | Investment analysis |

### Multi-Role Platform (Epics 1, 3)
| Feature | Complexity | Competitors Lack |
|---------|-----------|-----------------|
| 7 role-specific dashboards | Very High | No competitor serves all roles |
| Role switching (buyer who is also landlord) | High | Unique UX challenge |
| Cross-role communication | Medium | Unified messaging across roles |

### Advanced Search (Epic 2)
| Feature | Complexity | Competitors Lack |
|---------|-----------|-----------------|
| Draw-to-search (polygon on map) | High | Rightmove has basic version |
| Travel time / commute search | Very High | External API needed |
| School catchment overlay | High | Data integration |
| Crime statistics overlay | High | Police API data |
| EPC rating filter | Low | Some portals have this |
| Recent sold prices | Medium | Land Registry data |
| Planning applications nearby | High | External data source |

### PWA (Epic 9)
| Feature | Complexity | Competitors Lack |
|---------|-----------|-----------------|
| Offline property viewing | High | Service worker caching |
| Push notifications | Medium | Web Push API |
| Install to home screen | Low | PWA manifest |

## Anti-Features (Do NOT Build)

| Feature | Why NOT | Risk if Built |
|---------|---------|--------------|
| Native mobile apps | Web-first, PWA covers mobile. Native adds 2x maintenance | Split resources, slower iteration |
| Real-time chat (WhatsApp-style) | Async messaging is sufficient for property inquiries | Over-engineering, Supabase Realtime cost |
| Video calling | External tools (Zoom, Teams) already solve this | Massive complexity for low usage |
| Social feed / timeline | Property portal, not social network | Scope creep, dilutes core value |
| Blockchain property records | No market demand, regulatory complexity | Years of work, no user benefit |
| AR/VR property tours | Future tech, not table stakes | Hardware dependency, high cost |
| Price negotiation automation | Human judgment critical for property deals | Legal liability, user distrust |
| Automated mortgage applications | Regulated activity requiring FCA authorization | Legal risk |
| Property management accounting | Full accounting suites (Xero, QuickBooks) exist | Competing with established tools |
| Multi-language support | UK-only market, English is primary | Translation maintenance burden |
| Voice search | Low adoption, complex NLP for property domain | High cost, low usage |
| Predictive maintenance AI | Insufficient data for new platform | AI without data = guessing |
| White-label for agents | Agency branding adds massive complexity | Theming, multi-tenancy overhead |
| Commercial property vertical | Different market dynamics, different users | Dilutes residential focus |

## Feature Dependencies (Critical Path)

```
Epic 1 (Auth) ──────────────────────────────────────────►
  │
  ├── Epic 2 (Property Search) ─────────────────────────►
  │     │
  │     ├── Epic 3 (Dashboards) ────────────────────────►
  │     │     │
  │     │     ├── Epic 7 (Landlord Tools) ──────────────►
  │     │     │
  │     │     └── Epic 8 (Financial Tools) ─────────────►
  │     │
  │     └── Epic 6 (AI Features) ───────────────────────►
  │
  ├── Epic 4 (Marketplace) ─────────────────────────────►
  │     │
  │     └── Stripe Connect (payments depend on auth + provider profiles)
  │
  ├── Epic 5 (Communication) ──────────────────────────►
  │
  ├── Epic 9 (Mobile/PWA) ── can overlay on any epic ──►
  │
  ├── Epic 10 (Admin) ── needs data from epics 1-8 ────►
  │
  └── Epic 11 (Compliance) ── GDPR starts in Epic 1 ──►
```

## Competitor Feature Matrix

| Feature | Britestate | Rightmove | Zoopla | OnTheMarket | OpenRent | Checkatrade |
|---------|-----------|-----------|--------|-------------|----------|-------------|
| Property search | Yes | Yes | Yes | Yes | Limited | No |
| Map search | Yes | Yes | Yes | Yes | No | No |
| AI recommendations | Yes | No | Limited | No | No | No |
| Semantic search | Yes | No | No | No | No | No |
| Service marketplace | Yes | No | No | No | No | Yes |
| Integrated payments | Yes | No | No | No | Yes | Yes |
| Transaction tracking | Yes | No | No | No | No | No |
| Landlord dashboard | Yes | No | Yes | No | Yes | No |
| Multi-role platform | Yes | No | No | No | No | No |
| Real-time messaging | Yes | No | Limited | No | Yes | Yes |
| Provider verification | Yes | No | No | No | No | Yes |
| Financial calculators | Yes | Yes | Yes | Yes | No | No |
| E-signatures | Yes | No | No | No | No | No |
| Admin panel | Yes | N/A | N/A | N/A | N/A | N/A |

## MVP Recommendation

**Phase 1 — Core Portal (Epics 1-3):**
Auth + property search + dashboards = usable property portal

**Phase 2 — Differentiation (Epics 4-6):**
Marketplace + messaging + AI = competitive advantage

**Phase 3 — Professional Tools (Epics 7-8):**
Landlord tools + financial tools = revenue-generating features

**Phase 4 — Polish (Epics 9-11):**
PWA + admin + compliance = production readiness

---
*Research completed: 2026-03-06*
