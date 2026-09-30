# Faith — Equivalent Fraction Mirror Quest

Static interactive Wonderland lesson rebuilt from the previous **faith fraction 7** site.

## Run

No installation is required.

1. Keep `index.html`, `styles.css`, `script.js`, and `assets/` together.
2. Open `index.html` directly in Chrome/Safari/Edge, or use VS Code Live Server.
3. No backend, npm, database, or API key is required.

## This lesson's mathematical focus

This session intentionally focuses on **equivalent fractions and multiplier meaning only**.

There is **no fraction addition/subtraction** in this build.

The core mental model is:

> multiplier = how many equal jumps/groups of the starting number are needed to reach the target.

Example:

- start at 0
- jump +3: 0 → 3 → 6 → 9 → 12
- 4 equal jumps
- therefore `3 × 4 = 12`
- so `3 needs ×4 to become 12`

## Session flow

1. **Whispering Number Aviary**
   - 5 short multiplication warm-up facts from a safe curated pool
   - every correct fact triggers a large mandatory spoken-retrieval screen
   - selected facts with factors above Faith's automatic range require a second spoken repetition

2. **Jump-to-the-Target**
   - Faith calculates every landing point herself
   - after every landing she answers whether the target has been reached
   - only after reaching the target does she count jumps and see the multiplication sentence / multiplier

3. **Fraction Mirror Workshop**
   - `2/3 = ?/12` with the full jump bridge
   - `3/4 = ?/12` semi-guided
   - `3/5 = 12/?` missing denominator
   - equivalent / not-equivalent truth detector
   - language stays consistent: **same change upstairs and downstairs**

4. **Alice's Little Stretch Break**
   - true 15-second break
   - Alice stretching asset supplied for this lesson
   - reach up → roll shoulders → shake hands → one breath
   - break does not auto-advance; teacher/student clicks Ready

5. **Alice's Fraction Repair Shop**
   - one game-based self-practice sequence, not a separate mini-game hub
   - Cake Card Repair
   - Door Lock
   - Playing-Card Family
   - Potion Mistake
   - Fraction Machine
   - later items hide jump support unless `Help Alice` is used

6. **Alice's Garden Tiles — Geometry Dessert**
   - area by tapping all unit squares inside a 4×3 garden
   - perimeter by tracing all 14 outside unit edges
   - compare 3×4 and 2×6 gardens: same area, different perimeter

7. **Exit Snapshot**
   - two tiny student checks
   - teacher I / V / T support tracker
   - copyable session summary

## Teacher controls

### Cover
Returns to the chapter map at any time.

### `t` Teacher Pass
Small teacher-only shortcut in the top-right. It passes the current chapter/checkpoint so the live Zoom lesson is not trapped by a slow activity.

### Teacher Unlock Everything
Available on the cover for previewing all chapters.

### Focus Stars
Appear only during teacher-led Jump and Fraction lessons. The teacher can subtract focus. At zero, Cheshire Cat shows a short second-chance reset.

### Hearts
Appear only during self-practice. Wrong answers and full visual hints can cost a heart. At zero, only the **current station** restarts.

## Spoken retrieval ritual

A correct multiplication answer never auto-advances.

The site shows the whole fact in very large text, for example:

`3 × 4 = 12`

Faith should read it aloud and click `I said it!`.

For targeted/non-basic facts, the site then says that the Wonderland birds were noisy and asks Faith to repeat the same fact before Next unlocks.

The site deliberately does **not** use speech recognition; the teacher can hear the spoken rehearsal on Zoom without adding recognition errors or delay.

## Important build choices

- stacked fraction notation in student-facing equations
- no scroll-to-future-quest progression
- safe curated number pools rather than unrestricted random math
- large, high-contrast critical prompts
- optional multiplication Helper Book remains available during fraction practice
- support fades from full jump path to optional help
- no stressful speed timer
- geometry is Grade-4 reasoning, not basic shape naming

## Assets added in this version

- `assets/alice-stretch.png`
- `assets/white-rabbit-cheer-new.png`

All previous Wonderland background / character / UI assets remain local.
