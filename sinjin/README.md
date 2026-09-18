# Sinjin presentation

Live page: https://gordonusc.github.io/the-cabinet/sinjin/

The presentation is data-driven. `presentation.json` contains the current edition, public slide text, image paths, PDF link, and feedback destination. Updating that manifest and its assets on `main` publishes the new edition through the repository's existing GitHub Pages configuration. The page checks for a new manifest every minute while visible and when the tab returns to the foreground. It preserves the current slide and any locally saved feedback draft.

Use versioned slide image and PDF filenames so new editions are not hidden by browser caches. Publish only the visible presentation content. Speaker notes and private source records are not part of this website.

Feedback opens an addressed email in the visitor's email app or Gmail. The visitor reviews and sends it there. There is no server-side form submission, shared comment database, or automatic receipt claim. Draft text is saved only in the visitor's own browser.
