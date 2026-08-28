---
name: BrandFluence AI — La hoja calificada
description: The landing surface's world: bond paper torn out of ink, one grey, coral only where something is corrected.
colors:
  canvas: "#0B0B0C"
  paper: "#F0EDE4"
  print: "#131316"
  pencil: "#63615C"
  accent: "#FF3B4F"
  accent-hover: "#FF5566"
  accent-print: "#C81C2E"
typography:
  score:
    fontFamily: "Big Shoulders, Arial Narrow, Helvetica Neue Condensed, Arial, sans-serif"
    fontSize: "clamp(4.5rem, 12vw, 9.5rem)"
    fontWeight: 800
    lineHeight: 0.78
    letterSpacing: "-0.04em"
    fontFeature: "tabular-nums"
    fontVariation: "optical sizing auto"
  display:
    fontFamily: "Big Shoulders, Arial Narrow, Helvetica Neue Condensed, Arial, sans-serif"
    fontSize: "clamp(2.5rem, 5.5vw, 4.25rem)"
    fontWeight: 700
    lineHeight: 0.94
    letterSpacing: "-0.025em"
    fontVariation: "optical sizing auto"
  body:
    fontFamily: "Faustina, Georgia, serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: "Martian Mono, ui-monospace, monospace"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "0.04em"
    fontFeature: "tabular-nums"
    fontVariation: "width 80%"
rounded:
  none: "0"
  button: "100px"
  button-hover: "12px"
spacing:
  gutter: "1.25rem"
  row: "1.75rem"
  block: "2.5rem"
  section: "4rem"
  section-lg: "6rem"
components:
  cta-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.print}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    roundedHover: "{rounded.button-hover}"
    padding: "0 1.75rem"
    height: "3.25rem"
  cta-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.print}"
  cta-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    roundedHover: "{rounded.button-hover}"
    padding: "0 1.75rem"
    height: "3.25rem"
  cta-secondary-hover:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.print}"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    roundedHover: "{rounded.button-hover}"
    padding: "0.625rem 1rem"
  nav-link-hover:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.print}"
  paper:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.print}"
    rounded: "{rounded.none}"
    padding: "1.75rem"
  paper-row:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.print}"
    rounded: "{rounded.none}"
    padding: "1.5rem"
  stamp:
    backgroundColor: "transparent"
    textColor: "{colors.accent-print}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.25rem 0.625rem"
  marquee:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.print}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.75rem 0"
---

# Design System: BrandFluence AI — La hoja calificada

> **Scope boundary. This file documents one surface's world and nothing else.**
> It describes the landing route `/`, the components under `src/components/landing/`,
> and the second `@theme` block in `src/app/globals.css` (the one opening at the
> comment "La hoja calificada").
>
> This project deliberately carries **two visual systems at once**. The incumbent
> **dark panel system** — tokens `--color-canvas`, `--color-surface*`, `--color-line*`,
> `--color-ink*`, the data palette `--color-data-1..4`, the radius scale
> `--radius-chip/tile/card/pill`, and Plus Jakarta Sans — governs `/dashboard` and
> the rest of the application, and is **not documented here**. Nothing in this file
> is a rule for the panel, and no panel token is a rule for this surface. The two
> systems share exactly three things: the ink ground `#0B0B0C`, the UI coral
> `#FF3B4F` (with its hover `#FF5566`), and the film-grain overlay on `body`.
>
> Product truth lives in `PRODUCT.md`; it is not repeated here.

## Overview

**Creative North Star: "The Graded Sheet"**

A page of bond paper, torn out and laid on ink, carrying a mark that has already
been graded. The surface behaves like a marked-up document rather than a product
page: the score is the largest thing on it, every component of that score is
itemised on the sheet, the shortfall is written next to the total, and one
campaign is struck through in red because it never qualified. The reader is
auditing, not being pitched.

The material logic is two-part and absolute. **Ink is the ground; paper is the
only place content lives.** Every block of reading matter sits on a torn sheet of
`#F0EDE4`; the ink ground carries only headings, the two calls to action, and the
footer line. The paper is *cut out*, never *lifted*: no sheet carries a radius,
nothing on the surface carries a shadow, and the separation between sheet and
ground comes entirely from the material contrast plus the ragged SVG-displaced
edge. The buttons are the one exception to the radius, and they own it alone.
Sheets sit at small off-square rotations (−0.9°, −0.5°, −0.3°, +0.7°, +0.9°) because a sheet
resting on a desk never lands straight.

Density is generous and asymmetric. Nothing on the page is centred — not the
hero, not the headings, not the buttons, not the closing call. The first viewport
puts the graded sheet on the left and the two-line lowercase headline plus its
two buttons on the right, and every later section keeps one heavy side. The
confirmed anti-reference is the thing the whole category ships: a centred grid of
four component cards presenting a score. This page itemises the same four
components as rows on a sheet instead.

**Key Characteristics:**

- Bond paper cut out of near-black ink; content only ever on paper.
- Exactly three type sizes on the entire page, and no fourth.
- One grey, and it is for paper only.
- Coral appears only as a correction mark or as the final call.
- Zero shadows and zero raster assets. Radius exists only on the buttons.
- Ragged sheet edges from a single shared SVG displacement filter.
- Three motions only: a scroll reveal, one CSS marquee, and an ink-only mesh ground fixed behind the whole page.

## Colors

Five materials: ink, paper, print, one pencil grey, and a coral that exists in
two densities — one for screen, one for paper.

### Primary

- **Correction Coral** (`{colors.accent}`): the UI coral, used only on the ink
  ground where the paper's legibility rules do not apply: the primary CTA fill
  (with printed ink as its text, never white), the rubric marquee band above the
  closing call, `::selection`, the caret, the scrollbar thumb, and every
  `focus-visible` outline. **Hover** (`{colors.accent-hover}`) is its only state
  variant.
- **Printed Coral** (`{colors.accent-print}`): the same coral, darkened until it
  reaches AA on bond paper (4.87:1 against `#F0EDE4`; the UI coral manages only
  2.8:1 there). This is **not a second accent** — it is the paper-legible
  printing of the one accent, and it carries every correction mark on a sheet:
  the strikethrough bar, the "faltan …" deficits, the failed hard-filter line,
  the underline beneath each decision title, and the stamp border.

### Neutral

- **Ink** (`{colors.canvas}`): the ground the whole surface is torn out of. Flat
  — the landing explicitly cancels the panel's radial glow via
  `body:has(.hoja-calificada)`, keeping only the film grain.
- **Bond Paper** (`{colors.paper}`): every sheet. It is also the *ink* for the
  small amount of text that sits directly on the ground — headings, CTA labels,
  body lead paragraphs, the footer line.
- **Printed Black** (`{colors.print}`): everything printed on paper (15:1),
  including the score itself, the row values, and the score-sheet bars. Also the
  text colour on top of coral fields.
- **Pencil** (`{colors.pencil}`): the single grey. Secondary text on paper —
  units ("de 40", "/25"), the candidate's name and meta, explanatory prose under
  each audited row. 5.2:1 on paper.

### Named Rules

**The One Grey Rule.** There is exactly one grey and it is `{colors.pencil}`. A
five-step grey ramp is what turns a printed document into a dashboard; do not add
a second.

**The Grey Is For Paper Rule.** Pencil is legible on paper and nowhere else — on
ink it falls to 3.16:1 and fails AA. When text on the ink ground needs to recede,
it does not go grey: it stays paper and recedes by weight and position. The
footer line is the canonical instance.

**The Correction Mark Rule.** Coral appears only where something has been
corrected — a deficit, a strikethrough, a failed threshold, an underline, a stamp
— and in the final call to action. It is never decoration, never a section
divider, never a left border on a callout.

**The Two Densities, One Accent Rule.** `{colors.accent}` on ink,
`{colors.accent-print}` on paper. They are the same accent at two printing
densities, chosen by ground and by contrast. Never use the UI coral as text on
paper.

**The Mirrored Token Rule.** Every colour in this system exists twice on purpose:
in the `@theme` block of `src/app/globals.css` and in `src/lib/design-tokens.ts`.
The TypeScript mirror exists because a future Expo app cannot read CSS custom
properties. **A colour change that lands in only one of the two files is a
defect.** Change both, in the same commit.

*The one exemption:* `inkWash` — the four-step ink ramp `#0B0B0C`, `#232329`,
`#3D3D46`, `#55555F` — lives **only** in `src/lib/design-tokens.ts`. It is passed
to the shader ground as JavaScript props and no CSS rule reads it, so there is
nothing to mirror. Do not "fix" this by declaring matching custom properties in
`globals.css`; they would have no consumer.

The ramp is deliberately wide — it began three times narrower and could not be
seen — and **its top step is capped by contrast, not by taste.** Paper text
(`#F0EDE4`) on `#55555F` measures 6.0:1, so headings over the ground still pass
AA at the brightest moment of the animation. Any future widening has to hold that
measurement.

## Typography

**Display Font:** Big Shoulders (with `Arial Narrow`, `Helvetica Neue Condensed`,
`Arial` — a hand-declared condensed fallback, since Next has no substitution
metrics for this face)
**Body Font:** Faustina (with Georgia, serif)
**Label/Mono Font:** Martian Mono (with `ui-monospace`, monospace), always at
80% width axis

**Character:** A signwriter's condensed grotesque set in true lowercase against a
warm text serif, with a narrowed monospace doing all the labelling. It reads as a
grading sheet: a hand-lettered number, typed annotations, and printed prose.

### Hierarchy

Four roles, **three sizes**. Body and Label are the same size; they differ only
by face and case.

- **Score** (Display face, 800, `{typography.score.fontSize}`, line-height 0.78,
  tabular figures, tightened −0.04em): the one thing on the page allowed to break
  scale. Used for the match score itself and nothing else.
- **Display** (Display face, 700, `{typography.display.fontSize}`, line-height
  0.94, lowercase): the h1 and every section h2, always in lowercase, plus the
  struck-through campaign name. Optical sizing is automatic — do not compensate
  weight by hand at headline size.
- **Body** (Body serif, `{typography.body.fontSize}`, line-height 1.65): all
  prose. Measure is capped by line length, not by container: `max-w-xl` (36rem)
  for explanatory prose, `max-w-md` (28rem) for lead paragraphs under a headline.
- **Label** (Utility mono, same size as body, uppercase, +0.04em, width axis 80%,
  tabular figures): every label, unit, metric, stamp, button, nav link, deficit,
  and the footer line. The 80% width axis is what lets a label sit at body size
  without breaking columns.

### Named Rules

**The Three Sizes Rule.** `--text-score`, `--text-display`, `--text-base`. There
is no fourth size on this surface, at any breakpoint. This is the system's
hardest rule and the easiest to break by accident: any new element inherits one
of the three.

**The No Small Print Rule.** There is no small type. What reads as fine print is
the *same size* as body copy, set in the utility face in uppercase. Rank is
carried by weight, case, face, inversion, and rule — never by shrinking text.

**The Lowercase Headline Rule.** Display-size headings are set lowercase. The
utility face is the only one that goes uppercase.

**The No Kicker Rule.** No eyebrow, kicker, or uppercase category label above a
heading. The build refuses this twice explicitly; a headline stands on its own
and the context goes in the body copy beneath it.

## Layout

A single centred container at `max-w-6xl` with a `1.25rem` gutter holds the whole
page, but nothing *inside* it is centred. Content is arranged on asymmetric
two-column grids with a deliberate heavy side: the hero splits 5fr / 7fr (sheet
left, headline and buttons right) and the struck-campaign section splits 4fr /
8fr (heading left, sheet right). Below `lg` both collapse to one column; in the
hero the DOM order flips so that on a phone — where the sheet occupies a full
screen — the promise and its two buttons come first and the evidence follows.

The vertical rhythm is coarse and repetitive: sections run `4rem` of padding,
`6rem` from the `sm` breakpoint up. Column gaps are `3rem` / `4rem`. Sheet
padding is `1.75rem`, `2.25rem` from `sm` up, and list-style sheets drop their
own padding to zero so each row can carry it (`1.5rem`, widening to `2.25rem`
horizontally at `sm`). Sheets always keep interior padding away from the edge
because the tear eats into it.

Buttons on the ink ground stack vertically below `sm` and are pinned to
`items-start` in the hero so they never stretch full-width with a centred label —
that would be the first centred thing on the page. The surface is usable down to
360px.

**The Nothing Centred Rule.** No centred headline, no centred button row, no
centred section. If an element looks balanced left-and-right, it is wrong for
this world.

**The Sections Are Ruled, Not Filled Rule.** A section separates itself from its
neighbours with hairline rules (`border-y`, paper at 10%), never with an opaque
background fill. One section carried `bg-canvas` and cut a solid band across the
middle of the page, blanking the shader ground behind it; the fill was removed
and the rules kept. Anything opaque and full-bleed erases the ground.

## Elevation & Depth

**There are no shadows on this surface at all, and no radius on any
container.** Depth is material, not optical: a sheet reads as sitting on top of the ground because bond
paper against near-black ink is a 13:1 material jump, because its edge is torn
rather than machined, and because it is rotated a fraction of a degree off
square. Nothing is ever lifted.

Two ambient layers run the full length of the page. The ink ground is flat — the
landing cancels the application's radial glow through the
`body:has(.hoja-calificada)` override, because that glow was both raising the
first viewport toward `#161617` and acting as a centred light source on a page
whose contract says nothing is centred. The film grain stays: a fixed
`feTurbulence` noise layer at 3.5% opacity above all content, `pointer-events:
none`, which breaks flatness and kills banding without touching legibility.

A third layer sits behind **the whole page**: an animated WebGL mesh gradient
(`ShaderGround`) on a viewport-fixed canvas at `z-0`, with every direct child of
the page root lifted to `relative z-10` above it. It is not elevation — it is a
slow wash inside the ground itself, in ink only, and the sheets above it separate
exactly the way they do everywhere else. See Components → Shader Ground.

**The Cut, Not Lifted Rule.** A surface separates from the ground by material
contrast and a torn edge. Never by a shadow, a glow, or a translucent overlay.
A radius is not a separation device either: the buttons carry one because a
control is a manufactured object, not a torn one, and no container may borrow
it to fake depth.

## Shapes

**Radius is 0 on every container.** Sheets, rows, stamps and the marquee band
are square, and the frontmatter's `none` step exists so that referencing zero is
explicit rather than accidental.

**The buttons are the exception, and the only one.** They carry
`{rounded.button}` at rest and close to `{rounded.button-hover}` on hover and
focus. This was Daniel's decision on 28/08/2026, taken against the rule this
section used to state; it is recorded here rather than argued with. The reason
it holds together: a control is a manufactured object and a sheet is a torn one,
so the radius reads as the difference between the two rather than as a lapse. It
does not travel — a container that borrows it is a regression, and so is a
radius used to imply depth (see The Cut, Not Lifted Rule).

The one irregular form is the **torn sheet**. A single SVG filter (`#rasgado`,
declared once per document by `TornDefs` and consumed by every sheet through
`filter: url(#rasgado)`) drives a `feDisplacementMap` from fractal noise with a
deliberately asymmetric `baseFrequency` (`0.012 0.09`) at scale 8. Equal axes
produce a regular scallop that reads as a stamp; the much higher vertical
frequency breaks the fibres at different scales per direction, which is what
reads as hand-torn. **The filter is applied only to a sheet's absolutely
positioned background layer, never to its content** — the same displacement that
ruins a straight edge would make a paragraph illegible.

Rules are the second form language, and they are graded by weight:
`1px` at 20–25% print for row separators and the dotted-leader line; `2px` solid
for a total's rule, a decision's underline, the stamp border, and the outlined
button; `3px` for the strikethrough; `5px` for a score bar.

Rotation is part of the form: sheets sit between −0.9° and +0.9°, the "ejemplo"
stamp at −2°, the strikethrough at −1.4°.

## Components

### Buttons

- **Shape:** a pill at rest (`{rounded.button}`) that closes to
  `{rounded.button-hover}` on hover and focus, over 320ms. Fixed height
  `3.25rem`, horizontal padding `3rem` to clear the arrows, label set in the
  utility face (uppercase, body size).
- **Primary:** coral field with **printed ink as the label**, never white — white
  on `{colors.accent}` reaches only 3.5:1. Hover floods the fill to
  `{colors.accent-hover}`; the ink label stays put through both states.
- **Secondary / Ghost:** a `2px` paper stroke with paper text and no fill. Hover
  floods a solid paper field in and turns the label to printed ink. The header's
  "entrar" link is the same treatment at a smaller padding.
- **The flood.** The hover fill does not swap, it arrives: a circle scaled from
  `0` to full over 220ms, centred on the `--x` where the pointer entered, or on
  the button's centre when the focus came from the keyboard. It is a `transform`,
  never an animated `width`, and the button's `overflow: hidden` clips it to the
  current radius.
- **The arrow relay.** Two authored arrows — 2px stroke, square caps, mitred
  joins, `currentColor` — cross the button in 320ms with a slight overshoot: the
  resting arrow leaves past the right edge while its twin enters from the left
  and lands where the first began. The label itself never moves.
- **Focus:** a 2px coral outline at 2px offset (`focus-visible` only), on every
  interactive element including the footer link. Focus also runs the flood and
  the relay, so the button answers a keyboard exactly as it answers a pointer.
  **Active:** a 1px downward nudge. No other state exists.

### Cards / Containers (`Paper`)

The only container in the system, and it is not a card — it is a sheet.

- **Corner Style:** none. Zero radius, torn edge.
- **Background:** bond paper, painted on a separate absolutely positioned layer
  so the tear filter never touches the text.
- **Shadow Strategy:** none. See Elevation & Depth.
- **Border:** none. The edge *is* the tear.
- **Internal Padding:** `1.75rem` / `2.25rem` at `sm`, or zero when the sheet is
  a list and each row carries its own.
- **Rotation:** a caller-supplied fraction of a degree, default 0; in practice
  under 1° in either direction.

### Navigation

A single header row: the logotype on the left, one outlined utility-face link on
the right whose label states exactly what happens ("entrar" or "ir al panel").
There is no nav menu, no mobile drawer, no tagline under the logo — the tagline
is the headline, and saying it twice in one screen devalues it.

### Score Sheet (signature component)

The object the page exists to be remembered by: a sheet carrying a stamp, the
subject's identity in pencil, the score at the page's largest size, four
component rows with bars, and the total shortfall.

- **The bars have no track.** A grey track behind each bar turns the breakdown
  into a dashboard; without it they are four printed strokes of different
  lengths, which is what a report card has.
- **Bars are measured against the shared ceiling** — the largest of the four
  maxima (40), not each against its own. Normalised individually, 40-of-40 and
  10-of-10 draw the same length and the 40/25/25/10 weighting the page exists to
  audit becomes invisible.
- **Each bar carries a tick at its own ceiling** (`1px`, 13px tall, print at 50%,
  centred on the ceiling position). The gap between the end of the bar and its
  tick *is* the deficit, drawn.
- **Bars weigh `5px`**, deliberately heavier than the 1–2px separators, and they
  always occupy their own line. Both facts exist so a bar can never be misread as
  a rule of the sheet.
- **The deficit is always shown**, per row ("/25") and in total ("faltan 10,67
  puntos", in printed coral above a hairline). A sheet that only states what you
  have is a medal; with the shortfall it is a grade with feedback.
- **The stamp**: a rotated (−2°) `2px` printed-coral outline in the utility face,
  marking illustrative data as illustrative.

### Marquee

A full-bleed coral band above the closing call, `2px` coral rules top and bottom,
utility-face segments in printed ink separated by a 40%-opacity slash. Two
identical copies translated −50% in pure CSS over 34s linear, infinite, no
JavaScript. It is `aria-hidden` because the same rubric is already read in full
in the audit section. It lives **inside** `@media (prefers-reduced-motion:
no-preference)` rather than relying on the global reduce override, which would
otherwise shorten it to 0.01ms and freeze it mid-travel instead of at rest.

### Shader Ground (`ShaderGround`)

An animated WebGL mesh gradient behind the entire page. It takes no children and
renders once near the top of `src/app/page.tsx` as a viewport-fixed layer; the
page's own structure is flat containers stacked above it. Built on
`@paper-design/shaders-react` 0.0.80 (`MeshGradient`).

- **Ink only, no colour.** Its four steps are `inkWash`, all of them ink. A coral
  field behind the page would turn the accent into decoration and break the
  Correction Mark Rule. Any future shader on this surface inherits this
  constraint: ink only. The top step is bounded by contrast — see The Mirrored
  Token Rule's exemption note.
- **Cost is capped in the component, not left to the library.** The library's
  default is unbounded: measured without a cap, the canvas mounted at 3441×2411
  (8.3 MP) on a `devicePixelRatio` 1 display and the loop ran at **16 fps**. With
  `maxPixelCount={1_600_000}` and `minPixelRatio={1}` it mounts at **1.6 MP and
  52 fps** on a 1440×900 desktop, and **0.44 MP** on a 360px phone at dpr 2.
  Anyone adding a shader here must set these; the default will not.
- **`grainOverlay={0}`** deliberately. The page already paints its own grain in
  `body::after`; the shader's would double it.
- **Motion parameters:** `speed={0.3}`, `distortion={1.1}`, `swirl={0.7}` — raised
  from an earlier, far quieter setting because the ground was not legible as
  motion at all.
- **Under `prefers-reduced-motion` it freezes rather than disappears:**
  `speed={0}` with a fixed `frame={9000}`, so the identical texture renders
  static. `useReducedMotion` from `motion/react` drives it, matching how `Reveal`
  already reads the preference. *This freeze is verified at source level only —
  the browser session could not emulate the media query, so no capture proves
  it.*

**The Ground Is Fixed, Not Tall.** The ground layer is `position: fixed`, so the
canvas never exceeds one viewport however long the page grows. This page is
roughly 4.000px tall; an absolutely-positioned canvas of that height would be
tens of megapixels of WebGL repainting every frame. A full-page background here
is a fixed window onto a moving ground, never a tall canvas.

**The Ground Sits At z-0, Never Below.** The layer uses `z-0` and every direct
child of the page root carries `relative z-10`. A negative z-index does **not**
work: `body` paints its own background colour over any child below zero and the
mesh disappears entirely. This trap has bitten this codebase twice; it is a rule,
not a code comment.

**This ground is an amendment the user made to their own brief**, whose motion
clause had allowed only the reveal and the marquee. It is recorded because it
ships, and it is **not a precedent for further decorative animation.**

### Motion (whole surface)

Exactly three motions exist, and the third was an explicit amendment. No fourth
should be added.

1. **Reveal:** on entering the viewport, 16px up and fade in, 0.5s on
   `cubic-bezier(0.22, 1, 0.36, 1)`, `once: true`, siblings staggered by 0.08s.
   Under `prefers-reduced-motion` it returns its children **unwrapped and already
   visible** — the global CSS override cannot reach a JavaScript animation, and
   without that branch reduced-motion users would wait forever on invisible
   content.
2. **The marquee**, as above.
3. **The shader ground**, as above: the only motion that is decorative rather than
   informational, ink-only, fixed to the viewport, and frozen rather than removed
   under reduced motion.

Reduced motion is honoured three different ways on this surface, once per
mechanism: CSS animation is gated inside `no-preference` (marquee), JavaScript
animation branches and returns children unwrapped (Reveal), and the shader takes
a frozen frame (shader ground). A new motion must pick the branch that matches its
mechanism; the global CSS override alone is never sufficient.

Hover and focus transitions are colour-only.

### Imagery

**This surface ships zero raster assets.** There is no image directory to look
for and no provenance to record. The grain, the torn edges, the strikethrough,
the underlines, the bars, the ticks and the stamp are all CSS and inline SVG.

## Do's and Don'ts

### Do:

- **Do** put every piece of reading matter on a sheet of bond paper, and leave the
  ink ground for headings, buttons and the footer line.
- **Do** stay inside the three sizes (`--text-score`, `--text-display`,
  `--text-base`). A new element inherits one of them.
- **Do** set labels at body size in the utility face, uppercase, width axis 80%.
- **Do** use printed coral on paper and UI coral on ink, chosen by ground.
- **Do** change a colour in **both** `globals.css` and `src/lib/design-tokens.ts`,
  in the same commit.
- **Do** apply the tear filter only to a sheet's background layer.
- **Do** rotate sheets by a fraction of a degree, and keep the heavy side of every
  layout off-centre.
- **Do** show a deficit next to every score, per component and in total.
- **Do** gate any new CSS animation inside `prefers-reduced-motion:
  no-preference`, return children unwrapped for JavaScript animation, and freeze
  a shader on a fixed frame — one branch per mechanism.
- **Do** cap any shader's resolution in the component (`maxPixelCount`,
  `minPixelRatio`); the library default is unbounded and costs ~34 fps here.
- **Do** keep any background field ink-only, fixed to the viewport, and above
  `z-0` with content at `z-10`.
- **Do** separate sections with hairline rules; an opaque full-bleed fill blanks
  the ground.
- **Do** give every interactive element a 2px coral `focus-visible` outline at 2px
  offset.

### Don't:

- **Don't** introduce a fourth type size, and don't shrink text to signal
  secondary rank — use weight, case, face, inversion, or a rule.
- **Don't** add a second grey or a grey ramp, and don't put `{colors.pencil}` on
  the ink ground; it fails AA there.
- **Don't** put `{colors.accent}` as text on paper (2.8:1) or white text on a
  coral field (3.3:1).
- **Don't** use coral as decoration — no coral divider, no coral left border on a
  callout, no coral section header. It marks a correction or it does not appear.
- **Don't** add a shadow anywhere on this surface, and don't fake depth with a
  translucent overlay or a glow.
- **Don't** put a border radius on anything that is not a button. The sheets,
  rows, stamps and the marquee band stay square; the radius is the buttons' and
  does not travel.
- **Don't** put a track behind a score bar, and don't normalise bars against
  their own maxima.
- **Don't** draw a bar at the weight of a rule (1–2px); a measure is 5px and
  carries a tick.
- **Don't** centre a headline, a button row, or a section.
- **Don't** add an eyebrow, kicker, or uppercase category label above a heading.
- **Don't** ship a raster asset onto this surface; the material is CSS and SVG.
- **Don't** add a fourth motion, don't re-trigger the reveal on re-entry, and
  don't read the hero ground as licence for further decorative animation.
- **Don't** let a background field carry colour, grow taller than the viewport
  (use `fixed`), sit at a negative z-index (`body` paints over it and it vanishes),
  or add its own grain on top of `body::after`.
- **Don't** widen `inkWash` past the point where paper text on its brightest step
  drops below AA; `#55555F` measures 6.0:1 and is the current ceiling.
- **Don't** give a section an opaque background fill.
- **Don't** mirror `inkWash` into `globals.css`; it is JS-only by design and the
  custom properties would have no consumer.
- **Don't** apply any rule in this file to `/dashboard` or the rest of the app —
  that surface belongs to the incumbent panel system, which is out of scope here.
