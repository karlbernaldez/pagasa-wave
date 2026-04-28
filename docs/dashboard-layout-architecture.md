# WaveLab Dashboard Layout Architecture

## Purpose

This document defines the target layout structure for WaveLab authenticated and public areas. It supports the dashboard restructuring work tracked in `[LAYOUT-01] Define authenticated layout architecture`.

The goal is to make WaveLab feel like one coherent PAGASA forecasting platform while preserving the immersive Studio map workspace.

## Product Areas

WaveLab is organized into five product areas:

1. Public / Guest
2. Auth
3. Forecaster Dashboard
4. Studio Workspace
5. Admin Dashboard

Each area should own its own layout shell instead of relying on route-specific exceptions inside `RootLayout`.

---

## Layout Model

```txt
RootLayout
├── PublicLayout
├── AuthLayout
├── ForecasterShell
├── StudioShell
└── AdminShell
```

### RootLayout

`RootLayout` should be minimal. It should not decide every route-specific header, footer, padding, chatbot, or scroll behavior.

Responsibilities:

- Render the active route outlet.
- Keep only global wrappers that truly apply to the whole app.
- Avoid accumulating route-specific exceptions.

Non-responsibilities:

- Public header/footer decisions.
- Auth page branding decisions.
- Forecaster sidebar layout.
- Studio full-screen behavior.
- Admin dashboard layout.

---

## PublicLayout

### Audience

- Public visitors
- Guests
- Stakeholders viewing approved public information

### Purpose

Public pages are for general access and approved public content.

### Current / short-term routes

```txt
/
/charts
/about-us
/contact
```

### Responsibilities

- Public header
- Public footer
- Public page spacing
- Public-facing content shell
- Public charts that are approved for guest viewing

### Notes

Public charts should remain publicly available. If authenticated chart-management functionality is added later, it should live under the Forecaster Dashboard or Admin Dashboard, not replace the public charts route without a migration plan.

---

## AuthLayout

### Audience

- Guests signing in
- Guests registering
- Users verifying email

### Routes

```txt
/login
/register
/verify-email
```

### Responsibilities

- Auth-specific branding
- Auth background and card layout
- No public header/footer
- No dashboard sidebar

### Design Direction

The current auth visual direction is the baseline for the broader dashboard refresh:

```txt
Official PAGASA
Calm
Scientific
Forecasting operations focused
Blue / navy / cyan system
Professional, not generic SaaS
```

---

## ForecasterShell

### Audience

- Authenticated forecaster users
- Current implementation may still use `role === "user"` temporarily

### Purpose

Forecaster pages should feel like one authenticated workspace, not separate standalone pages.

### Short-term routes

```txt
/studio              Project Library, for now
/profile
/edit-profile
/pdf
```

### Target routes, later

```txt
/forecaster
/forecaster/projects
/forecaster/models
/forecaster/charts
/forecaster/published
/forecaster/exports
/forecaster/profile
/forecaster/settings
/forecaster/support
```

### Responsibilities

- Forecaster sidebar
- Forecaster header / topbar
- Authenticated workspace background
- Main content area using route outlet
- Responsive sidebar behavior
- Route-aware active states

### Forecaster Navigation

Recommended grouping:

```txt
Workspace
- Overview
- Project Library
- Models
- Charts

Forecast Outputs
- Published Forecasts
- PDF / Exports

Account
- Profile
- Settings

Support
- Help / Support
```

### Important Decision

Do not rename `/studio` during the first restructuring pass.

Short term:

```txt
/studio = Project Library
/studio/:projectId = Studio Workspace
```

Long term:

```txt
/forecaster/projects = Project Library
/studio/:projectId = Studio Workspace
```

Reason: keeping current routes reduces regression risk while the layout architecture changes.

---

## StudioShell

### Audience

- Forecasters actively editing, drawing, analyzing, or exporting a project

### Route

```txt
/studio/:projectId
```

### Purpose

The Studio is the immersive map workspace. It should remain map-first.

### Responsibilities

- Full viewport workspace
- No public header/footer
- No normal dashboard padding
- No unnecessary body scroll
- Optional collapsed rail or expandable drawer
- Back to Project Library action
- Minimal navigation only

### Sidebar Decision

Use a collapsed icon rail or expandable drawer by default.

Do not use a full persistent sidebar inside `/studio/:projectId`.

Reason: the Studio map, LayerPanel, DrawToolBar, MapStatusBar, and drawing canvas need space. A full sidebar would reduce the quality of the core forecasting workflow.

### Chatbot Decision

Do not show the chatbot inside Studio for now.

---

## AdminShell

### Audience

- Admin users

### Current route

```txt
/dashboard
```

### Target route, later

```txt
/admin
```

### Purpose

Admin is for review, publishing, user/system management, and operational oversight.

### Responsibilities

- Admin sidebar
- Admin header
- Admin content area
- Admin route protection
- Admin mobile/collapsed sidebar behavior

### Admin Navigation

Recommended grouping:

```txt
Review
- Overview
- Review Queue
- Submitted Projects

Forecast Outputs
- Published Forecasts

Management
- Users
- Notifications

System
- Analytics
- Calendar
- Settings
```

### Routing Decision

Keep `/dashboard` short-term.

Move to `/admin` later. Admin sections should become nested routes later, not during the first restructuring pass.

Temporary:

```txt
/dashboard?tab=users
/dashboard?tab=charts
```

Target:

```txt
/admin/users
/admin/charts
/admin/settings
```

---

## Short-Term Route Map

Use this during the first restructuring phase.

```txt
PublicLayout
/
/charts
/about-us
/contact

AuthLayout
/login
/register
/verify-email

ForecasterShell
/studio
/profile
/edit-profile
/pdf

StudioShell
/studio/:projectId

AdminShell
/dashboard
```

---

## Long-Term Route Map

Add these aliases only after the shell work is stable.

```txt
ForecasterShell
/forecaster
/forecaster/projects
/forecaster/models
/forecaster/charts
/forecaster/published
/forecaster/exports
/forecaster/profile
/forecaster/settings
/forecaster/support

AdminShell
/admin
/admin/review
/admin/users
/admin/published
/admin/notifications
/admin/analytics
/admin/calendar
/admin/settings
```

Later redirects can be added after migration is stable:

```txt
/dashboard → /admin
/studio → /forecaster/projects
/pdf → /forecaster/exports
/profile → /forecaster/profile
```

Do not add these redirects during the initial shell migration unless all affected routes are fully tested.

---

## Migration Order

1. Define layout architecture.
2. Create `ForecasterShell`.
3. Create `StudioShell`.
4. Move Project Library into `ForecasterShell`.
5. Split `StudioBase` into `ProjectLibraryPage` and feature components.
6. Fix Project Library sorting before pagination.
7. Normalize admin shell ownership.
8. Add `/forecaster` and `/admin` aliases later.

---

## Out of Scope for Initial Restructure

The first restructuring pass should not include:

- Full Studio panel redesign
- Full Admin visual redesign
- Backend API changes
- Permission model rewrite
- Public page redesign
- Full route renaming
- Removing old routes
- Admin nested route migration
- Chatbot integration inside Studio

---

## Regression Checklist

Before merging layout restructuring work, verify:

```txt
Login works.
Register works.
Guest users redirect correctly.
Forecaster users can access /studio.
Forecaster users can open /studio/:projectId.
Admin users can access /dashboard.
Non-admin users cannot access admin-only routes.
Project Library loads.
Create project works.
Open project works.
Rename project works.
Delete project works.
Share project works.
Search projects works.
Filter projects works.
Sort projects works.
Pagination works.
Studio map loads.
Layer panel still works.
Drawing tools still work.
Theme switching does not break the map.
No public header/footer appears inside dashboard shells.
No full sidebar appears inside /studio/:projectId.
```

---

## Product Decisions

1. Public users can view approved public charts.
2. Forecaster and admin experiences should remain separate.
3. Forecaster should have its own dashboard shell/sidebar.
4. Studio should use a collapsed rail or drawer, not a full sidebar.
5. Chatbot should not appear inside Studio for now.
6. Admin should eventually move from `/dashboard` to `/admin`.
7. Admin sections should become nested routes later.
8. Visual direction is official PAGASA plus forecasting operations.
9. Forecaster and admin should share the same base design language but use different navigation and content.
10. Existing routes should remain stable during the first restructuring pass.
