# COPY.md: every factual claim on shoal.ing, and what backs it

Shoal is in early access and has no public product repository yet, so the
source for most claims is the product brief: the Claude Design canvas
`Shoal Landing.dc.html` (claude.ai/design project
`37f28267-c933-44c3-8839-8c5f06e7cc5e`), checked on 2026-10-03. When the
product ships, replace "Brief" with the file or page that backs each line, and
change the page wherever the product differs.

## Status

| Claim | Status | Source |
| :--- | :--- | :--- |
| In early access; sign-up by waitlist | True | This repository; the form posts to the waitlist |
| The sign-up form asks for a Cloudflare Turnstile human check | True | `assets/shoal.js` renders the widget; `shoal-ing/waitlist-backend` verifies the token and refuses a join without one |
| Nothing is installable or billed yet | True | No release, no install script, no billing exists |
| Install script will be signed with cosign | Brief | Canvas "Verify signature" panel (`cosign verify-blob`) |
| Planned pricing: Free / $49 per rehearsal / $799 per month / Custom | Brief | Canvas `PLANS` |

## Product

| Claim | Status | Source |
| :--- | :--- | :--- |
| For founders, DevRel and PMMs shipping dev tools and AI products | Brief | Canvas hero chip |
| Simulated developers read, upvote, argue and decide whether to install (hero: "thousands of simulated developers react") | Brief | Canvas hero lede |
| Paste → Simulate → Fix: paste a post, simulate the audience, fix it with the ranked edits | Brief | Canvas section 02 (Seed, Simulate, Score; edits ranked by impact) |
| Venues: Hacker News, Reddit, X | Brief | Canvas hero lede, venue tabs, `PLANS[1]` |
| Under five minutes to the predicted thread, objections and edits | Brief | Canvas hero lede (no longer on the page; still in `llms.txt`) |
| Open-core, written in Rust, self-hostable | Brief | Canvas hero meta line |
| Seed: parses claims, calls to action, install steps; sets venue, time, calibrated baseline | Brief | Canvas section 02, card 01 |
| 10,000 agents, 38 developer segments, 48 simulated hours | Brief | Canvas section 02, card 02 |
| Jev, the deterministic engine, decides who acts and when; an LLM writes text only when an agent posts | Brief | Canvas section 02 |
| Report: predicted thread, sentiment over time, install intent by segment, trust flags, edits ranked by impact | Brief | Canvas section 02, card 03 |
| One static binary, 14 MB, linux / macos, arm64 / x86_64 | Brief | Canvas section 02 binary panel |
| Parts: Jev engine, persona sampler, LLM adapter (local or API), scorer + report | Brief | Canvas section 02 binary panel |
| Readouts "10,000 agents · 2,880 ticks · 88 LLM calls · 4.8s wall" and "412 pts · peak #3 · 3 trust flags · 2 edits" | Illustration | Canvas section 02; they describe the sample run |
| Plan contents (agents per run, A/B variants, 40 rehearsals a month, VPC/air-gapped, SSO, SBOM…) | Brief | Canvas `PLANS` |
| MIT core | Brief | Canvas `PLANS[0].badge` |

## Illustrations (labelled as such on the page)

| What | Where it says so |
| :--- | :--- |
| The mock run: its log, 412 predicted points, the objection and the +64 pts edit | "This is a mock run against the sample post below" |
| The sample post (a Show HN for Shoal itself) | Same |
| Simulated comments in the hero (maintainer_0217, sec_eng_0044, …) | They appear only while "Rehearse a launch" runs, under "SIMULATING 10,000 AGENTS"; `llms.txt` notes them |
| Hero audience line: "Built for Founders · DevRel · Product marketers, launching dev tools and AI products" | Who the product is aimed at; a positioning statement, not a customer claim |
| Hero example prediction: Hacker News peaks at #3 · 412 points, top objection "install script with no signature"; r/programming 61% positive; X 38 reposts; Product Hunt #2 Product of the Day · 640 upvotes | Captioned "EXAMPLE PREDICTION · SIMULATED, NOT REAL RESULTS". The HN line repeats the mock run (412 points, peak #3, the signature objection); the Reddit, X and Product Hunt figures are illustrative and come from no run |
| Hover cards on the hero fish (DEV #482, a role and stack, the venue it came from, what it is doing) | Each card is headed "SIMULATED DEV" and the hint's description says each fish is a simulated developer, not a real person. Personas and activities are picked in `assets/shoal.js` from fixed lists by the fish's index and the clock; they are not output of the product |

## Removed from the canvas

| What | Why |
| :--- | :--- |
| Section 03 "Calibration": six fictional launches (Driftwood DB, Kelpie CLI, Tidepool, Lanternfish, Brine, Coralline), "11% median error", "5 / 6 top objection matched" | The canvas marks it "Sample data shown; the launches are fictional". Invent nothing; it returns with real rehearsals scored against real threads |
| "Proof" nav link | Its section is gone |
| `curl -fsSL shoal.ing/install.sh \| sh` copy buttons (hero and final section) | No install script is published; replaced by early-access calls to action. The final section names the command once as planned |
| "Verify signature" panel with a `sha256 9f2c7a1e…b04de41a … v0.9.3` line | Placeholder hash and version for a release that does not exist |
| `cargo install shoal` · `brew install shoal` · "source on GitHub" | Neither package nor source is published |
| "Sign in" | No account system |
| Footer links Docs, Changelog, Status (all `href="#"`) | None exist. GitHub, llms.txt, Security and the contact address replace them |
| "MOST USED" badge on the Launch plan | A usage claim with no users |
| Plan buttons "Install the CLI", "Rehearse a launch", "Start a team trial" | Lead to flows that do not exist; they lead to early access. Enterprise "Talk to us" is a mailto |
| Canvas tweak props (temperature, density, speed, glow) | Fixed at their defaults: 0, 3000, 1, 0.6 |
