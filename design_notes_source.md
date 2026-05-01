# Surf Report Builder — Design Notes v1.1

**Build your own surf report.**

A reference for the system, the prompts it generates, the data they pull from, and the choices behind the design.

surfreportbuilder.com

---

## What's New In v1.1

This is the first content update to the Design Notes since v1.0.

What changed:

- **Runtime guidance** ("Which AI Should I Use?") rewritten to reflect cross-runtime testing completed since v1.0. The Design Notes now point readers to the website for the current recommendation, since runtime behavior changes faster than the PDF can be republished.
- **"What Could Make This Wrong"** described as a four-element structure (failure mechanism, empirical check, check performability, plain-language implication). The Builder Prompt now requires all four elements rather than treating the section as a single hedging line, and the Design Notes describe what readers will see in their reports.
- Minor wording clarifications throughout. No change to the Worker, the source policy, the five parts, the local model, the Tracking loop, the Google Sheets setup, the confidence vocabulary, or the international expansion roadmap.

If you have v1.0 saved, the differences above are the practical ones. The rest of the document still applies.

---

## What This Is

Surf Report Builder is not a surf forecast website, app, or rating system.

It is a free AI prompt kit.

You copy a single piece of text — the Builder — and paste it into the AI of your choice. The Builder asks three quick questions, researches your selected break, and hands back reusable prompts customized to that location.

It's a prompt that builds you your own prompts.

You use those new prompts to generate Session Reports, Long Range Reports, and (optionally) Tracking records that score how reports compared to what you actually saw in the water.

No coding skill is required. If you can copy, paste, and answer a few quick questions, you can use it.

The goal is to give surfers a reusable way to inspect source data, translate it into local conditions, and keep their own records.

Website: https://surfreportbuilder.com

---

## How It Works

In three steps:

**Step 1.** You copy the Builder from the website and paste it into your AI.

**Step 2.** That prompt interviews you briefly — which break, when do you usually surf, how much do you want set up — then sends your AI out to research your specific spot. It finds the right ocean buoys, the right tide station, the right airport for wind, the right marine forecasts. It checks which sources actually return usable data and discards the ones that don't. The result is a verified shortlist of sources for your exact break.

**Step 3.** It writes you new prompts using that shortlist — one for your next session, one for the upcoming swell outlook, optionally one for keeping a record of how reports compared to reality.

From then on, you run those custom prompts whenever you want a report. You only go back to the Builder if you want to set up another break or rebuild from scratch.

That's the whole shape. The rest of this document explains the pieces and the reasoning behind them.

---

## Why This Works When Most AI Surf Prompts Don't

The honest reason most AI surf prompts produce mediocre reports is that AI tools are inconsistent at reading live ocean data. Buoy pages are JavaScript-heavy and often look blank to AI scrapers. Tide pages are worse. Wind data is hidden behind aviation databases that AI tools mostly can't reach reliably. Different AIs (Claude, ChatGPT, Perplexity) have different success rates at fetching this stuff, and even the same AI varies day to day.

This system solves that with a small piece of dedicated infrastructure called the Surf Report Worker.

The Worker is a tiny program that lives on the internet, fetches data from official sources at the moment your AI asks for it, and hands back clean, reliable readings. Your AI doesn't have to scrape pages — it just asks the Worker for what it needs and gets a current, parseable answer.

The Worker currently serves four data classes:

- **NOAA buoys** — wave height, period, direction, water temperature
- **NOAA tide stations** — observed water level, harmonic predictions, observed-vs-predicted cross-check for surge detection
- **FAA airport weather (METAR)** — current observed wind from the airports nearest your break
- **National Weather Service forecasts** — gridpoint forecast wind for your session window

That covers every primary source the report prompts need to fetch. The user-facing reliability story collapses to one question: is the Worker reachable from the AI you're using? If yes, the report has fresh data. If no, the report says so honestly instead of guessing.

You don't need to do anything to use the Worker. The prompts the Builder generates already know how to call it. The Worker is open-source, runs on free Cloudflare hosting, and is part of the public project.

For the curious, the Worker source is at https://github.com/nfischbein/Surf-Report-Worker.

---

## The Five Parts

The system has five named parts:

1. **Surf Report Builder** (the prompt that builds your prompts)
2. **Session Report Prompt**
3. **Long Range Prompt**
4. **Tracking Prompt** (optional, sometimes called the Validation Layer in the source code)
5. **Google Sheets Web App** (optional, for durable storage and tracking history)

### 1. Surf Report Builder

The starting prompt. This one is provided to you.

Find it on the website by clicking **Copy the Builder**. The website's copy window is the canonical source — it always reflects the latest version.

The Builder builds all the other prompts. It's the multi-tool for surf-report prompt building.

It asks three quick questions:

1. The surf break or beach.
2. The session window you care about most.
3. Whether you want just the Session Report Prompt, or all three prompts (Session Report, Long Range, and Tracking).

If you choose all three, it asks one more question: whether you want Google Sheets storage set up alongside them.

Then it builds the prompts for that break.

### 2. Session Report Prompt

The near-term report prompt.

This prompt is created for you by the Builder.

You run it when you want a report for your next session, tomorrow morning, a specified session window, or a reconstructed past session.

It checks source freshness, reads buoy, tide, observed wind, and forecast wind data through the Worker, applies your break's local model, and translates those readings into plain surf terms.

Reports come in two layers: a plain-language section on top that reads like a friend texting you about conditions, and a technical appendix underneath with the raw data, source citations, and confidence reasoning. Most readers will only use the top section. The appendix is there if you want to dig in.

### 3. Long Range Prompt

The longer-horizon swell report prompt.

This is another output from the Builder.

You run it when you want to look beyond the next session.

It tracks potential swell events on roughly a 3–21 day horizon, with emphasis on the next 10 days. It separates confirmed incoming energy from developing signals, early signals, low-confidence signals, and false alarms.

Same two-layer format as the Session Report: plain-language outlook on top, technical detail underneath.

### 4. Tracking Prompt

The optional post-session scoring layer.

This prompt is created for you by the Builder if you choose all three prompts.

The Tracking Prompt is optional. It works best as standing instructions inside an AI Project, Space, custom GPT, or saved chat. Set it up once, and after that logging can be as short as: *"Today was 0,"* *"Yesterday was -1, smaller than expected,"* or *"+2, much better than the report."*

If you're using a one-off chat, tracking still works, but it's clunkier because you may need to paste the instructions or context again.

Google Sheets makes the Tracking Prompt useful over time by linking each short score to the original report, source data, and session ID. Without Google Sheets, scores can help inside a single conversation but won't persist as a long-term record.

The Tracking Prompt logs scores reliably today. The longer-term promise — that the system uses your accumulated scores to learn your specific break and adjust future reports — is partly built and partly aspirational. The scoring itself works. The "Comparable Past Sessions" feature that pulls similar past sessions into new reports is on the roadmap; it depends on having a meaningful amount of history accumulated first. See *Honest Gaps* near the end of this document.

### 5. Google Sheets Web App

The shared read/write layer for the Session Report, Long Range, and Tracking prompts when storage is enabled.

It can store records from all three: Session Reports, Long Range Reports, Tracking entries, plus source-health notes, external observations, and analog matches.

Google Sheets is not required for Session Reports or Long Range Reports, but it's strongly recommended if you plan to use the Tracking Prompt — otherwise scores don't survive past a single conversation.

---

## Two options at setup

When the Builder asks what you want, you'll get two options:

- **Just the Session Report Prompt.** Fastest. Gets you a usable report right away.
- **All three prompts** (Session Report, Long Range, and Tracking). More capability for planning ahead and tracking results over time.

Both options use the same setup interview and produce break-tuned prompts. The difference is how many prompts the Builder hands you back. Most users want all three. The Session-only option is there for surfers who only care about tomorrow morning's call and don't want to think about long-range outlooks or tracking history.

If you choose all three, the Builder also asks if you want Google Sheets set up alongside the prompts. Sheets is optional for Session Reports and Long Range Reports, but strongly recommended for the Tracking Prompt — without it, your tracking scores don't persist past a single conversation.

Example invocations once your prompts are saved:

> Run my Session Report Prompt for tomorrow morning at 6:30 AM.

> Run my Session Report Prompt for today at 5:00 PM.

> Run my Session Report Prompt for Sunday morning and assume I prefer clean, smaller surf over bigger wind-swell.

---

## Which AI Should I Use?

This system depends on your AI being able to fetch current data from the web in real time. If you're using an AI without web access, it won't work — that's a hard floor, not a preference.

Beyond that hard floor, runtime choice matters more than it should. AI tools differ in how they fetch live data, how aggressively they cache responses, and whether they fabricate data when fetches fail. The differences are large enough that the same prompt can produce a useful report on one runtime and an unusable one on another.

The current recommendation lives on the website rather than in this PDF, because runtime behavior changes faster than the PDF can be republished. Visit https://surfreportbuilder.com for the latest guidance, including which runtimes are currently recommended, which to avoid, and any setup steps specific to a given runtime.

A few things that are true regardless of which runtime you pick:

- **Free tiers tend to underperform.** Across the runtimes tested so far, free-tier AI assistants have shown a mix of stale-cache behavior, multi-fetch failures, and (in at least one case) silent fabrication of data that wasn't actually fetched. Paid tiers aren't immune to all these problems, but they currently have the best track record.
- **Silent fabrication is the one disqualifying failure.** If a runtime invents data instead of saying it couldn't reach a source, the system's defensive checks can't catch it — there's nothing to check against. Stale data and outright fetch failures are recoverable (the report flags them and degrades confidence honestly); fabrication isn't. This is why the website's recommendation rules out specific runtimes by name.
- **Cache state varies.** Even on a recommended runtime, individual sessions can hit a stale cache and produce a report at Medium or Low confidence rather than High. This is normal and the system handles it correctly. If your first report comes back with several sources marked offline or stale, try again in a few minutes — transient cache issues usually clear, and a real outage will still be there on retry.

Treat the website's runtime recommendation as the current best call, not a permanent verdict. If you find a runtime that works well for you and isn't currently listed, the feedback link on the website is the right place to share that finding.

---

## Source Policy

Reports rely on measured data from official public sources and on the local model the Builder constructs for your break.

Reports do **not** use commercial surf-reporting forecasts, predictions, proprietary models, ratings, summaries, editorial calls, hype, recommended boards, "best spots" calls, or commercial conclusions about expected surf quality.

Commercial surf-reporting sites can contribute only two narrow categories of information:

1. Real-time measured data, such as live buoy readings, wind readings, water temperature, or tide data — but only the uninterpreted numbers, never the surrounding analysis.
2. Historical observed descriptions, such as post-session notes, dated photos or videos, or archived after-the-fact reports describing what actually happened.

All four primary data classes — NOAA buoys, NOAA tide stations, METAR observed wind, NWS forecast wind — are fetched through the Surf Report Worker. The Worker calls official upstreams (NOAA, NWS, FAA) server-side and returns clean normalized data to your AI. No commercial site sits in that chain.

---

## What This System Won't Do

Most surfers already know this, but it matters because the system may be shared outside its original context: this is not a lifeguard service or marine-safety system. It may miss dangerous shorebreak, rip currents, lightning, water quality issues, closures, debris, access problems, or conditions that changed after the report was generated. Check the beach and know your limits before entering the water.

The system depends on the AI environment you use. Some AIs browse better than others. Some can read rendered pages reliably. Some lean too hard on raw XML or stale feeds. Some miss timestamps unless the prompt forces them to check.

Reports work best when the AI can:

- browse current web pages,
- reach the Worker URL,
- verify timestamps,
- compare multiple sources,
- explain missing or stale data,
- translate technical readings into plain surf terms.

---

## What Your Reports Will Do

Your reports will:

- check a chain of relevant buoys instead of relying on one number;
- translate offshore buoy data into likely conditions at your specific break;
- explain how swell direction, period, tide, wind, bathymetry, headlands, islands, reefs, sandbars, jetties, and local blocking may change what actually reaches the beach;
- separate local, regional, upstream, and distant swell signals;
- distinguish groundswell from local wind sea;
- identify potential Long Range Report events without pretending they are guarantees;
- use measured data and observed descriptions, not commercial surf forecasts, ratings, models, or interpretations;
- explain stale, missing, or conflicting data instead of hiding it;
- confirm source timestamps before trusting readings;
- name a specific failure mode under "What Could Make This Wrong" instead of vague hedging — see the section below for the four-element structure;
- get better over time if you use the Tracking Prompt with Google Sheets to build a personal history of how reports compared to reality.

Reports come back in two layers — the plain-language section is what most readers want. The technical appendix below it is for when you want to verify the call yourself, see the source URLs, or feed the data into a record.

---

## Customizing For Your Break

The Builder starts with your break name, location, and session window.

It then researches the break and builds a local model. That model identifies:

- the most relevant local and regional buoys,
- upstream buoy chains for near-term swell detection,
- distant buoy layers for long-range swell detection,
- the official tide station,
- the primary airport for observed wind, and a secondary cross-check airport when one exists nearby,
- the official marine forecast source,
- the official surf-zone forecast source if one exists for your area,
- common swell windows for the break,
- known blocking features,
- nearby headlands, islands, reefs, jetties, sandbars, shelves, canyons, or bathymetric features that affect translation,
- likely wind sensitivities,
- likely tide sensitivities,
- common false-positive swell setups (configurations that *look* good on the buoy but consistently underperform locally),
- common underperforming directions,
- common overperforming combo-swell setups (configurations that consistently exceed what the raw buoy numbers suggest),
- known source-health problems specific to the area.

The local model isn't just a list of nearby features. It's the report's filter for what to trust and what to be skeptical of. If your break has a known false-positive pattern — a particular swell direction and period that looks good on the buoy but consistently underperforms because of local blocking — the report applies that knowledge before making the call. If your break has a rare overperforming combination — a specific tide window and swell angle that punches above the buoy numbers — the report knows that too.

The local model is also a working hypothesis. It's the system's best read of how your break behaves based on initial research. You're expected to revise it as you log real sessions and notice patterns the initial research didn't catch. The Tracking Prompt is the natural input channel for those revisions.

The generated prompt is not a generic surf prompt with your break name swapped in. It is a break-specific reporting prompt. If the break has complicated local behavior, the prompt can include that complexity. If the break is straightforward, the prompt stays simpler.

---

## Revising Your Report Prompt

Your first generated prompt is a starting version.

You can revise it whenever you like.

Useful revision requests:

> Revise my Session Report Prompt to make the main report shorter but keep the data caveats.

> Revise my Session Report Prompt to be more skeptical of short-period wind-swell.

> Revise my Long Range Prompt to emphasize Southern Hemisphere swell events.

> Revise my Long Range Prompt to flag any event that might require travel rather than treating all events equally.

> Revise my Session Report Prompt to include a one-line beginner/intermediate/advanced suitability note.

The Tracking Prompt gives the best revision material because it records where the report matched reality and where it missed.

---

## Using The Session Report Prompt

The Session Report Prompt creates a report for a specific upcoming, current, or reconstructed session window.

It can run before the session, after the session, or for a specified future session.

Your Session Report will not blindly repeat buoy numbers. It will translate the technical readings into plain surf terms. The plain-language layer at the top of the report explains what those readings likely mean at the break: face height, consistency, power, lulls, texture, shape, tide effect, and who the session is likely best for. The technical appendix below it cites the raw readings and sources.

Example translation:

> The local buoy is showing 3 ft at 14 seconds from a direction that's partly blocked for this break. In plain terms, that probably means inconsistent waist-to-chest-high sets rather than a steady 3–4 ft surf day. Expect long waits between the better waves, with more power on the sets than the average size suggests.

Another example:

> The local buoy is showing short-period west wind-swell. That can make the buoy number look decent, but at the beach it usually means crumbly, uneven surf with short lines and less push. Expect more texture than power unless the wind backs off.

Each report includes:

- an opening header with the break, date, session window, run timestamp, and overall confidence rating;
- a plain-language section called **The Call** — three to five sentences covering size, tide, wind, and who the session favors;
- a structured **What Could Make This Wrong** section — see the next subsection for the four-element format;
- a short **Why Confidence Is High / Medium / Low / Speculative** — explains the rating in plain English;
- a technical appendix with source data, freshness states, conflict resolution if any, and a structured Source Health summary;
- an optional structured storage record when Google Sheets is enabled.

### What Could Make This Wrong: the four-element structure

Earlier versions of the system used "What Could Make This Wrong" as a single sentence naming a possible failure. That worked, but the line often collapsed into hedging like *"if the swell direction is wrong, this call is wrong"* — true, but not actually useful. The current Session Report Prompt requires the section to cover four elements:

1. **Failure mechanism** — what could go wrong physically. *("The bay could be shadowed harder than usual today.")*
2. **Empirical check** — which reading at which station would catch it. *("San Pedro buoy would normally let us check this — when San Pedro shows materially more long-period south energy than Santa Monica Bay, the bay is filtering harder and the call is too optimistic.")*
3. **Check performability** — whether that check was performable for this report. *("San Pedro was unavailable this run.")*
4. **Plain-language implication** — what the missing data means for the user, in terms they can act on. *("If you arrive and the sets feel smaller and more spaced out than the report suggests, the shadow effect is the most likely reason, and the day is probably small-and-soft rather than fixable by waiting.")*

The fourth element is the one most often missing in earlier versions. Without it, the section can describe an uncertainty without telling the reader what to do about it. With it, the reader leaves the section knowing both *what might be wrong* and *what they should watch for at the beach* if it turns out to be.

---

## Using The Long Range Prompt

The Long Range Prompt looks beyond the next session.

It tracks potential swell events on a 3–21 day horizon, with emphasis on the next 10 days.

It classifies signals as:

- **confirmed** — incoming energy has reached upstream buoys and is consistent across multiple sources;
- **likely developing** — model fields and storm setup support an event, with some early data confirmation;
- **early signal** — model or chart support, no confirmation data yet;
- **low-confidence** — limited or conflicting evidence;
- **false alarm** — initially flagged but not borne out by subsequent data.

It compares source-region storm charts, official marine forecasts, upstream buoys, local confirmation buoys, and rendered model fields where available.

It searches for and compiles buoy signals farther away from your local region, then accounts for distance, likely travel time, swell period, direction, and local filtering before treating those signals as relevant to your break.

It uses travel-time logic cautiously. Longer-period swell travels faster than shorter-period swell, but arrival time also depends on storm duration, fetch movement, direction, dispersion, and local filtering.

Time-horizon rules:

- **3–5 days out:** size category only (small, moderate, large, etc.) — no specific face heights.
- **5–10 days out:** source region, direction window, possible arrival window, and confidence — no precise size.
- **10–21 days out:** early signal only — no surf-height prediction.

Like the Session Report, the Long Range Report is two layers. The top is a plain-language outlook with an Events to Watch list, a What Could Make This Wrong, and a confidence explanation. The technical appendix below it includes a structured event table, upstream basin-by-basin context, and source health.

---

## Confidence Vocabulary

Every report — Session or Long Range — closes with an Overall Confidence rating using one of four words:

- **High** — the primary local source is current, at least one upstream or regional source confirms it, and there are no contradictions.
- **Medium** — one of the two primary confirmations is stale or missing, but no major contradictions.
- **Low** — only a single source available, or the primary local source is stale or in a gap state, or current conditions are unusual relative to the local model.
- **Speculative** — the report covers events more than 5 days out, or it relies only on source-region storm charts with no local confirmation, or critical sources are offline.

Those four words and only those four words appear as the Overall Confidence rating. There is no "moderate," no "fair," no "good." A Speculative report is just as honest as a High report — it's accurately telling you not to count on it.

The same vocabulary applies to per-event confidence in the Long Range Report's Event Table.

---

## The Tracking Prompt

The Tracking Prompt is the optional post-session scoring layer. It records how closely each report matched what you actually saw in the water and stores those scores so they can be used over time.

(In the source code and earlier documentation this is sometimes called the Validation Layer. The Builder hands it to you as the Tracking Prompt; the underlying mechanism is the same. You'll see the older name show up in one place: the Sheets archive's `validations` tab. The tab name dates from the system's earlier terminology; the data it stores is what the Tracking Prompt writes.)

In plain terms: the system generates a report, you go surf, and afterward you tell the system how accurate the report felt. You give the session a score. The Tracking Prompt records that score with the original report ID and source data. Over time, those records build a personal history of how reports compared to reality at your break.

Google Sheets is strongly recommended for the Tracking Prompt. Without Google Sheets, scores can help inside a single AI conversation, but they don't persist as a long-term record. With the Google Sheets Web App, each entry gets stored and linked to the original report by session ID.

The best setup is to save the Tracking Prompt as standing instructions inside an AI Project, Space, custom GPT, or saved chat. Then logging a session can be as short as *"Today was 0"* or *"Yesterday was -1, smaller than expected."*

What the Tracking Prompt does today, and what it will do later:

- **Today:** logs scores reliably with the report context attached. You build a usable history. You can ask the AI questions like "show me my last ten -1 sessions" or "when was the last time I logged a +2."
- **Later:** the system pulls similar past sessions into new reports automatically — "the last three long-period south + high-tide setups averaged -0.7 on Reality Score" — and adjusts confidence based on that history. This feature is on the roadmap and depends on having a meaningful amount of history accumulated first. See *Honest Gaps* below.

---

## Reality Score

The main tracking score is Reality Score.

It answers one question: was there a difference between the surf you experienced and the report?

Use this scale:

- **-2** = reality was much worse than the report
- **-1** = reality was somewhat worse than the report
- **0** = reality matched the report
- **+1** = reality was somewhat better than the report
- **+2** = reality was much better than the report

A perfect match is 0. Better than the report is positive. Worse than the report is negative.

Example inputs:

> Log tracking for this morning: 0.

> Reality Score -1. It was smaller and softer than the report suggested.

> Reality Score +2. Much better than the report, cleaner sets and more power.

Optional category scores (the system can work with only the main Reality Score):

- size_score
- shape_score
- wind_score
- tide_score
- consistency_score
- power_score
- usefulness_score

---

## Google Sheets Web App

Google Sheets is optional for basic reports. It is strongly recommended for the Tracking Prompt.

A Google Sheets Web App lets your AI send structured records to your spreadsheet without giving the AI login access to your Google account.

In the full setup, the Web App is the single shared read/write layer for all three prompts. Your Session Report Prompt can write near-term report records. Your Long Range Prompt can write swell-event and horizon records. Your Tracking Prompt can write Reality Scores and notes. All three can read from the same archive when comparing current conditions against prior reports, source snapshots, and tracking history.

You set this up after the Builder creates your custom prompts, and before you rely on tracking history. The basic reports still work without it. The Web App matters when you want everything stored in one place for future comparison.

The Web App can store:

- Session Report records,
- Long Range Report records,
- Long Range event records,
- buoy observations,
- tide observations,
- wind observations,
- source-health notes,
- Tracking entries,
- external observed-condition notes,
- analog matches.

The spreadsheet becomes the system's durable memory.

Tabs (auto-created on first use):

1. sessions
2. long_range_reports
3. long_range_events
4. buoy_observations
5. tide_observations
6. wind_observations
7. validations
8. external_observations
9. analog_matches
10. source_health

You don't need to create these tabs by hand. The reference Apps Script creates each tab automatically the first time data is written to it. (The `validations` tab is what the Tracking Prompt writes to — the internal name dates from earlier "Validation Layer" terminology. Keeping the tab name unchanged means existing users' archives keep working without migration.)

The Web App uses a shared secret. Keep it private.

If you don't enable Google Sheets, the generated prompts can still produce useful reports, but the system loses reliable long-term memory.

---

## Setting Up The Google Sheets Web App

Use this setup when you want tracking and historical storage.

This guide uses a vetted reference implementation that you copy directly from the project repository — earlier versions had your AI generate the Apps Script code from scratch each time, which introduced variability.

You will need:

- a Google account,
- about ten minutes for first-time setup,
- a private place to store one short random string (your shared secret).

**Step-by-step:**

1. Create a new Google Sheet (or open an existing one you want to dedicate to surf reports). Give it a recognizable name like "Surf Report Archive." You don't need to add tabs — the script creates them.
2. Open the reference Apps Script file at this URL:
   https://github.com/nfischbein/Surf-Report-Builder/blob/main/script-b/Code.gs
3. On that page, click the **Raw** button. Select all of the file contents and copy them.
4. Back in your Google Sheet, open **Extensions → Apps Script**. A new browser tab opens with starter code in an editor.
5. Delete the starter code in the editor. Paste in the Code.gs you just copied.
6. Find the line near the top that reads: `const SHARED_SECRET = 'CHANGE_ME_TO_A_RANDOM_STRING';`
7. Change the string between the quotes to a random value of your own. Any 16+ character random string works. Keep it private — it's the only thing protecting your sheet. Use your own value, not anything you've seen as an example anywhere else.
8. Save the script (disk icon or Cmd/Ctrl+S).
9. Click **Deploy → New deployment**.
10. Click the gear icon next to "Select type" and choose **Web app**.
11. Description: anything you want, e.g. "Surf Report Builder v1."
12. Execute as: **Me**.
13. Who has access: **Anyone**. This sounds scary, but Google requires it so your AI can POST without logging in. The shared secret is what actually protects your data — anyone without it gets rejected.
14. Click **Deploy**. Authorize when prompted. The consent screen will warn that the app is unverified — that's expected because you wrote it yourself. Click **Advanced → Go to [project name] → Allow**.
15. Copy the Web App URL Google shows you after deployment. It looks like:
    `https://script.google.com/macros/s/AKfyc.../exec`
16. Test the deployment by visiting that URL in your browser. You should see a JSON response listing the accepted record types. If you see an error page or HTML, something went wrong with deployment.
17. Save your Web App URL and shared secret somewhere safe (a password manager works). You'll paste both into your generated report prompts when those prompts ask for them.

**After setup:**

You have two values to paste into generated report prompts when they ask for them:

- Your Web App URL.
- Your shared secret.

The Session Report Prompt, Long Range Prompt, and Tracking Prompt each include placeholders for these values. Fill them in once after the Builder generates each prompt.

**If you suspect your secret has leaked:**

1. Open your Apps Script editor again.
2. Change `SHARED_SECRET` to a new random string.
3. Save and redeploy: **Deploy → Manage deployments → pencil icon → New version → Deploy**.
4. Update the secret in every prompt that uses it.

The Web App URL itself doesn't need to change — just the secret.

**Updating the reference code later:**

If the project repository ships an update to Code.gs, you can refresh your deployment:

1. Open your Apps Script editor.
2. Replace the script contents with the updated Code.gs from the repository.
3. Restore your shared secret in the new code (the new file ships with the placeholder).
4. Save.
5. **Deploy → Manage deployments → pencil icon → New version → Deploy**.

Your existing data is preserved. Only the script behavior updates.

Safety notes: this script never reads from your sheet, only appends. It cannot delete or overwrite existing rows. It does not send any data anywhere except your own sheet.

---

## Reports In Other Languages

The reports are produced by your AI from the prompts the Builder generates. Modern AIs are natively multilingual. You can add a directive to your generated prompt — *"Generate reports in Spanish"* / *"Always produce reports in French"* — and the AI will follow it.

The system's machine-readable vocabulary stays in English even in non-English reports: the four confidence ratings (High / Medium / Low / Speculative), the structured Source Health field codes, and the rule references. This keeps the Sheets archive consistent across languages and lets the validation/tracking loop work regardless of which language a particular report was written in. The conversational prose layer translates fine; the structural labels stay in English.

A future Builder version may add a language question to the setup interview, baking the language preference into the generated prompts directly. For now, adding the directive yourself is the path.

---

## Honest Gaps

A few things the system doesn't yet do — named here so you know what you're getting.

**OFS surge correction.** NOAA's Operational Forecast System is the ideal source for weather-corrected tide forecasts (the kind that account for storm-driven sea level changes more than a few hours out). It isn't yet reachable through the Worker. In the meantime, the Worker's observed-vs-predicted tide cross-check catches surge that's already happening; what it can't do is predict surge that hasn't started yet. Adding OFS to the Worker is a future project.

**OPC storm charts are images, not text.** The Ocean Prediction Center publishes the most useful long-range storm charts as GIF images. AI tools can fetch the image but can't read it without visual interpretation, which is unreliable. The Long Range Prompt acknowledges this gap and degrades confidence accordingly when storm charts would matter and can't be parsed.

**The Worker is a single point of failure — by deliberate design.** All four primary data classes route through it. If the Worker is unreachable from your AI, every report becomes Speculative. The Worker already has internal redundancy at the upstream level — the buoy fetcher chains BuoyPro → NDBC widget so a single upstream outage doesn't take down buoy data, the forecast wind fetcher chains NWS → Open-Meteo, and similar fallbacks exist for the other classes. What the system deliberately does *not* do is run a redundant Worker at a second cloud provider. Doing so would push complexity back into the prompts (URL fork-handling), reintroducing the runtime variability the Worker was built to eliminate. Cloudflare Workers' uptime is excellent in practice, and the system handles outages honestly — it correctly diagnoses "Worker unreachable" rather than fabricating data — so the cost of that reliability tradeoff is bounded.

**Forecast wind can be wrong.** The Worker returns whatever NWS or its fallback model predicts. If those models miss something (a coastal eddy, a surprise sea breeze), the report will confidently cite an inaccurate forecast. Tracking history will eventually catch these patterns over time; nothing in the current system catches them prospectively.

**The Tracking loop is partly aspirational.** Logging Reality Scores works today. The "Comparable Past Sessions" feature that pulls similar past sessions into new reports automatically is on the roadmap, not in the current build. It depends on having enough history to be useful, which takes time to accumulate.

**International coverage is partial today, expanding.** The Worker currently serves US-centric buoy and tide data (NDBC, NOAA CO-OPS) plus globally-available wind data (METAR airports, with Open-Meteo as a forecast fallback for points outside NWS coverage). A surfer outside the US gets usable wind data through the Worker today, but will see "Source offline" for buoys and tide unless their break happens to be near a US-served station.

The architecture is built for international expansion. The Worker's URL pattern already accepts a region namespace, and the design absorbs new regions without disrupting existing ones. The current planned order, in order of intended pursuit:

1. **Europe** — UK, Ireland, France, Spain, Portugal, Italy, Greece, Mediterranean coast, Baltic, North Sea, via the Copernicus Marine In Situ system.
2. **Global tide** — roughly 300 tide stations across 90+ countries, via the IOC's global sea-level monitoring service.
3. **Australia and New Zealand** — via the Australian Ocean Data Network and equivalents.
4. **Latin America** — Brazil, Chile, Mexico, Costa Rica, country by country.
5. **Africa** — beginning with South Africa, expanding as data sources become accessible.
6. **Other Pacific and Asian regions** — as user demand and data availability warrant.

These are roadmap items, not shipped capabilities. The order may shift based on user feedback, data-source accessibility, or volunteer contribution. If you'd like to see your region prioritized — or you know of a public data source we should integrate — the feedback link on the website is the right place to say so.

These are real limits. The system's positioning is honesty about what it knows and doesn't know — not over-promising features that aren't shipping.

---

## Questions And Feedback

Use the website to provide feedback, report problems, or ask questions:

https://surfreportbuilder.com

---

## Appendix A — Where To Find The Current Prompt

The current Builder prompt is always available at https://surfreportbuilder.com — copy from the website's copy window for best results. Copying from a PDF can introduce line-break or formatting errors.

The website always reflects the latest version. These Design Notes describe how the system works; the website is the canonical source for the prompt itself, and for the current runtime recommendation.

For anyone who wants to see version history, contribute, or fork the project, the source is on GitHub at https://github.com/nfischbein/Surf-Report-Builder.
