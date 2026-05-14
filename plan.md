# Plan — TERANGA STAY (MVP)

## 1) Objectives
- Livrer un MVP **premium, mobile-first** (FR) pour réserver **hébergements** et **expériences** au Sénégal.
- Mettre en place un **back-office Admin** (seul éditeur de contenu) + **dashboard Traveler**.
- Réservation avec **paiement simulé/manuel** (workflow admin: confirmer/annuler/marquer payé).
- Cartes **Leaflet + OpenStreetMap**, recherche + filtres, seed réaliste (Unsplash).
- Auth **Email/JWT + Google OAuth (Emergent Managed Auth)**.

## 2) Implementation Steps

### Phase 1 — POC (Core isolation)
> Core à risque: **Google OAuth via Emergent Managed Auth** + session → création/liaison user → JWT/app session.
1. Websearch rapide: “Emergent managed auth google react fastapi session best practices”.
2. Backend: endpoint minimal `/api/auth/google/session` (validate session payload, upsert user, issue JWT).
3. Frontend: page POC `/auth/google` (button → obtain managed session → call backend → store JWT).
4. Test manuel: login Google, refresh, logout, re-login, user persisted in Mongo.
5. Fix until works (redirects, CORS, cookie/localStorage, expiry).

**User stories (Phase 1)**
1. As a user, I can sign in with Google and land authenticated on the app.
2. As a user, I stay logged in after a refresh.
3. As a user, I can log out and the app returns to guest state.
4. As the system, I create a user record on first Google login.
5. As the system, I reject invalid/expired sessions cleanly.

---

### Phase 2 — V1 App Development (MVP end-to-end)
1. **Backend foundations**
   - Project structure, settings, CORS, Mongo connection, indexes.
   - Models/schemas: users, destinations, properties, experiences, bookings, reviews, favorites.
   - Public APIs: list/detail + filtering/sorting; reviews read.
   - Booking APIs: create booking (pending), user bookings.
   - Seed script: Dakar/Saly/Casamance/Saint-Louis + ~12 stays + ~12 experiences + admin user.
2. **Frontend foundations**
   - Tailwind + shadcn/ui theme: sable/terracotta/vert profond/blanc + accent doré; UI photo-led.
   - Layout: top nav + search pill; responsive grids; cards with rounded corners.
   - Routes: `/`, `/stays`, `/stays/:id`, `/experiences`, `/experiences/:id`, `/destinations/:slug`.
   - Leaflet map on listings (stays) with markers synced to cards.
3. **Core traveler flows (sans features avancées)**
   - Search (destination + dates + guests) → results.
   - Filters stays: price range, type, amenities, guests; sort by price/rating.
   - Stay detail: gallery, amenities, map, reviews, booking card.
   - Experiences list/detail with category tabs + booking.
4. **Reviews + Favorites (traveler)**
   - Favorites toggle (requires auth), list in dashboard.
   - Reviews: post review only for completed booking (simple rule for MVP).
5. **Testing round #1 (V1)**
   - Run testing_agent_v3 for public browsing, search, map, booking create, dashboards basic.

**User stories (Phase 2)**
1. As a traveler, I can browse the homepage and discover featured destinations, stays, experiences.
2. As a traveler, I can filter stays by price/type/amenities and see results update.
3. As a traveler, I can view a stay detail (photos, amenities, map, reviews).
4. As a traveler, I can create a stay booking (pending) with dates and guests.
5. As a traveler, I can browse experiences by category and book an experience.

---

### Phase 3 — Add More Features (Dashboards + Admin operations)
1. **Auth completion (email/JWT + Google)**
   - Register/login/reset (basic), JWT refresh strategy (simple).
   - Route guards (Traveler/Admin).
2. **Traveler dashboard `/dashboard`**
   - Profile edit.
   - My bookings (stays + experiences), statuses.
   - Favorites list; review submission UI.
3. **Admin dashboard `/admin`**
   - CRUD destinations/properties/experiences (publish/unpublish).
   - Bookings management: confirm/annul + mark paid.
   - Users list + role management; reviews moderation.
   - Stats endpoint + KPIs page.
4. **Content/admin UX**
   - Image handling MVP: store image URLs (Unsplash/demo); validation.
   - Slug handling for destinations.
5. **Testing round #2**
   - testing_agent_v3: admin CRUD, publish flows, booking confirmation, traveler sees updated states.

**User stories (Phase 3)**
1. As a traveler, I can log in (email or Google) and see my personal dashboard.
2. As a traveler, I can favorite a stay/experience and later find it in Favorites.
3. As an admin, I can create and publish a new stay with images and location.
4. As an admin, I can confirm a pending booking and mark it as paid.
5. As an admin, I can unpublish content and it disappears from public lists.

---

### Phase 4 — Hardening + Polish (production-ready MVP)
1. Validation & error states: consistent API errors, form errors, empty/loading states.
2. Performance: pagination, query indexes, image lazy-loading, debounced filters.
3. Security: password hashing, role checks, rate limiting basics, sanitize inputs.
4. UI polish: consistent typography/spacing, skeleton loaders, toasts.
5. Final testing round #3: full regression with testing_agent_v3.

**User stories (Phase 4)**
1. As a user, I always understand why an action failed (clear message + next step).
2. As a traveler, I can paginate results smoothly without losing filters.
3. As an admin, I can safely manage content without accidental deletes (confirm dialogs).
4. As a traveler, I can complete the booking flow on mobile comfortably.
5. As a traveler, I can see consistent status labels (pending/confirmed/cancelled/completed).

## 3) Next Actions
1. Implement Phase 1 POC for Google OAuth managed session → JWT.
2. Add Mongo models + seed data for destinations/stays/experiences.
3. Build V1 public pages + booking creation.
4. Run testing_agent_v3 and fix blockers.

## 4) Success Criteria
- Google OAuth POC works reliably (login/refresh/logout) and user is persisted.
- Public app supports: browse, search, filters, map, detail pages, create booking (pending).
- Admin can CRUD + publish content and manage bookings/payment status.
- Traveler dashboard shows bookings + favorites + review ability.
- All critical user stories pass via end-to-end testing (no broken navigation, no 500s, responsive UI).