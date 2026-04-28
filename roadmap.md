# AI Surf Report Builder — UX-First Roadmap

**Generated:** April 26, 2026
**Last updated:** April 27, 2026
**As of:** Closeout 8 (Phase 3 shipped, homepage Master Prompt rewrite live)

This roadmap is ordered by user experience impact, not engineering ambition. The principle: every step should be visible to a friend the next time they use the system, or it shouldn't be the next step.

## What's shipped since the previous roadmap revision

Brief catch-up so the active items below have context:

- **Worker Phase 2** — CO-OPS tide via Worker (RULE 5 collapse, schema 1.2)
- **Worker Phase 3** — METAR observations + NWS/Open-Meteo forecast wind via Worker. All four primary source types now flow through one domain. Wind data gap closed.
- **Builder Prompt v1.0 → v1.2** — RULE 2 collapsed for Worker integration, RULE 5 collapsed for Worker-mediated tide, two-tier report format introduced, four-word confidence vocabulary fixed
- **Homepage Master Prompt rewrite** — reframed around "the Master Prompt builds your system," added Data Sources section and 8-question FAQ
- **Domain live at surfreportbuilder.com** with HTTPS via GitHub Pages
- **System Guide v1.0 PDF** published (still references prior framing — see Tier 2 below)

## Tier 1 — Ship soon (next 1-2 threads)

### 1. Fetch-confidence / cached-data detection in daughter prompts

**Why first:** the system markets itself on transparency about data sources. The Data Sources homepage section makes the explicit promise: "Every reading is timestamped. Every source is named in the report. If a sensor is offline, the report says so instead of guessing." That promise is under-defended right now in one specific failure mode — when the AI runtime returns cached data from its own cache layer (browser cache, runtime fetch cache, search-engine snapshot) and the daughter prompt has no way to tell the difference between a live Worker hit and a stale cached version of the same URL.

The original Perplexity stale-cache pattern (Closeout 1) is the canonical example: an AI returning months-old buoy data dressed up as current. The freshness scale catches some of this if timestamps are honestly reported, but it doesn't catch a model that fabricates a plausible-looking timestamp or one that returns cached HTTP responses without surfacing the fact.

**What's specifically NOT in scope:** the Worker's own server-side caching (5-60 min reactive cache with freshness recomputed against the original `observed_at`). That layer is a feature; it never inflates the freshness band. The concern is exclusively about AI runtime caching that bypasses or shadows the Worker.

**Recommended approach (two complementary layers):**

- **Layer A — Rule language in RULE 2 / RULE 3:** explicit guidance that AI runtimes may return cached responses, and that the daughter prompt must classify any reading it cannot confirm came from a live HTTP fetch as `offline`. Two or three sentences. Cheapest to ship; partially effective because it depends on the AI's self-monitoring honesty.
- **Layer B — New Tier 2 disclosure field:** add a "Fetch Confidence" line to the REPORT CLOSING block (or expand Source Health) with a small vocabulary: `Live | Likely Live | Unverified`. The AI must evaluate per-source whether each Worker response actually came from a live fetch. Creates a visible signal Skip can scan to triage reports.

**Optional future Layer C (deferred):** Worker-side per-request nonce that the AI must echo. Catches lazy AI caching (repeated nonce = same cached response) and fully fabricated sources (nonce that doesn't match any real Worker response). More engineering than it's worth right now; queued for if Layers A+B prove insufficient.

**Effort:** small Builder Prompt thread. Probably 45-90 minutes including end-to-end testing. Could ship as v1.2.1.

**Why this is the right next thread:** it directly defends a homepage promise, and it's small enough to ship cleanly without scope creep.

### 2. System Guide PDF regen from v1.2 source

**Why now:** the v1.0 PDF references prior framing ("the System Builder Prompt," wind as the biggest gap, two-source-via-Worker setup). The homepage now uses different language ("Master Prompt") and the system itself ships four sources via Worker as of Phase 3. Mild dissonance for friends who download both.

**Scope:**
- Vocabulary alignment with the new homepage framing (Master Prompt → builds the system → three parts: Session Report, Long Range Report, Tracking)
- v1.2 content updates: four data sources rather than two, wind no longer named as a gap, METAR + forecast wind layer documented
- Demote the PDF's self-description from "the canonical artifact" to "the explanation"
- Pick up Layers A+B from item 1 above if those have shipped by then

**Dependencies:** ideally let the homepage settle for a few days before mirroring its voice in the Guide. Wait until Skip has stopped tweaking homepage copy before doing this pass.

**Effort:** medium thread. ~90 min including PDF regen.

### 3. El Porto end-to-end smoke test against v1.2 stack

**Why now:** Phase 3 shipped today and is unit-verified, but there's no v1.2 report-of-record yet. The smoke test would be the first complete v1.2 Worker-integrated Session Report — using the live METAR and forecast-wind endpoints alongside the existing buoy and tide flows.

**Scope:**
- Generate a fresh El Porto Session Report Prompt against v1.2 Builder
- Run a Session Report for the next dawn patrol
- Verify: METAR data flows through Worker correctly, forecast-wind flows through Worker correctly, no fabrication, no dropped sources, RULE 4 fires correctly across the four data classes, Tier 1 voice rules respected

**Effort:** ~30-45 min. Mostly running the report and inspecting it.

## Tier 2 — Reliability before more features

### 4. Worker DNS-cache hiccup triage

Carried forward from previous roadmap. Still not a blocker, still worth fixing before broader friend rollout.

**Scope:** diagnose the BuoyPro upstream 503 "DNS cache overflow" pattern. Possibly per-hostname Cloudflare DNS cache limits, possibly User-Agent or connection-handling tweaks. Add `X-Cache: HIT|MISS` response header for observability while in there.

**Effort:** Worker thread, focused. 30 min to 2-3 hours depending on diagnosis.

### 5. Parallel-runtime sanity test

Carried forward. Not yet done. Has new urgency now that the FAQ on the live homepage says "ChatGPT with browsing should also work but we haven't formally tested it yet" — that hedge can sharpen once tested.

**Scope:** run the v1.2 Master Prompt for El Porto in 1-2 alternative runtimes (paid ChatGPT with browsing being the priority). Document what works, what fails, what fabricates, what degrades gracefully.

**Effort:** ~30 minutes per runtime tested.

### 6. v1.2.1 small-drift cleanup

Carried forward from previous roadmap (was v1.1.1). Two known drifts plus housekeeping:

- **0-3 day artifact in Long Range Report Prompt run-step language** (Closeout 6 finding)
- **OPC chart GIF limitation pre-disclosure** (Closeout 6 finding)
- Optionally fold in: Tier 2 `data_quality` field surfacing, Validation Layer column schema review, local model CO-OPS ID capture verification

**Effort:** small thread. ~30-45 minutes.

### 7. Out-of-thread housekeeping

Five-minute fixes:

- **PZZ650 → PZZ655** in El Porto's `00_local_model.md` (Closeout 5 finding)
- ~~**Shared secret rotation**~~ — moot per Skip's plan to do a fresh setup of the optional Sheets archive
- **Delete `ai_surf_report_builder_system_guide_v0_3.pdf`** from the repo if not already done

### 8. About / Who built this section on homepage

**Why:** the homepage establishes "we" as a voice but never says who "we" actually is. For a tool that markets honesty as its core differentiator, having a real person behind it strengthens the credibility considerably. The current footer says "AI Surf Report Builder is an experimental tool" — accurate but distant. An About section reframes that warmly while staying honest about scope (this is a personal project, not a SaaS).

**Scope:**
- Short About section, probably between FAQ and Feedback on the homepage, or as a small block in the footer
- Voice: third-person, low-key, authentic
- Suggested seed copy (from Skip's note): *"Surf Report Builder is built and maintained by a surfer in Southern California with over 20 years of surfing experience. It was born out of a personal project — originally using AI to help inform tomorrow morning's plans: surf, or a distance paddle?"*
- The "surf or distance paddle" origin detail is the load-bearing line. Keep it.

**Decision to pre-make before scoping the thread:** how identifiable does Skip want to be? Three rungs to choose from:
1. Anonymous craftsman (no name, just regional + experience)
2. Named but unlinked (real name, no contact links)
3. Public maker (real name, GitHub link, maybe email/social)

Defaulting to (1) is safe for friend-rollout era; (2) or (3) makes more sense if the project is part of Skip's public identity.

**Effort:** small. ~30 minutes including styling to match the existing section pattern.

**Dependencies:** none. Can ship anytime. Good candidate to bundle with another small thread (e.g. v1.2.1 cleanup, PDF regen) for thread efficiency.

## Tier 3 — Capability expansion

### 9. Worker Phase 4 — Custom domain (`api.surfreportbuilder.com`)

Carried forward. Still polish, not capability.

**Scope:** DNS records, Wrangler custom domain registration, RULE 2 + RULE 5 URL updates, optional 301 redirect from the workers.dev URL.

**Effort:** ~45 minutes.

### 10. OFS / WCOFS surge correction in tide forecasts

NOAA's Operational Forecast System produces weather-corrected tide forecasts (storm surge, atmospheric pressure, wind). Currently unreachable through both AI fetchers AND the Worker (NetCDF on THREDDS server, JS-rendered web pages). Documented as a known gap in RULE 5.

**Scope:** investigate whether THREDDS can be parsed server-side from the Worker. If yes, add a new fetcher and a new tide channel. RULE 5 gains an OFS layer alongside the existing CO-OPS observed/predicted/cross_check.

**Why later:** the cross_check field already detects surge by comparing observed vs predicted. OFS would be an upgrade, not a fix. Worth doing eventually for breaks where surge events are common.

**Effort:** Worker thread, larger. Hard to scope without spike investigation.

## Tier 4 — Long-term leverage

### 11. "Comparable Past Sessions" section in Session Reports

Carried forward. Highest-leverage future feature for the validation loop. Best built after several months of validation history accumulates (50-100 logged sessions minimum).

### 12. Distribution / front-end work

Carried forward. Possibilities:
- Sample report displayed inline on the homepage so friends see what they're getting
- Short embedded video or animated demo of the copy-paste flow
- System Guide moved from PDF to web-rendered for friendlier reading

### 13. Validation Layer column schema review

Carried forward. v1.2's schema additions (cross_check fields, METAR observation shape, forecast-wind shape) may not map cleanly to existing Sheets columns in `script-B/Code.gs`. Worth auditing once the Validation Layer is in active use.

## What's NOT on this roadmap

Worth naming explicitly:

- **Rebuilding the homepage from scratch.** Today's Master Prompt rewrite refreshed the framing without touching architecture. Resist the rabbit hole.
- **Switching domains again.** `surfreportbuilder.com` is the canonical front; `aisurfreport.com` is parked for archival. Don't relitigate.
- **Building a full SaaS / multi-user version.** This is a personal-project-shared-with-friends. Resist scope creep into "what if friends could log in and have their own breaks."
- **Adding more LLM-specific tuning to the prompt.** The prompt is already designed to degrade gracefully across runtimes. The Worker is the right place to absorb runtime variability, not the prompt.
- **Worker-side per-request nonces (Layer C of item 1).** Defer until Layers A+B prove insufficient in practice.

## Recommended next-thread sequence

1. **Fetch-confidence detection** (item 1) — small, defends a marketed promise, ships as v1.2.1
2. **El Porto smoke test** (item 3) — produces the v1.2 report-of-record, validates the whole stack
3. **System Guide PDF regen** (item 2) — once homepage copy has settled
4. **Worker DNS-cache triage** (item 4) OR **parallel-runtime test** (item 5) — pick based on whether reliability or coverage feels more pressing

Items 6-12 wait for the right moment.
