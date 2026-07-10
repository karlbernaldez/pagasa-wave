# WaveLab Mobile App — Public Charts Viewer

## Product boundary

The mobile app is a **read-only public forecast viewer**. It shows only published WaveLab chart packages and their public details.

### Included
- Latest published chart package
- Published chart gallery by forecast slot
- Date/history browsing
- Chart style switching: Wave & Wind, Wave Only, Accessible
- Full-screen chart viewing
- Published metadata and official guidance note
- Download/share actions when supported
- Light, dark, and system theme
- Offline display of the most recently opened chart package

### Explicitly excluded
- Forecaster Studio
- Forecast creation or editing
- Annotation tools
- Submission/revision workflows
- Admin dashboard
- User management
- Review, approval, and publishing controls
- Operational analytics

## Primary users and job

**Primary user:** members of the public, mariners, coastal communities, responders, and stakeholders who need quick access to official published wave charts.

**Core job:** “Show me the latest published wave forecast clearly, then let me inspect a chart or check a previous publication date without exposing internal workflow.”

## Design principles

1. **Latest information first.** The newest publication date and package status must be visible immediately.
2. **Map before metadata.** Users open the app to inspect forecast graphics, not administrative details.
3. **Public language only.** Avoid terms such as project, package review, owner, submitted, approved, or revision.
4. **One-handed navigation.** Primary destinations live in a three-item bottom navigation.
5. **Safety context stays visible.** Every chart detail includes the official supplementary-guidance note.
6. **Accessible by default.** Minimum 44×44 px touch targets, Dynamic Type-friendly layouts, strong contrast, and reduced-motion support.

## Information architecture

### Bottom navigation

1. **Latest** — newest published chart set and quick access to all forecast slots
2. **History** — previous publication dates grouped chronologically
3. **About** — chart legend, guidance note, data source, contact, and app information

Search is intentionally not a primary destination. For the expected ten-day public window, date browsing is faster and clearer than a permanent search field.

## Core flow

```text
Launch
  → Latest published package
      → Tap chart card
          → Full-screen chart detail
              → Change display style
              → Open legend/details
              → Share or download
      → Tap another forecast slot
  → History
      → Select publication date
          → Published package for that date
              → Chart detail
```

## Screen specifications

### 1. Latest

**Purpose:** provide immediate access to the newest public chart set.

**Hierarchy:**
- Compact top bar: WaveLab wordmark, theme control
- Publication header: “Latest wave charts”, date/time, freshness label
- Horizontal segmented control: Wave & Wind / Wave Only / Accessible
- Featured first chart with large map preview
- Remaining published forecast-slot cards in a two-column grid where width allows; single column on narrow devices
- Official guidance note

**Card content:**
- Forecast-slot badge
- Map preview
- Plain-language title
- Valid period/date
- Availability state

Do not show forecaster names unless PAGASA confirms that attribution is a public requirement.

### 2. Chart detail

**Purpose:** maximize map comprehension while preserving essential context.

**Hierarchy:**
- Back button, concise title, share action
- Full-width map canvas using most of the viewport
- Floating style switcher
- Expandable bottom sheet containing:
  - Valid period
  - Publication time
  - Legend
  - Accessibility description
  - Official guidance note
  - Download image/PDF action

**Gestures and controls:**
- Pinch to zoom and drag only when the map implementation supports accurate interaction
- Double tap to zoom
- “Reset view” control
- Never rely on hover

### 3. History

**Purpose:** browse previous public packages with minimal cognitive load.

**Hierarchy:**
- Title and short explanatory copy
- Month grouping
- Date rows showing:
  - Publication date
  - Number of available charts
  - Complete/incomplete public availability
  - Chevron to open

Use list rows rather than miniature map cards; history scanning is date-oriented, not image-oriented.

### 4. Selected historical package

Reuse the Latest screen pattern but replace “Latest wave charts” with the selected date and provide a “Return to latest” action.

### 5. About and legend

Include:
- What the wave charts show
- Legend and chart-style explanation
- Accessibility mode description
- Supplementary-guidance disclaimer
- Data/provider attribution
- Contact and emergency-information links
- App version and privacy statement

## Required states

### Loading
- Skeleton publication header
- Skeleton map cards matching final dimensions
- Preserve navigation; do not show a blocking spinner for the entire app

### Empty
**Title:** No published charts yet

**Body:** Published wave charts will appear here when they become available.

**Action:** Refresh

### Offline with cached content
**Banner:** You’re offline — showing the last chart set opened on {date}.

Disable download actions that require a network connection, but keep cached chart viewing available.

### Offline without cached content
**Title:** Connect to view published charts

**Body:** WaveLab needs an internet connection the first time you open a chart set.

### Partial publication
Show only published charts. Add a quiet note such as “3 of 4 charts are currently available.” Never render empty administrative slots as if the public must wait for workflow completion.

### Error
**Title:** Charts could not be loaded

**Body:** Check your connection and try again.

**Action:** Try again

## Navigation and content labels

Preferred public labels:
- Latest
- History
- About
- Published {date}
- Valid for {period}
- View chart
- Download PDF
- Share chart
- Reset view
- Chart legend
- Return to latest

Avoid:
- Project
- Package
- Owner
- Review status
- Approved
- Submitted
- Forecaster Studio
- Admin

## Visual direction

- Keep WaveLab’s blue/cyan marine identity, but reduce desktop glass effects on mobile to protect readability and battery performance.
- Use one elevated surface level for cards and one for overlays.
- Corner radius: 16–20 px for cards; 12–16 px for controls.
- Base spacing unit: 4 px; common gaps 8, 12, 16, 24, 32.
- Map previews should use a consistent 16:10 ratio.
- Use native system fonts for platform readability unless brand requirements mandate otherwise.

## Accessibility requirements

- Support text scaling without clipped card titles or inaccessible controls.
- Use text plus icons for chart styles; color alone is insufficient.
- Accessible mode must remain selectable independently of OS dark mode.
- Announce publication date and chart valid period to screen readers.
- Give map imagery a concise alternative description generated from available chart metadata.
- Respect reduced-motion settings; avoid decorative parallax and large liquid transitions.
- Ensure bottom sheets and dialogs trap focus and expose a clear close action.

## Analytics for validation

Track only public-product behavior:
- App opened to latest package
- Chart card opened
- Style changed
- History date opened
- Share/download invoked
- Cached chart opened offline
- Load/error rate

Do not include forecaster or admin analytics in the mobile app.

## MVP recommendation

Ship these five surfaces first:
1. Latest
2. Chart detail
3. History
4. Selected historical package
5. About/legend

Defer push notifications, favorites, location-based recommendations, and advanced map overlays until public usage confirms a real need.

## Engineering handoff notes

- Reuse the existing public published-chart APIs rather than authenticated project endpoints.
- Preserve the current public chart-style modes and public map bounds behavior.
- Define one mobile view model that strips all internal workflow and staff-only fields before rendering.
- Cache the latest successfully opened package and its chart assets with a clear cache timestamp.
- Deep links should follow a public pattern such as `wavelab://charts/{publishedChartId}` and map to the existing public web route `/charts/:projectId`.
- The mobile client must never contain forecaster/admin navigation routes, feature flags, or privileged API credentials.

## Wireframe source

See [`public-dashboard-mobile-wireframes.svg`](./public-dashboard-mobile-wireframes.svg) for the low-fidelity screen set.