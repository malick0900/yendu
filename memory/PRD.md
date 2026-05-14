# Teranga Stay — PRD (MVP v1)

## Vision
"La plateforme africaine qui permet de vivre une destination, pas seulement d'y dormir."  
Plateforme premium de réservation d'hébergements et d'expériences locales au Sénégal — éditée par un admin unique (pas de marketplace ouverte).

## Stack
- Frontend: React (CRA) + TailwindCSS + shadcn/ui + framer-motion + leaflet/react-leaflet + recharts
- Backend: FastAPI + Motor (Mongo async) + bcrypt + JWT (python-jose)
- DB: MongoDB
- Auth: Email/Mot de passe (JWT Bearer) + Google OAuth via Emergent Managed Auth (cookie session_token)
- Cartes: Leaflet + OpenStreetMap (gratuit)
- Paiement: simulé (admin confirme manuellement, marque payé)
- Langue: Français (FCFA / XOF)
- Design: identité africaine moderne (sable, terracotta, vert profond, doré, blanc) — voir `/app/design_guidelines.md`

## Rôles
- `TRAVELER` — par défaut à l'inscription
- `ADMIN` — seul autorisé à publier hébergements / expériences / destinations

## Comptes de test
- Admin: `admin@terangastay.sn` / `Admin123!`
- Voyageur: `traveler@example.com` / `Traveler123!`

## Données démo seedées
- 4 destinations: Dakar, Saly, Casamance, Saint-Louis
- ~10 hébergements (villas, appartements, riads, guesthouses) — prix XOF
- ~12 expériences (culture, gastronomie, aventure, nightlife, lifestyle)
- Images Unsplash

## Modules MVP — État

### Public
- [x] Homepage avec hero immersif + search bar pill flottant
- [x] Destinations vedettes (bento grid)
- [x] Hébergements premium (grid)
- [x] Expériences tendances (catégories + grid)
- [x] Section éditoriale "Teranga" + témoignages + footer
- [x] /stays — liste avec filtres (destination, type, prix, voyageurs, équipements, tri) + carte Leaflet
- [x] /stays/:id — galerie, équipements, carte, formulaire de réservation, avis
- [x] /experiences — tabs catégorie + filtres
- [x] /experiences/:id — galerie, infos guide, réservation
- [x] /destinations/:slug — hero + contenu de la destination
- [x] /about, /contact, /faq

### Auth
- [x] /login (email + Google OAuth)
- [x] /register
- [x] /auth/callback (Emergent Managed)
- [x] Logout

### Dashboard Voyageur
- [x] Mes réservations (stays + experiences) avec statuts
- [x] Favoris (toggle cœur partout)
- [x] Profil (édition nom/téléphone/avatar)
- [x] Laisser un avis sur réservation confirmée

### Dashboard Admin (/admin/*)
- [x] Vue d'ensemble (KPIs + charts recharts)
- [x] CRUD Hébergements (publish/unpublish, images via URL, équipements)
- [x] CRUD Expériences (catégories, guide, inclus)
- [x] Réservations: filtre statut, confirmer / annuler / marquer payé
- [x] Utilisateurs: liste + changement de rôle
- [x] Avis: modération (afficher/masquer)

## API Backend — `/api/*`
- `auth/`: register, login, me (GET/PATCH), google/session, logout
- `destinations/`: list, get by slug, admin CRUD
- `properties/`: list (filtres+tri), get, admin CRUD
- `experiences/`: list (filtres+tri+catégorie), get, admin CRUD
- `bookings/`: create, my, admin list, admin patch (status/payment)
- `reviews/`: list, create, admin list+moderate
- `favorites/`: my (hydrated), add, remove
- `admin/stats`: revenue, charts, top destinations

## Tests (testing_agent_v3 — iteration 1)
- Backend: 45/45 tests pass ✅
- Frontend: login (admin+traveler), dashboard, admin panel, navigation OK ✅
- 1 bug fix automatique appliqué: ObjectId serialization sur POSTs (testing agent a ajouté `doc.pop("_id", None)` après insert_one)

## Notes techniques importantes
- `MongoDB ObjectId`: tous les `find` utilisent `{"_id": 0}` ; tous les inserts font `doc.pop("_id", None)` avant retour.
- `JWT`: stocké côté front dans `localStorage.ts_token`, envoyé via interceptor axios en Bearer.
- `session_token cookie`: utilisé pour Google OAuth (httpOnly, secure, samesite=none).
- `/api/auth/me` accepte cookie OU Bearer.
- `CORS`: `allow_origin_regex=".*"` + `allow_credentials=True`.

## Roadmap (suivant)
- Pagination + tri avancé
- Carte cluster sur /stays
- Wishlist partageable
- Multi-langue (FR/EN)
- Stripe ou Wave/Orange Money (post-MVP)

---

## Phase 3 — Admin enhancements + CMS (livrée)

### Nouveautés backend
- **Object storage** (Emergent managed) : `POST /api/admin/upload` (multipart, jpg/png/webp/gif, max 10MB) → `GET /api/files/{id}` sert le binaire avec cache 24h
- **Site Content CMS** : collection `site_content` → `GET /api/site/content` (public) et `PATCH /api/admin/site/content` (admin)
- **Destinations CRUD** : POST / PATCH (partiel) / DELETE — admin only
- **Advanced KPIs** sur `/api/admin/stats` : `occupancy_rate`, `avg_stay`, `pending_revenue`, `top_properties[]`, `top_experiences[]`, `property_bookings`, `experience_bookings`
- **CSV exports** : `/api/admin/export/bookings.csv` et `/api/admin/export/users.csv`
- **Admin logs** : collection `admin_logs` + helper `_log_admin` invoqué sur chaque mutation admin → `GET /api/admin/logs`
- **Availability blocking** : `POST/GET /api/admin/properties/:id/availability`, `DELETE /api/admin/availability/:id`, `GET /api/properties/:id/availability` (public, merge avec bookings actifs)
- **Notifications** : collection `notifications` + helper `enqueue_notification` (envoie via SMTP si configuré, sinon log-only), déclenché sur création de booking et changements de statut/paiement → `GET /api/admin/notifications` et `/status`

### Nouveautés frontend
- **`ImageUpload`** : composant drag-drop + URL pour single/multiple, avec preview, `resolveImage()` helper pour servir les URLs `/api/files/...`
- **`SiteContentContext`** : provider qui charge `/api/site/content` au boot et expose `reload()` après save
- **Pages publiques refondues** : HomePage, AboutPage, ContactPage, FaqPage, Footer lisent **toutes** depuis le contexte CMS — l'admin contrôle 100% du texte/images du site
- **Nouveau `AdminPage`** avec 10 sections : Vue d'ensemble (8 KPIs + 4 charts + tops), Contenu du site (6 onglets), Destinations (CRUD), Hébergements, Expériences, Réservations (export CSV), Utilisateurs (export CSV), Avis, Notifications, Journal admin
- **PropertyForm / ExperienceForm** : remplacent l'input URL par `ImageUpload` (multiple)
- **AvailabilityDialog** : calendrier range pour bloquer des dates par hébergement, liste des blocs existants

### Tests Phase 3 (testing_agent_v3 iteration 2)
- **Backend** : 22/23 tests pass (95.7%) — 1 minor fix appliqué (DestinationUpdate model pour PATCH partiel)
- **Frontend** : tous les flows admin validés (CMS, upload, exports, calendrier, logs, notifications)

### Credentials de configuration optionnels (pour activer SMTP réel)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
MAIL_FROM="Teranga Stay <no-reply@terangastay.sn>"
```
Sans config SMTP : les notifications sont toujours stockées en DB (status=`log-only`) et visibles dans `/admin/notifications`.
