# Zero-Hallucination Link Graph & Anchor Scheme Audit — `3gen-pressure-washing`

- **Scanned Root**: `/home/francis/antigravity-workspace/3gen-pressure-washing`
- **Execution Time**: `5ms` (100% Deterministic AST + BFS Graph Math)
- **Total Routes**: `4` | **Internal Link Edges**: `3`
- **Max Click Depth from `/`**: `1` clicks (Rule 3d limit: `<= 3`)
- **Link Health Score**: **`0/100`** (`FAIL_BROKEN_LINKS`)
- **Findings**: `9` P0 Broken/Critical | `1` P1 High | `1` P2 Scheme/Rotation

## 1. Route Topology & Click Depth Table

| Route | Source File | Click Depth | Contextual In | Contextual Out | Nav/Footer |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `/` | `src/pages/index.astro` | 0 | 3 | 0 | Yes |
| `/404` | `src/pages/404.astro` | ORPHAN | 0 | 1 | No |
| `/review` | `src/pages/review.astro` | 1 | 0 | 1 | Yes |
| `/services` | `src/pages/services/index.astro` | 1 | 0 | 0 | Yes |

## 2. Verified Findings & Deterministic Fix Recommendations

| Sev | Code | File:Line | Issue | Recommended Target | Suggested Rotating Anchor(s) |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **P0** | `BROKEN_INTERNAL_LINK` | `src/components/EquipmentTrust.astro:44` | Broken internal link in shared component src/components/EquipmentTrust.astro:44 -> '/equipment/' resolves to 404 | `/review` | `"review details"`, `"explore our review"` |
| **P0** | `BROKEN_INTERNAL_LINK` | `src/components/Footer.astro:55` | Broken internal link in shared component src/components/Footer.astro:55 -> '/about/' resolves to 404 | `/` | `"24/7 Boise towing dispatch"`, `"local Treasure Valley towing service"` |
| **P0** | `BROKEN_INTERNAL_LINK` | `src/components/Footer.astro:56` | Broken internal link in shared component src/components/Footer.astro:56 -> '/equipment/' resolves to 404 | `/review` | `"review details"`, `"explore our review"` |
| **P0** | `BROKEN_INTERNAL_LINK` | `src/components/Footer.astro:57` | Broken internal link in shared component src/components/Footer.astro:57 -> '/contact/' resolves to 404 | `/` | `"24/7 Boise towing dispatch"`, `"local Treasure Valley towing service"` |
| **P0** | `BROKEN_INTERNAL_LINK` | `src/components/Footer.astro:59` | Broken internal link in shared component src/components/Footer.astro:59 -> '/service-areas/' resolves to 404 | `/services` | `"services details"`, `"explore our services"` |
| **P0** | `BROKEN_INTERNAL_LINK` | `src/components/Footer.astro:74` | Broken internal link in shared component src/components/Footer.astro:74 -> '/privacy/' resolves to 404 | `/review` | `"review details"`, `"explore our review"` |
| **P0** | `BROKEN_INTERNAL_LINK` | `src/components/Footer.astro:75` | Broken internal link in shared component src/components/Footer.astro:75 -> '/terms/' resolves to 404 | `/` | `"24/7 Boise towing dispatch"`, `"local Treasure Valley towing service"` |
| **P0** | `BROKEN_INTERNAL_LINK` | `src/components/Footer.astro:76` | Broken internal link in shared component src/components/Footer.astro:76 -> '/accessibility/' resolves to 404 | `/review` | `"review details"`, `"explore our review"` |
| **P0** | `BROKEN_INTERNAL_LINK` | `src/components/QuoteForm.astro:95` | Broken internal link in shared component src/components/QuoteForm.astro:95 -> '/privacy/' resolves to 404 | `/review` | `"review details"`, `"explore our review"` |
| **P1** | `DEAD_PSEUDO_LINK` | `src/pages/review.astro:88` | Dead pseudo-link href="#" on /review | `/contact` | `"contact details"`, `"explore our contact"` |
| **P2** | `UNDER_LINKED_PAGE` | `src/pages/services/index.astro:1` | Page /services has only 0 contextual outbound internal link(s) in its body (Rule 3b requires 2-3 contextual links) | `/` | `"24/7 Boise towing dispatch"`, `"local Treasure Valley towing service"` |
