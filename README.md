# The Cabinet

A curated introduction to Gordon Bellamy’s creative collaborations with people and AI. The original collection was built by Gordon Bellamy and Darby; the public collection credits also include Astra. Individual projects retain their own credits.

Live: https://gordonusc.github.io/the-cabinet/

## Edit and build

`projects.json` is the canonical editorial catalogue: 44 retained destination records: 39 curated experiences and five related links, in seven collections, original title/category aliases, destination URLs, contextual labels, featured copy, and three exploration routes. Keep existing IDs and destination URLs when changing display titles. Counts are derived from the catalogue; related editions, alternate URLs, invitations, and research companions are nested links rather than extra experiences. The earlier Good Company tour is retained separately as a related collection link.

Edit page structure in `cabinet.template.html`, then run:

```sh
node scripts/build-cabinet.cjs
node scripts/build-cabinet.cjs --check
```

The build generates `index.html`, including the complete static directory and its embedded catalogue. The page needs no runtime data fetch. Without JavaScript, every collection, experience, and related link remains available. Do not edit the generated index independently.

## Discovery and compatibility

The default order is By collection; `?sort=az#projects` selects Name A to Z. Search covers current and original titles, project purpose, types, and people aliases. Clearing search and collection keeps the selected sort.

Current `room` values are `play`, `design`, `music`, `learn`, `people`, `sport`, and `ai`. Saved links using `arcade`, `afterdark`, `classroom`, `record`, `mission`, `workshop`, or `stadium` still select their original category membership, shown as a saved category.

Explicit exploration routes preserve the existing keys:

- `?adventure=lift#adventure`: Play and make sound.
- `?adventure=company#adventure`: Design made personal.
- `?adventure=curiosity#adventure`: Look, learn, explore.

Routes display named projects and actions; they are not random recommendations. Copying retains search, collection, sort, and `for=cale` where present. A selectable link is provided when clipboard access is unavailable. The Cale parameter retains the personal invitation and personalized Island Hop / Shows with Friends destinations.

## Checks

```sh
JSDOM_PATH=/absolute/path/to/node_modules/jsdom node tests/discovery.cjs
```

The suite checks canonical rendering, counts, titles and destinations, grouped/alphabetical order, search aliases, legacy categories, route contents, copy success/fallback, recipient links, no-results/clear, and history restoration. Browser visual and destination-interaction checks are separate from the DOM suite.
