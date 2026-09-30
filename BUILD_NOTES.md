# Build Notes — Faith Equivalent Fractions Update

Base: the uploaded previous lesson site `faith fraction 7.zip`.

This update follows the new equivalent-fractions strategy brief.

## Core shift implemented

The site no longer begins multiplier discovery with an abstract `3 × ? = 12` question.

The new Jump-to-the-Target engine requires Faith to:

1. start at 0;
2. calculate each `+n` landing herself;
3. check after every jump whether she has reached the target;
4. count how many jumps were needed;
5. translate the experience into repeated addition;
6. then reveal `n × jump-count = target`;
7. name the jump count as the multiplier.

## Scope change

Removed from the required route:
- fraction addition
- fraction subtraction
- separate mini-game hub

The session now drills equivalent fractions through different game wrappers while keeping the mathematics stable.

## Major interaction additions

- mandatory spoken-read-aloud modal after every correct warm-up fact
- second spoken repetition for targeted/non-basic multiplication facts
- full build-your-own jump engine
- sequential denominator/numerator attention in equivalent fractions
- missing numerator, missing denominator, truth-check, error repair, and multiplier-gear formats
- 15-second true stretch-break screen using the supplied Alice stretching art
- game-based Fraction Repair Shop
- new Garden Tiles area/perimeter geometry context
- I / V / T teacher observation tracker

## QA checks performed

- JavaScript syntax check (`node --check`)
- HTML duplicate-ID check
- static JS-to-DOM ID audit
- local asset reference check
- math consistency audit for all curated problems
- no fraction add/subtract task remains in the new lesson route
- no unrestricted random equivalent-fraction generator is used

Browser automation was unavailable in the container runtime, so final interaction behavior was additionally checked through static DOM/logic inspection.
