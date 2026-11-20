# Francesco review branch

This branch applies Francesco Pezzotti's November 20 design feedback to the existing Student, Educator, Donor and GGP Match prototypes. It is for private integration review, not deployment. Do not publish it or grant repo access to a reviewer.

- Start with compact discovery: stage and category controls, search, and secondary filters on demand. Replace numerical pages with incremental results.
- Use labels and icons (not color alone) to make card categories legible; eligibility, timing and provider evidence still matter.
- Give Programs, My Giving, Public Giving, and News first-class Donor destinations; preserve three-program comparison and existing links.
- Keep Match primary. Teach the gesture at the deck, provide explicit buttons, and group deck counts with the filters. Keep Your Matches, Give, Play, and Explore separately addressable.
- Offline review copy: `review/index.html` and `review/art/`. This is a separate interaction prototype with fictional records, no live payments or write requests. It is not a build of the real catalog, and is the only surface intended for external review.

Art direction: Higgsfield generated compact map artwork for the review hero; Adobe Firefly generated a warmer Donor variant; Canva supplied a reference-only landscape direction. Generated assets did not use real profile or donor data.

QA: syntax and route/state smoke tests passed in the changed source; the offline review copy was additionally exercised in Chrome at desktop and narrow widths. Do not infer launch readiness: Darby should check the actual merged view behavior on phone and desktop, touch swipe, keyboard, screen reader announcements, older URLs, visual contrast, and no accidental live writes. No main merge, deployment, visibility change, or real-record sharing.
