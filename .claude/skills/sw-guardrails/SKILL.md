---
name: sw-guardrails
description: >-
  Review any Speechworks artifact — blog posts, marketing/landing copy, UI
  strings, AI Coach prompts, analytics event names, metric/KPI names, dashboard
  tiles, or code — against Speechworks' therapeutic-integrity and brand
  guidelines for stuttering/stammering content (audience: India). Use when asked
  to check, review, audit, or lint content or code for adherence to the
  guidelines, brand voice, the "fluency god" guardrail, or whether copy is
  on-message for people who stutter/stammer and the SLPs who work beside them.
---

# Speechworks content & code guardrails

A reviewer for everything Speechworks ships — words and code alike. It enforces
the **therapeutic integrity** and **brand voice** that make Speechworks help
people who stutter/stammer instead of quietly harming them.

These guidelines blend several independent authorities, so they don't rest on a
single source or era: the Stuttering Foundation's *Advice to Those Who Stutter*
(the emotional "iceberg"), the **NSA** (westutter.org), **TISA** (The Indian
Stammering Association — our audience is India), **STAMMA** (the British
Stammering Association, which uses "stammering"), **ASHA** (the clinical/evidence
anchor), and the stammering-pride / neurodiversity scholarship and its critiques.
They converge on one load-bearing idea: **the visible stammer is the tip of an
iceberg; shame, fear, and avoidance below the waterline are what keep people
stuck. The target is the struggle, tension and baggage around stammering — not
the stammer itself** (STAMMA; ASHA: "stuttering itself does not inherently
require remediation"). Anything that worships fluency works against the user.

Three evidence-based paths coexist — fluency shaping, stuttering modification,
and stutter-affirming therapy — so don't review as if only one is valid.
Speechworks' own positioning: AI practice for "the 167 hours between sessions"
(Academy, Dashboard, AI Coach), plus the lived-experience + evidence blog.

## When to use

Trigger on requests like: "check this post / copy / PR against our guidelines,"
"is this on-brand?", "is this on-message for our India audience?", "review the AI
Coach prompt," "audit our metrics," "does this respect people who stutter?", or
before publishing any user-facing string or shipping any code that names, scores,
or rewards speech.

## How to run a review

1. **Identify the artifact type** — prose (blog/marketing/UI/email), AI Coach or
   LLM prompt, or code (component, schema, analytics event, metric/KPI, var/func
   name, copy embedded in code).
2. **Read it fully**, then scan against every guideline below. For code, also
   `grep` the red-flag patterns in the Quick reference.
3. **Report findings** in the output format below — location, the rule it
   breaks, *why* it matters, a concrete rewrite, and a severity.
4. **Offer to apply fixes** to the working tree (don't edit silently unless the
   user asked for `--fix`-style behavior).
5. If the artifact is clean, say so plainly and note anything borderline.

Severity levels:
- 🔴 **block** — actively harmful or off-mission (cure claims, fluency-as-KPI,
  shaming language). Must change before shipping.
- 🟡 **warn** — undermines voice/integrity or risks misreading. Should change.
- 🔵 **note** — stylistic / SEO / consistency nudge. Nice to fix.

---

## A. Therapeutic integrity

A1, A2, A3, and A7 are 🔴; the rest vary by case. Note one apparent tension up
front: **A2 governs the *product's* metric and claims** (don't enshrine or
promise fluency), while **A9 governs respect for an *individual's* goal** (don't
tell a user who wants fluency they're wrong). Both hold at once.

### A1 — Never imply a cure or a miracle 🔴
There is no cure; the goal is a changed *relationship* with stammering. Every
major body agrees (NSA; ASHA: "no valid cures"; STAMMA: "no miracle cure"; TISA:
"no medical cure"). Banned: "cure," "fix your stutter," "eliminate stuttering,"
"stop stuttering forever," "overcome it for good," "guaranteed fluency," "speak
perfectly," "miracle," "breakthrough that ends." Banned therapy/product claims
(NSA red flags): "we'll get rid of your stuttering," "I'll teach you to hide it."
**India context:** be alert to predatory "cure clinics" and miracle remedies
(e.g. Ayurvedic "cure in 12 sessions"); TISA warns members never to fall for "the
word cure by misleading advertisements."
- ❌ "The proven way to cure your stammer." / "Become 100% fluent."
- ✅ "Practice changing your relationship with stammering." / "Speak on your terms."

### A2 — Do not make fluency the success metric 🔴
Measuring/celebrating fluency reinforces the perfectionism and shame that keep
people stuck. Independent backing: NSA — "frequency of stuttering is not a
meaningful measure of progress"; ASHA — "increasing fluency may not be a goal …
or may be only one aspect of a comprehensive … approach." Success = **approach,
disclosure, avoidance reduced, risks taken, eye contact, situations entered.**
Fluency may be a side effect, never the headline number.
- ❌ A dashboard tile "Stutter-free streak: 6 days," a `fluencyScore`, an event
  `fluency_improved`, "you stuttered 0 times today!"
- ✅ "Feared calls made: 4," "Times you disclosed," "Words you didn't swap,"
  `approachScore`, event `feared_situation_entered`.

### A3 — Frame stammering as something to approach, not avoid or suppress 🔴
Don't recommend the folk "remedies" every author debunks: "take a deep breath
first," "slow down," "think before you speak," "relax," "just push through,"
"don't stutter." These increase self-consciousness and avoidance.
**Technique vs. metric nuance:** easy onset, light contact, pull-outs, and a user
*wanting* easier speech are legitimate; the violation is the cure/metric/shame,
not the technique. Likewise, the folk *command* "slow down/relax" is banned, but
an SLP teaching controlled rate as a clinical technique is fine — it's the
unsolicited command, not rate work itself.
- ❌ "Take a deep breath and the words will come."
- ✅ "Move forward through the block — stammer easier, not less." / "Stammer on
  purpose to drain the fear."

### A4 — No shame, no defect framing (and no toxic positivity) 🟡→🔴
Never position stammering as a flaw, weakness, embarrassment to hide, or
something "wrong" with the person. But don't swing the other way either: don't
force "pride" or cheerlead. Validate the hard parts; permission over prescription
("you're allowed to exist in the in-between").
- ❌ "Don't let your embarrassing stammer hold you back." / "Just love your stammer!"
- ✅ "Your stammering is part of you, like your eye colour — it doesn't define you."

### A5 — Normalize relapse 🟡
Treat setbacks as expected and non-verdictive; progress is non-linear (TISA,
ASHA). Design for re-entry, not punitive streaks. Maintenance is lifelong and
low-dose.
- ❌ "Don't break your streak!" / "Relapse means starting over."
- ✅ "Setbacks are part of the path — here's your re-entry plan."

### A6 — Honest tone; complementary to care; app-honesty 🟡
Invitation and partnership, never guarantees. The model: a clinician saying "I
don't know how fluent you'll become — let's work together and see." Speechworks
is an **app**: never sell it as a cure or a universal fix, and never as a
replacement for an SLP or for human connection. STAMMA on apps/devices: they
"won't cure stammering" and are "helpful for some people but not others." Point
users to qualified SLPs and to community.
- ❌ "In 30 days you'll never block again." / "The only tool you'll ever need."
- ✅ "We'll find out what's possible for you, together — alongside your SLP and
  community."

### A7 — Cause accuracy 🔴
Never imply stammering is caused by, or fixable via, nervousness, anxiety, weak
will, bad parenting, trauma, or low intelligence. It has a neurological/genetic
basis (brain wiring; genetics and brain-imaging research). Caveat: *debunking*
these myths ("stammering is not caused by nervousness") is good content; only
*asserting* them is the violation — the grep hits both, so judgement applies.

### A8 — No war/battle metaphors 🟡
Don't frame stammering as an enemy to conquer, defeat, beat, fight, attack, or
overcome (STAMMA explicitly rejects "overcome/defeat"; the 2008 source book uses
this combative language — we don't). The iceberg *image* is fine; the combative
*verbs* are not.
- ❌ "Conquer your stammer." / "Beat your block."
- ✅ "Work with your stammering." / "Ease the struggle around it."

### A9 — Self-determination, balanced 🟡
The user defines success. Don't push fluency *and* don't push acceptance/pride as
the only valid path. Validate both people who want fluency tools and people who
want acceptance (many want both). Never frame wanting fluency as "internalized
ableism," nor acceptance as giving up. Explore the deeper goal behind "I want to
stop stammering" (confidence? interviews? less avoidance?). Goals can change over
time, and that's normal.

---

## B. Voice & framing

### B1 — Peer authority + lived experience 🟡
The brand's power is "from people who've been through it." Foreground that people
who stutter and the SLPs beside them are behind Speechworks; never a faceless AI
or a detached expert lecturing down.

### B2 — Concrete lived detail over abstraction 🔵
The strongest existing copy is specific ("people who rehearse ordering coffee,"
"people who avoid saying their own name"). Prefer the avoidance-mindset detail to
generic uplift.

### B3 — The AI Coach is a companion, not a judge 🟡
Frame it as the trusted companion / "portable laboratory" for the 167 hours
between sessions — the one who walks into the feared situation with you. Not a
scorer of failures. Adversarial-pressure features must pair each rep with a "win
= you stayed in it" debrief that disproves the catastrophe.

### B4 — Know the audience; don't treat people who stutter as a monolith 🔵
Know who a piece addresses — adult person who stutters, teen, parent, educator,
employer, or SLP — and tailor to it. Respect individual difference; avoid
one-size-fits-all messaging. (Keep this lean — no heavy DEI apparatus.)

### B5 — Disclosure is not an apology 🟡
Disclosure ("advertising") creates understanding and, in India especially, is
empowerment — e.g. naming it up front in an interview frees energy for competence
(TISA). Never frame it as an apology or a warning that something is wrong.
- ❌ "Sorry, I stutter." / "Forgive me for my speech."
- ✅ "I stutter — give it a minute." / "I stammer; I might pause, and that's fine."

### B6 — You are not alone / community 🔵
Surface peer connection and community (NSA: "if you stutter, you are never
alone"; TISA self-help groups). Counter isolation. Don't position the product as
a substitute for human connection.

### B7 — Listener-facing content 🟡
For copy aimed at listeners / parents / educators / employers: maintain eye
contact, don't finish words, don't say "slow down / relax / take a breath," and
**ask the person what helps**. Don't make the listener's comfort the speaker's
burden.

### B8 — Media & representation 🟡
Don't mock stammering or use it for comic relief or villainy (TISA's objection to
*Golmaal 3* is the cautionary case). Show people who stammer in all contexts —
not only "overcoming" or inspiration-porn narratives (STAMMA; see C3).

---

## C. Language & terminology

### C1 — Carry both spellings 🔵
Always use BOTH "stuttering" (US) and "stammering" (UK/India — the dominant search
term for this audience) in SEO-facing copy. Indian-English default is
"stammering"; the Hindi term is "haklana / हकलाना" — use where audience-
appropriate. (See the seo-keyword-strategy memory.)

### C2 — Respectful person reference; respect self-identification 🟡
"person who stutters" / "people who stutter (PWS)" is the safe, preferred default
in Speechworks' own voice. But respect how a person identifies: never "correct"
someone who calls themselves a "stutterer" (reclaimed/identity-first is valid),
and mirror a featured person's own language. Never "sufferer," "afflicted,"
"victim," "disabled by," or "broken."

### C3 — No othering or pity 🟡
Don't frame people who stutter as objects of sympathy or inspiration-porn.
They're the protagonists, not cautionary tales.

### C4 — Difference, not disorder 🟡
Default to "difference" or "condition" (STAMMA: "difference not defect"; ASHA
notes many prefer neuroaffirming language). Reserve "disorder" / "fluency
disorder" for clinical or SLP-facing contexts. Flag pathologizing framing.
Caveat: "difference" must not be used to *deny* the real neurobiology (see A7) —
both are true.

### C5 — Words to avoid (STAMMA, RCSLT-endorsed) 🟡
STAMMA's editorial guidance ("stammering is how some people talk. End of.") bans:
"suffer from / afflicted by," "terrible / debilitating stammer," "overcome /
defeat your stammer," using stammer/stutter as a metaphor for failure ("the
project stuttered"), and "really bad today" for a hard speaking day. Prefer "they
stammer," "a difference," "the way some people talk."

### C6 — Brand name: Speechworks 🟡 (strict)
The brand is **Speechworks** — one word, capital S only, the rest lowercase. Flag
every other casing: `SpeechWorks`, `Speech Works`, `Speech works`, and a stray
lowercase `speechworks` in prose. Lowercase is fine ONLY in URLs/domains
(`speechworks.app`), code identifiers, and the GitHub slug `speech-works`.

### C7 — Plain, honest, appropriately-uncertain claims 🔵
Lived-experience-meets-evidence. When asserting clinical fact, ground it. Avoid
hype adjectives ("revolutionary," "magical"). Reflect real uncertainty: the
pride / "stuttering gain" research is promising but still emerging; fluency
therapy has mixed psychological outcomes. Don't overclaim either side.

---

## D. India context

The audience is India; the brand uses "stammering." Beyond C1's spelling rule:

- **Acknowledge real stigma when relevant** — family and marriage pressure (acute
  for women), and employment/interview discrimination — without melodrama or pity
  (ties to C3).
- **Predatory cure clinics** are a live local harm (A1) — copy should never echo
  their "cure in N sessions" promises.
- **Lead with acceptance + peer/community** (the TISA model), given that therapy
  access is uneven; frame disclosure as empowerment for interviews (B5).
- **Stay secular and inclusive**, and keep Speechworks **neutral on the contested
  "is stammering a disability under Indian law" question** — center agency, not a
  political stance, and neither erase real discrimination nor lean on pity.

---

## E. Code-specific checks

Apply A1–A2 to code as strictly as to copy — names ship as product.

- **Metric / KPI / variable / function names:** flag `fluency*`, `stutterFree*`,
  `*Score` tied to fluency, `errorCount`, `mistakes`, `failures` for speech.
  Prefer `approachScore`, `situationsEntered`, `disclosures`, `avoidanceDelta`.
- **Analytics / event names:** flag `fluency_improved`, `stutter_detected`,
  `clean_run`. Prefer `feared_situation_entered`, `voluntary_stutter_practiced`,
  `disclosure_rehearsed`.
- **Dashboard tiles / progress UI:** flag any chart trending fluency or
  stutter-count as the hero metric (A2; NSA/ASHA: frequency is not progress).
- **AI Coach / LLM system prompts:** the coach must not be instructed to score
  fluency, "correct" stutters, reward stutter-free runs, position the app as a
  cure or therapist-replacement, or simulate cruelty without a reframing debrief.
  It should reward approach, disclosure, and staying in the situation. Check both
  the prompt and any rubric/grading schema.
- **Copy embedded in code** (button labels, toasts, empty states, errors): run
  through sections A–D. A toast "Great — no stutters detected!" is a 🔴.
- **Schema field names / enums** (e.g. Sanity post tags, content types): tags
  like `cure`, `fluency-hacks` are 🟡; prefer `acceptance`, `disclosure`,
  `voluntary-stuttering`, `avoidance`, `lived-experience`.

---

## F. Output format

Report as a findings table, most severe first:

| # | Severity | Location | Issue | Why it matters | Suggested fix |
|---|----------|----------|-------|----------------|---------------|

Then a one-line verdict: **ship / fix-then-ship / do-not-ship**, and offer to
apply the fixes. If nothing fires, say "Clean against guardrails" and list any
🔵 notes.

---

## Quick reference — red-flag patterns to grep

```
# Cure / miracle (A1) — almost always 🔴
cure|miracle|breakthrough|guaranteed|forever|100% ?fluen|perfect(ly)? fluent|eliminate stutter|stop stuttering|overcome.*for good
# (tie "100%" to fluency — bare "100%" matches CSS widths and is noise)

# Fluency-as-metric (A2) — 🔴 in code & dashboards
fluency.?score|stutter.?free|clean.?run|fluency_improved|stutter.?detected|no stutters|0 stutters|streak

# Folk remedies (A3) — 🟡/🔴 (clinical rate-work is fine; the unsolicited command is not)
take a (deep )?breath|slow down|think before you speak|just relax|push through|don'?t stutter

# Cause myths (A7) — debunking is fine; asserting is the violation
caused by (nervous|anxiet|stress|trauma|bad parenting)|because (you'?re|they'?re) nervous|lack of confidence causes

# War / battle metaphors (A8)
conquer|defeat|\bbeat (your |the )?stutter|fight (your|the)|battle|\battack(ing)? (your|the)? ?stutter|overcome (your )?stutter

# Disclosure-as-apology (B5)
sorry,? (that )?i stutter|apolog(ise|ize).*(stutter|speech)

# Replacement / cure-app claims (A6)
replace(s)? (your )?(therapist|slp|speech therap)|instead of (a )?(therapist|therapy|slp)|app .*cure|cure .*app

# Shame / defect / pity + STAMMA banned words (A4, C2, C3, C5)
embarrass|ashamed|hide (it|your)|flaw|defect|broken|suffer(s|ed|ing)? from|afflicted|victim|disabled by|debilitating|the .* (stuttered|stammered)

# Brand name (C6) — strict, 🟡
SpeechWorks|Speech [Ww]orks
# (the two-word form can rarely collide with the phrase "how speech works" — judgement applies)

# Missing twin spelling (C1) — note if only one present
stutter (without nearby) stammer   # check both appear in SEO copy
```

Grep is a first pass only — judgement always wins over a keyword hit. In
particular: a reclaimed first-person "stutterer," a myth being *debunked*, clinical
rate-work, and the literal phrase "how speech works" are not violations.
