# Surf Report Builder — UX-First Roadmap

**Generated:** April 26, 2026
**Last updated:** April 28, 2026
**As of:** Closeout 8 + post-Closeout-8 section-by-section homepage rewrite

This roadmap is ordered by user experience impact, not engineering ambition. The principle: every step should be visible to a friend the next time they use the system, or it shouldn't be the next step.

## Recently shipped

### ✓ Worker Phase 3 — METAR + forecast-wind support (Closeout 8 era)

The biggest remaining structural gap is closed. Worker now serves four data classes: NDBC buoys (Phase 1), CO-OPS tide (Phase 2), and as of Phase 3, METAR observed-wind (`/v1/station/icao/<id>`) and forecast wind (`/v1/forecast/wind?lat=&lon=&time=`). Builder Prompt v1.2 ships the new RULE 2 entries for both endpoints. All four primary source types now route through one domain, collapsing the user-facing reliability story to "is the Worker reachable?"

### ✓ Homepage section-by-section rewrite (April 28)

Full copy refresh across 9 sections — hero, hero card, How it works, What you'll get, Get the Builder, Where the data comes from, FAQ, Feedback, Footer. Major changes:

- Manual → Design Notes (terminology shift across page, footer link, FAQ, meta tags)
- New Card 5 in Data sources naming what's NOT used (commercial ratings, predicted faces, "go" calls)
- New About blurb in footer + GitHub source link + "Made in Southern California" maker credit
- FAQ expanded to 11 questions, including new ones answering the most common cold-visitor concerns ("Is this actually free?", "How is this different from just asking ChatGPT?", "What if it gets a report wrong?")
- Feedback form reworked: dropdown for feedback type, "Your break" optional field, button label "Send it"
- Builder Prompt header rename: `# Builder Prompt v1.2` → `# Surf Report Builder v1.2 — surfreportbuilder.com`

## Tier 1 — Ship before broader friend rollout

### 1. Parallel-runtime sanity test

**Why first:** the homepage's "Which AI should I use?" FAQ currently says "tested most thoroughly on Claude" — honest but vague. A focused round of testing in alternate runtimes (Perplexity Computer, paid ChatGPT with browsing, Gemini, etc.) would let us sharpen that answer with verified knockouts and verified-working alternates.

**Scope:**
- Run v1.2 Builder + a Session Report Prompt for El Porto in 1-3 alternative runtimes
- For each: does the Worker URL fetch, do CO-OPS / METAR / forecast-wind endpoints fetch, does the AI fabricate vs degrade gracefully when sources fail, does any cache layer return stale data
- Update FAQ Q3 with verified findings

**Effort:** ~30 minutes per runtime tested.

### 2. System Guide / Design Notes PDF regen from v1.2 source — **soon**

The PDF is now the only major artifact still using "Manual" / "System Guide" naming and v1.0-era content. The site links to `ai_surf_report_builder_system_guide_v1_0.pdf` with link text saying "Design Notes" — temporary inconsistency until regen.

**Scope:**
- Generate fresh Design Notes from v1.2 prompt source
- Incorporate Worker Phase 2 (CO-OPS) and Phase 3 (METAR + forecast-wind) architecture explanations
- Update Tier 1 / Tier 2 report format documentation per v0.9 two-tier architecture
- Rename file to `surf_report_builder_design_notes_v1_0.pdf` (or similar) — update homepage link in two places once renamed
- Update PDF cover, headers, internal references from "Manual" / "System Guide" → "Design Notes"

**Dependencies:** none. Skip flagged this for "soon" but a separate thread.

**Effort:** medium thread. ~1-2 hours.

### 3. Out-of-thread housekeeping

Five-minute fixes still pending across multiple closeouts:

- **PZZ650 → PZZ655** in El Porto's `00_local_model.md`. Closeout 5 finding. One-line edit.
- **Shared secret rotation** in `script-b/Code.gs`. Replace `El_Porto_Surf_Report_Key_April_26_2026` with a fresh random string before any meaningful friend distribution.
- **Delete `ai_surf_report_builder_system_guide_v0_3.pdf`** from the repo if not already done.

**Effort:** ~5 minutes total, no thread needed.

## Tier 2 — Reliability before more features

### 4. Worker DNS-cache hiccup triage

**Why second tier:** the five-minute-retry mitigation works, but the underlying issue (BuoyPro upstream returns 503 "DNS cache overflow" intermittently for some NDBC IDs) means every friend running a report has a real chance of hitting it.

**Scope:**
- Diagnose whether it's per-hostname Cloudflare DNS cache limits, BuoyPro fetcher User-Agent issues, or something else
- Likely fixes: explicit DNS resolution control in the fetcher, connection pooling tweaks, or a fallback that triggers on 503 specifically
- Possibly add `X-Cache: HIT|MISS` response header for observability while in there

**Effort:** Worker thread, focused. 30 minutes to 2-3 hours depending on diagnosis.

### 5. v1.2.1 Builder Prompt cleanup

**Scope (carried from earlier closeouts):**
- Long Range Report Prompt's run-step language re-introduces "0-3 days" buoy-data-layer reference even though spec correctly excludes the 0-3 day time horizon. Disambiguate "Layer 1 buoy-data confirmation" from "0-3 day time horizon."
- OPC chart GIF limitation should be pre-disclosed in Long Range Report Prompt's run steps.
- Optionally fold in: Tier 2 `data_quality` field, Validation Layer column schema review, local model CO-OPS ID capture verification.

**Effort:** small thread. ~30-45 minutes.

### 6. Cached-data-disclosure rule (NEW — added April 28)

**Why this exists:** during the FAQ Q3 discussion, we surfaced that the prompt has no rule requiring the AI to disclose whether it's pulling fresh data from the Worker vs cached/stale data the AI's own retrieval might be serving. This is the structural Perplexity-pattern issue from early closeouts — the AI often can't detect when its own web-fetcher is returning a cached page that *appears* fresh.

**Scope:**
- Extend RULE 3 (or add RULE 7) requiring the AI to disclose if it's relying on web-search results that may be cached or stale
- Define how the AI should handle uncertainty about its own retrieval freshness
- Acknowledge the limit honestly: this is a discipline rule, not a structural fix; the AI often can't detect its own retrieval is cached
- Doesn't fully solve the cached-page problem, but sets a discipline that helps when the AI CAN detect staleness

**Why second-tier:** this matters most when daughter prompts consult sources outside the Worker (Builder-time research; Long Range Report storm charts; any non-Worker source). For the four data classes the Worker now serves, this rule is mostly redundant — Worker responses are clean JSON with no cached-page failure mode.

**Effort:** small thread, ~30 minutes. Could be folded into v1.2.1 cleanup.

## Tier 3 — Capability expansion

### 7. Worker Phase 4 — Custom domain (`api.surfreportbuilder.com`)

**Why now-ish:** polish, not capability. Updates one URL each in RULES 2 and 5. No user-facing change beyond cleaner internals.

**Scope:**
- DNS records for `api.surfreportbuilder.com` (CNAME or A records into Cloudflare Workers)
- Wrangler config update to register the custom domain
- Builder Prompt URL updates in RULE 2 and RULE 5
- Optional 301 redirect from `surf-report-worker.fischbein.workers.dev` for backwards compat (older daughter prompts still in circulation)

**Effort:** ~45 minutes.

### 8. Diagram of the chain (NEW — added April 28)

**Why now:** the recursive structure of the system (one prompt builds prompts that build reports) is exactly the kind of thing a diagram explains better than prose. Skip flagged this during the homepage rewrite.

**Scope:**
- Diagram the flow: copy → paste → answer questions → custom prompts → fresh reports
- Could live on the homepage (between Hero and How it works, or as part of How it works) or in the Design Notes PDF
- Decide visual style — could be hand-drawn-feeling, technical-flowchart-feeling, or somewhere in between

**Effort:** small thread, or could ride along with Design Notes PDF regen.

## Tier 4 — Long-term leverage

### 9. About section as a dedicated section (currently footer-only)

**Why later:** the footer About blurb (just shipped) carries enough weight for now. A dedicated About section between FAQ and Feedback could be added if we ever want to surface the maker story more prominently. Not blocking anything.

### 10. "Comparable Past Sessions" section in Session Reports

**Why later:** highest-leverage future feature for the validation loop. Best built after several months of validation history accumulates.

**Dependencies:** validation archive with enough history to be meaningful. Probably 50-100 logged sessions minimum, ideally across a year of seasonal variation.

### 11. Distribution / front-end work

Possibilities for a future polish pass:
- Sample report displayed inline on the homepage so friends see what they're getting
- Short embedded video or animated demo of the copy-paste flow
- "Browse breaks" section if the system grows beyond Skip's personal use
- System Guide / Design Notes moved from PDF to web-rendered for friendlier reading

### 12. Validation Layer column schema review

**Why later:** v1.0+ added new fields (Builder Version, Worker Schema Version, cross_check fields). v1.2 adds METAR and forecast-wind provenance fields. These may not map cleanly to existing Sheets columns in `script-b/Code.gs`. Worth auditing once the Validation Layer is in active use.

## What's NOT on this roadmap

- **Rebuilding the homepage from scratch.** April 28's section-by-section pass refreshed all the copy that was stale. Architecture is fine. Resist the rabbit hole.
- **Switching domains again.** `surfreportbuilder.com` is canonical; `aisurfreport.com` is parked.
- **Building a full SaaS / multi-user version.** This is a personal project shared with friends. Resist scope creep.
- **Adding more LLM-specific tuning to the prompt.** The prompt is already designed to degrade gracefully across runtimes. The Worker is the right place to absorb runtime variability, not the prompt.

## Recommended next-thread sequence

1. **Design Notes PDF regen** (Tier 1, item 2) — Skip flagged "soon" and the homepage now references "Design Notes" while the file is still the v1.0 System Guide. Closing this gap is genuinely user-facing.
2. **Parallel-runtime sanity test** (Tier 1, item 1) — sharpens FAQ Q3 and the homepage's runtime story
3. **Worker DNS-cache triage** (Tier 2, item 4) OR **v1.2.1 cleanup** (Tier 2, item 5) — depending on whether reliability or polish feels more right at the time

Tier 3 onward can wait for the right moment.
