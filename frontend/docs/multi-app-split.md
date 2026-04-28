# Multi-App Split Guide (Phase 8)

## Goal
Prepare the repo for splitting into independent apps without rewriting logic.

## Target Architecture

```
apps/
  forecaster-app/
  admin-app/
  public-app/

packages/
  ui/
  utils/

frontend/
  (current monolith - transitional)
```

---

## Step 1: Extract Shared Code

Move into `packages/`:

- components/ui
- utils
- api layer

---

## Step 2: Create Forecaster App

Copy:

- dashboards/forecaster
- forecasterRoutes

New entry:

```
apps/forecaster-app/main.jsx
```

Mount only:

```
<ForecasterRouteLayout />
```

---

## Step 3: Routing Isolation

Each app owns:

- its router
- its layout
- its routes

No cross-dashboard imports allowed.

---

## Step 4: Deployment

Option A:
- same domain (reverse proxy)

Option B:
- subdomains
  - forecaster.app.com
  - admin.app.com

---

## Step 5: Gradual Migration Strategy

1. Keep monolith running
2. Extract forecaster first
3. Point /studio → new app
4. Repeat for admin

---

## Rule of Thumb

Split ONLY when:

- teams diverge
- deployment needs differ
- performance isolation required

Otherwise: stay modular monolith.

---

## Final Note

You are now fully migration-ready.
