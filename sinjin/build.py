#!/usr/bin/env python3
"""Render each Sinjin page's index.html from its presentation.json + page.json.

Both pages (this one and directory/) are data driven at runtime: app.js fetches
presentation.json and hydrates the viewer. Left alone, that means the published
HTML ships an empty img src, an empty outline select, PDF links pointing at "#"
and "Loading the latest presentation..." where the summary goes. A reader whose
browser does not run the script gets a header and a hole.

This renders the same manifest into the markup at publish time, so JS on and JS
off start from the same edition, and adds a <noscript> deck carrying every
slide, because a reader without script cannot press Next.

    python3 build.py                 # build every page
    python3 build.py directory       # build one

page.json holds the copy that is NOT derived from the manifest (headline,
lede, nav, fact labels, download links). Edit that, never the generated
index.html: the next build overwrites it. That is not hypothetical, it is why
this file exists in the generator instead of the output.
"""
import html
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).parent
PAGES = [HERE, HERE / "directory"]


def esc(value):
    return html.escape(str(value), quote=True)


def links(items):
    """page.json link rows. Labels are authored HTML, hrefs are escaped."""
    return "".join(
        '<a href="%s">%s <span>↗</span></a>' % (esc(i["href"]), i["label"]) for i in items
    )


def nav_links(items):
    return "".join('<a href="%s">%s</a>' % (esc(i["href"]), i["label"]) for i in items)


def slide_text_block(slide):
    return "".join("<p>%s</p>" % esc(line) for line in slide["text"])


def outline_options(slides):
    total = len(slides)
    return "".join(
        '<option value="%d"%s>%d / %d · %s</option>'
        % (i, " selected" if i == 0 else "", i + 1, total, esc(s["title"]))
        for i, s in enumerate(slides)
    )


def topic_options(slides):
    return '<option value="general">The whole plan</option>' + "".join(
        '<option value="%s">%d. %s</option>' % (esc(s["id"]), i + 1, esc(s["title"]))
        for i, s in enumerate(slides)
    )


def noscript_deck(data, page):
    slides = data["slides"]
    total = len(slides)
    out = [
        '<noscript><section class="static-deck" aria-label="All slides as text and pictures">',
        "<h2>The presentation, all %d slides</h2>" % total,
        '<p class="lede">Your browser is not running the slide viewer, so every slide is '
        "laid out here in order.</p>",
        '<p class="downloads"><a href="%s">Presentation PDF <span>↗</span></a>%s</p>'
        % (esc(data["pdf"]), links(page["downloads"])),
    ]
    for i, slide in enumerate(slides):
        out.append(
            '<article class="static-slide" id="%s"><p class="eyebrow">SLIDE %d OF %d</p>'
            '<h3>%s</h3><img src="%s" alt="Slide %d, %s" loading="lazy" width="1600" height="900">'
            '<div class="static-slide-text">%s</div></article>'
            % (
                esc(slide["id"]), i + 1, total, esc(slide["title"]),
                esc(slide["image"]), i + 1, esc(slide["title"]),
                slide_text_block(slide),
            )
        )
    out.append(
        '<p class="quiet">To send a thought on any slide, email '
        '<a href="mailto:%s">%s</a> and name the slide number.</p>'
        % (esc(data["feedbackEmail"]), esc(data["feedbackEmail"]))
    )
    return "".join(out) + "</section></noscript>"


# Controls, the readable details and the feedback form all need script to do
# anything. Hiding them without script keeps the page free of dead buttons.
NOSCRIPT_STYLE = (
    "<noscript><style>.controls,.slide-actions,#readable,#feedback-form,"
    "#update-note,.live-dot{display:none}"
    ".static-deck{border-top:1px solid #ded4dd;margin-top:40px;padding-top:40px}"
    ".static-deck .lede{margin:18px 0 26px}"
    ".static-slide{border-top:1px solid #ded4dd;padding:34px 0;max-width:1000px}"
    ".static-slide h3{font-family:Baskerville,Georgia,serif;font-weight:400;"
    "font-size:clamp(24px,2.4vw,34px);letter-spacing:-.02em;margin:0 0 20px}"
    ".static-slide img{display:block;width:100%;height:auto;border:1px solid #e3d9de;"
    "border-radius:4px;margin-bottom:22px}"
    ".static-slide-text{font-size:18px;max-width:850px}"
    ".static-slide-text p{margin:8px 0}</style></noscript>"
)

STYLE_NOTE = (
    "<!-- STYLE: the page's existing editorial register, Baskerville display on warm cream"
    " with a teal accent | WHY: this renders a no-script fallback, and a fallback that"
    " announces itself with a different visual system is a bug wearing a style, so the deck"
    " inherits the type scale, rule weight and color the reader already has"
    " | ALT: Muller-Brockmann, a numbered grid of every slide, rejected because a reader"
    " without script wants one column in presentation order, not a contact sheet to decode -->"
)

TEMPLATE = """<!doctype html>
{style_note}
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="color-scheme" content="light"><title>{title}</title><meta name="description" content="{description}"><link rel="icon" href="ggp-logo.png"><link rel="stylesheet" href="style.css">{noscript_style}</head>
<body><a class="skip" href="#presentation">Skip to presentation</a>
<header><a href="#" class="brand" aria-label="GGP and Sinjin"><img src="ggp-logo.png" alt="Gay Gaming Professionals"><span>WITH SINJIN</span></a><nav aria-label="Page">{nav}<a id="download" href="{pdf}" download="{pdf_name}">Download PDF</a></nav></header>
<main>
<section class="intro"><p class="eyebrow">WITH GRATITUDE TO SINJIN, CLAIRE, LUCAS &amp; BIGGLESWORTH</p><h1>{h1}</h1><p class="lede">{lede}</p><div class="headline-facts"><p><strong id="cohort-count">{cohort}</strong><span>{cohort_label}</span></p><p><strong id="additional-count">{additional}</strong><span>{additional_label}</span></p><p><strong id="mentor-count">{mentors}</strong><span>{mentors_label}</span></p></div><p class="scenario" id="scenario">{summary}</p></section>
<section id="presentation" aria-label="Presentation"><div class="section-heading"><div><p class="eyebrow">THE CONVERSATION</p><h2>{section_heading}</h2></div><div class="revision"><span class="live-dot" aria-hidden="true"></span><span id="updated">Updated {updated_label}</span></div></div>
<p class="update-note" id="update-note" role="status" aria-live="polite"></p>
<div class="viewer" id="viewer"><img id="slide" src="{first_image}" alt="{first_alt}" fetchpriority="high" width="1600" height="900"><div class="controls"><button id="prev" type="button" aria-label="Previous slide" disabled>← <span>Previous</span></button><label class="select-label"><span class="sr-only">Choose a slide</span><select id="outline">{outline}</select></label><button id="next" type="button" aria-label="Next slide"><span>Next</span> →</button><button id="expand" type="button" aria-label="View presentation full screen">⛶</button></div></div>
<div class="slide-actions"><button class="text-button" id="comment-slide" type="button">Share a thought on this slide</button><span>Use the arrows to explore at your pace.</span></div>
<details id="readable"><summary>Read this slide as text</summary><div id="slide-text">{first_text}</div></details>
<div class="downloads"><a id="pdf-link" href="{pdf}" download="{pdf_name}">Presentation PDF <span>↗</span></a>{downloads}</div>
{static_deck}
</section>
<section class="feedback" id="feedback"><div><p class="eyebrow">A NOTE TO DARBY</p><h2>What would you<br>like to shape?</h2><p>An introduction. A question. A better way to reach a graduate student. Your thoughts help us make this useful.</p><p class="quiet">Your draft stays in this browser until you choose to send it. The buttons open an email addressed to Darby.</p></div>
<form id="feedback-form"><label for="topic">About</label><select id="topic">{topics}</select><label for="thought">Your thought</label><textarea id="thought" rows="6" maxlength="6000" placeholder="I could introduce you to… / Have you considered… / What would it take to…" required></textarea><div class="feedback-buttons"><button class="primary" type="submit">Email Darby</button><a class="secondary" id="gmail" href="#" target="_blank" rel="noopener">Use Gmail ↗</a><button class="text-button" id="copy" type="button">Copy note</button></div><p class="form-status" id="form-status" role="status" aria-live="polite"></p><p class="email-address">Darby: <a href="mailto:{feedback_email}">{feedback_email}</a></p></form></section>
<footer><p>Thank you for helping more graduate students take their next step.</p><span>This link stays current as the presentation evolves. It checks for new editions while open.</span></footer>
</main><script src="app.js" defer></script></body></html>
"""


def build(page_dir):
    data = json.loads((page_dir / "presentation.json").read_text(encoding="utf-8"))
    page = json.loads((page_dir / "page.json").read_text(encoding="utf-8"))
    slides = data["slides"]
    if not slides:
        raise SystemExit("%s: presentation.json has no slides" % page_dir)
    first = slides[0]
    facts = data.get("headlineFacts") or {}
    labels = page["fact_labels"]
    out = page_dir / "index.html"
    out.write_text(
        TEMPLATE.format(
            style_note=STYLE_NOTE,
            noscript_style=NOSCRIPT_STYLE,
            title=esc(page["title"]),
            description=esc(page["description"]),
            nav=nav_links(page["nav"]),
            h1=page["h1"],
            lede=esc(page["lede"]),
            section_heading=page["section_heading"],
            pdf=esc(data["pdf"]),
            pdf_name=esc(page["pdf_download_name"]),
            cohort=esc(facts.get("cohort", "See deck")),
            additional=esc(facts.get("additional", "See deck")),
            mentors=esc(facts.get("mentors", "See deck")),
            cohort_label=labels["cohort"],
            additional_label=labels["additional"],
            mentors_label=labels["mentors"],
            summary=esc(data["summary"]),
            updated_label=esc(data["updatedLabel"]),
            first_image=esc(first["image"]),
            first_alt=esc("%s (slide 1 of %d)" % (first["title"], len(slides))),
            outline=outline_options(slides),
            first_text=slide_text_block(first),
            downloads=links(page["downloads"]),
            topics=topic_options(slides),
            static_deck=noscript_deck(data, page),
            feedback_email=esc(data["feedbackEmail"]),
        ),
        encoding="utf-8",
    )
    print("wrote %s (%d bytes) from edition %s"
          % (out.relative_to(HERE.parent), out.stat().st_size, data["version"]))


def main():
    targets = [HERE / a for a in sys.argv[1:]] if len(sys.argv) > 1 else PAGES
    for t in targets:
        build(t)


if __name__ == "__main__":
    main()
