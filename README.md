# THE CABINET
A select screen for the sites Gordon Bellamy and Darby built in the summer of 2026.
Live at https://gordonusc.github.io/the-cabinet/

Local discovery checks: `JSDOM_PATH=/absolute/path/to/node_modules/jsdom node tests/discovery.cjs`. These test DOM behavior, not browser rendering.

The directory supports `?sort=az#projects` as well as its search and room filters. Switching back to “Cabinet order” restores the original order; clearing search/room keeps the chosen sort. Adventures can be reopened with `?adventure=lift#adventure`, `company`, or `curiosity`. The copy control preserves an existing `for=cale` invitation and offers a selectable link if clipboard access is unavailable.
