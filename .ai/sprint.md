# Sprint Tasks — 3Gen Pressure Washing
> **Source of Truth:** Gnomie PostgreSQL database (`work_items` table)
> **Last Synchronized:** 6/15/2026, 3:30:36 PM

- `[x]` **3GP-003**: The Hidden Cost of DIY Pressure Washing: How You're Destroying Your Siding
  - **Category:** content
  - **Priority:** medium
  - **Why:** Based on Reddit pain points: Homeowners frequently complain about permanently etching their driveways ('tiger stripes') and blowing water under their vinyl siding causing hidden mold, directly resulting from DIY pressure washer rentals.
  - **Goal:** Provide a fear-first educational piece on pressure washing damage to convert DIYers into paying leads.
  - **How:** Structure the article focusing on the hidden costs of DIY pressure washing: 1) The 'tiger stripe' phenomenon caused by wrong nozzle distance, 2) Water injection into siding causing invisible mold rot behind the panels, and 3) Stripped protective sealants on concrete that lead to winter spalling. Conclude with why professional soft-washing is the only risk-free method.

- `[x]` **3GP-004**: Astro Static GraphQL Build Integration
  - **Category:** build
  - **Priority:** high
  - **Why:** To replace manual static JSON file building with automated real-time database-driven pages.
  - **Goal:** Modify Astro's build engine to execute GraphQL queries targeting Twenty CRM to dynamically generate localized pages and map internal linking structures.
  - **How:** 1. Create GraphQL data client inside Astro codebase (src/utils/twenty.ts). 2. Bind queries to getStaticPaths() loops reading Twenty CRM objects. 3. Configure build fallback caching mechanisms.

- `[x]` **3GP-002**: Full Site Migration - 3genpressurewashing.com
  - **Category:** build
  - **Priority:** high
  - **Why:** Paying client ($200/mo) needs full site migration.
  - **Goal:** Complete site migration with rank protection and baseline data
  - **How:** Run /import-site workflow. Run Deep Research for local pressure washing pain points. Migrate full pipeline.

- `[ ]` **3GP-001**: 3Gen Status Decision - Active or Dormant Client?
  - **Category:** decision
  - **Priority:** high
  - **Why:** Paying client with ZERO tracked work items across sprint, backlog, blocked, and done. Either work is happening off-ledger or the project is dormant.
  - **Goal:** 3Gen has either active tracked work or a documented dormancy decision
  - **How:** Contact client. Determine active status. If active, create work items. If dormant, document in strategy.md and remove from active monitoring.

