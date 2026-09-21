#!/usr/bin/env python3
"""CTIN 290 Mood Board: three worked examples at the top of the rubric.

Every image is either generated here (prompt and palette lock printed with it) or a
public-domain object from the Met, printed with artist, date, medium and a live link.
Nothing on this page is unsourced. Palettes are measured from the pixels, not asserted.
"""
import json, html, pathlib, re, sys
sys.path.insert(0, "/private/tmp/claude-501/-Users-gordonai/5350c374-ed75-4fae-8632-989220f3beba/scratchpad/mb")
from captions import CAP
from prompts import PROMPTS, LOCK

M = json.load(open("/private/tmp/claude-501/-Users-gordonai/5350c374-ed75-4fae-8632-989220f3beba/scratchpad/mb/manifest.json"))
def dedash(x):
    """Met catalogue fields carry en dashes in date ranges ("1818-29") and in phrases like
    "18th-19th century". Gordon's documents do not use en or em dashes anywhere, so ranges are
    spelled out and any other dash becomes a comma. The values themselves are unchanged."""
    t = str(x or "")
    t = re.sub(r"(\d)\s*[\u2013\u2014]\s*(\d)", r"\1 to \2", t)
    t = re.sub(r"(\w)\s*[\u2013\u2014]\s*(\w)", r"\1 to \2", t)
    t = re.sub(r"\s*[\u2013\u2014]\s*", ", ", t)
    return t
def e(x): return html.escape(dedash(x))

BOARDS = [
 ("rope", "Rope", "ROPE",
  "A two-person alpine climb where the rope is never cosmetic. You are tied to another player for the whole run, your weight is on their anchor and theirs is on yours, and there is no mechanic for going it alone.",
  "Collaboration as physical consequence. The six words read as: what happens to you happens to me, measured in meters of rope.",
  "Not a survival game with a partner bolted on. There is no solo mode to balance against, because the rope is the game."),
 ("kitchen", "The Last Sitting", "THE LAST SITTING",
  "One narrow family restaurant, one Sunday service, three generations on the line. Nobody in this kitchen can plate, fire and run a pass at the same time, and the game never lets you try.",
  "Collaboration as timing. The six words read as: I can do my part and it is still worthless if it arrives at the wrong second.",
  "Not a cooking game about recipes. The food is never the puzzle. The handoff is."),
 ("garden", "Signal Garden", "SIGNAL GARDEN",
  "A walled night garden that two players tend from opposite sides. One player can see the garden and cannot hear it. The other can hear it and cannot see it. Everything that grows here needs both.",
  "Collaboration as asymmetry. The six words read as: I have half the information and no way to get yours except by asking you well.",
  "Not a puzzle game about relaying instructions. Both players are gardeners with real agency, not one player reading a manual to the other."),
]

def swatch_row(pal, label, note):
    cells = "".join(
      f'<div class="sw"><span style="background:{s["hex"]}"></span>'
      f'<b>{s["hex"]}</b><i>{s["share"]}%</i></div>' for s in pal)
    return (f'<div class="pal"><div class="palhead"><h4>{e(label)}</h4><p>{e(note)}</p></div>'
            f'<div class="swrow">{cells}</div></div>')

def plate(board_key, it):
    if it["kind"] in ("generated", "game"):
        k = it["idx"]
        lab = "In-game" if it["kind"] == "game" else "Generated"
        cls = "game" if it["kind"] == "game" else "gen"
        prov = (f'<span class="tag {cls}">{lab}</span> Recraft V4.1 via Higgsfield, 21 September 2026. '
                f'Palette locked to {", ".join(LOCK[board_key])} at generation time. '
                f'<span class="pr">Prompt: &ldquo;{e(PROMPTS[k])}&rdquo;</span>')
        title = ("Screen " if it["kind"] == "game" else "Plate ") + k
    else:
        o = it["met"]; k = str(o["id"])
        bits = [b for b in [o.get("artist"), o.get("date")] if b and b != "Unknown"]
        title = e(o["title"])
        prov = (f'<span class="tag cur">Curated</span> {e(", ".join(bits))}. {e(o.get("medium"))}. '
                f'The Metropolitan Museum of Art, Open Access. '
                f'<a href="{e(o["page"])}">metmuseum.org/art/collection/search/{k}</a>')
    return f'''<figure class="plate">
<img src="img/{e(it["file"])}" alt="{title}" width="{it['w']}" height="{it['h']}" loading="lazy">
<figcaption><h5>{title}</h5><p class="why">{e(CAP[k])}</p><p class="prov">{prov}</p></figcaption>
</figure>'''

sections = []
for key, name, kicker, premise, reading, isnot in BOARDS:
    d = M[key]; items = d["items"]
    ng = sum(1 for i in items if i["kind"] == "generated")
    nga = sum(1 for i in items if i["kind"] == "game")
    nc = len(items) - ng - nga
    accent = d["palette"][0]["hex"]
    dark = [s for s in d["palette"] if s["lum"] < 110]
    ink = (dark[0]["hex"] if dark else "#1b1b18")
    sections.append(f'''
<section class="board" id="{key}" style="--accent:{accent};--ink:{ink}">
<header class="bh">
<p class="kick">Board {BOARDS.index((key,name,kicker,premise,reading,isnot))+1} of 3</p>
<h2>{e(name)}</h2>
<p class="premise">{e(premise)}</p>
<div class="reads">
<p><b>How this team read the six words.</b> {e(reading)}</p>
<p class="isnot"><b>What this board is not.</b> {e(isnot)}</p>
</div>
<p class="count"><b>{len(items)} images</b> &middot; {ng} of the world &middot; <b>{nga} of the screen</b> &middot; {nc} curated from the public domain &middot; the brief asks for 20 to 40</p>
</header>
{swatch_row(d["palette"], "The look", "Measured from the " + str(ng + nga) + " generated plates, world and screen together, which define how this game looks. Percentages are the share of pixels each color owns.")}
{swatch_row(d["refpalette"], "What the reference plates add", "Measured from the " + str(nc) + " curated works. These skew to paper and age, and that is the honest reading: they are on the board for form, motif and composition, not for color.")}
<div class="grid">
{"".join(plate(key, it) for it in items)}
</div>
</section>''')

CSS = """
*{box-sizing:border-box;margin:0;padding:0}
:root{--paper:#fbfaf7;--ink:#1b1b18;--mut:#6a675f;--line:#e2ded4;--accent:#8a5a3b}
html{-webkit-text-size-adjust:100%}
body{background:var(--paper);color:#1b1b18;
     font:16px/1.55 "Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;
     padding:0 0 80px}
.wrap{max-width:1180px;margin:0 auto;padding:0 28px}
h1,h2,h3,h4,h5,.kick,.tag,.count,.sw b,.sw i,.prov{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}
a{color:inherit}

.masthead{border-bottom:3px solid #1b1b18;padding:44px 0 20px;margin-bottom:34px}
.kick{font-size:11px;font-weight:700;letter-spacing:.19em;text-transform:uppercase;color:var(--mut)}
h1{font-size:46px;line-height:1.02;letter-spacing:-.02em;margin:14px 0 0;font-weight:600}
h1 em{font-style:italic;color:var(--mut)}
.lede{font-size:19px;line-height:1.5;margin-top:18px;max-width:64ch}
.six{margin:26px 0 8px;padding:18px 22px;border-left:4px solid #1b1b18;background:#f2efe7}
.six b{font-size:22px;letter-spacing:-.01em}
.meta{display:flex;flex-wrap:wrap;gap:6px 22px;margin-top:18px;font-size:12.5px;color:var(--mut);
      font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}

.howto{margin:0 0 46px;padding:22px 24px;border:1px solid var(--line);background:#fff}
.howto h3{font-size:13px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:12px}
.howto ol{margin-left:20px;font-size:15px}
.howto li{margin-bottom:7px}

.board{padding-top:34px;margin-top:34px;border-top:1px solid var(--line)}
.bh{max-width:70ch;margin-bottom:26px}
.board h2{font-size:38px;letter-spacing:-.02em;margin:10px 0 0;color:var(--ink)}
.premise{font-size:18px;margin-top:12px}
.reads{margin-top:16px;font-size:15.5px}
.reads p{margin-top:9px}
.isnot{color:var(--mut)}
.count{margin-top:16px;font-size:12.5px;color:var(--mut);letter-spacing:.01em}

.pal{display:flex;flex-wrap:wrap;gap:14px 26px;align-items:flex-start;
     margin:0 0 18px;padding:16px 18px;border:1px solid var(--line);background:#fff}
.palhead{flex:1 1 230px;min-width:0}
.palhead h4{font-size:12px;letter-spacing:.14em;text-transform:uppercase}
.palhead p{font-size:13px;color:var(--mut);margin-top:5px;line-height:1.45}
.swrow{display:flex;flex-wrap:wrap;gap:10px}
.sw{width:78px}
.sw span{display:block;height:58px;border:1px solid rgba(0,0,0,.14)}
.sw b{display:block;font-size:10.5px;letter-spacing:.03em;margin-top:5px}
.sw i{display:block;font-size:10px;color:var(--mut);font-style:normal}

.grid{columns:3 310px;column-gap:22px;margin-top:22px}
.plate{break-inside:avoid;margin:0 0 22px;background:#fff;border:1px solid var(--line);
       display:inline-block;width:100%}
.plate img{display:block;width:100%;height:auto;background:#eee}
figcaption{padding:13px 15px 15px;border-top:3px solid var(--accent)}
figcaption h5{font-size:12.5px;letter-spacing:.02em;line-height:1.35;margin-bottom:7px}
.why{font-size:14.5px;line-height:1.5}
.prov{font-size:11.5px;line-height:1.5;color:var(--mut);margin-top:10px;
      padding-top:9px;border-top:1px dotted var(--line);word-break:break-word}
.prov a{color:var(--mut)}
.pr{display:block;margin-top:5px;font-style:italic}
.tag{display:inline-block;font-size:9.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
     padding:2px 6px;margin-right:6px;vertical-align:1px}
.tag.gen{background:#1b1b18;color:#fff}
.tag.cur{background:#e8e3d7;color:#1b1b18}
.tag.game{background:#8a5a3b;color:#fff}

.close{margin-top:52px;padding-top:30px;border-top:3px solid #1b1b18}
.close h2{font-size:30px;letter-spacing:-.02em}
.rub{width:100%;border-collapse:collapse;margin-top:20px;font-size:14.5px}
.rub th{text-align:left;font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:var(--mut);
        border-bottom:1px solid #1b1b18;padding:0 14px 7px 0;
        font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}
.rub td{padding:11px 14px 11px 0;border-bottom:1px solid var(--line);vertical-align:top;line-height:1.5}
.rub td:first-child{width:23%;font-weight:600}
.notes{margin-top:26px;font-size:14.5px;max-width:74ch}
.notes h3{font-size:12px;letter-spacing:.14em;text-transform:uppercase;margin:22px 0 8px}
.notes p{margin-bottom:10px}
footer{margin-top:44px;padding-top:16px;border-top:1px solid var(--line);
       font:12px/1.6 "Helvetica Neue",Helvetica,Arial,sans-serif;color:var(--mut)}

@media (max-width:760px){
  .wrap{padding:0 16px}
  h1{font-size:32px}
  .board h2{font-size:27px}
  .lede,.premise{font-size:17px}
  .grid{columns:1}
  .sw{width:62px}
  .sw span{height:46px}
  .rub td:first-child{width:auto}
  .rub,.rub tbody,.rub tr,.rub td{display:block}
  .rub thead{display:none}
  .rub td{border-bottom:none;padding:2px 0}
  .rub tr{display:block;padding:12px 0;border-bottom:1px solid var(--line)}
}
@media print{body{background:#fff}.plate{break-inside:avoid}}
"""

HTML = f"""<!doctype html>
<html lang="en"><head>
<!-- STYLE: Exhibition catalogue, wall-label typography | WHY: the rubric grades "well-organized, labeled, presented for easy navigation" as a quarter of the marks, so the exemplar has to BE a labeled exhibition: serif body for reading, sans for every piece of apparatus, one hairline frame per plate, and a caption block that never lets an image sit unexplained. The accent rule under each caption is drawn from that board's own measured palette, so the page is colored by the evidence instead of by a theme. | ALT: dense Pinterest-style collage, rejected because it is the format students already default to and it hides the justification that carries half the grade; a collage shows taste and cannot show reasoning. -->
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>CTIN 290 Mood Board: three worked examples</title>
<style>{CSS}</style></head>
<body>
<div class="wrap">

<header class="masthead">
<p class="kick">CTIN 290 &middot; Digital Media Workshop &middot; Group Project 1</p>
<h1>The Mood Board, done three ways<br><em>one brief, three worlds that do not resemble each other</em></h1>
<p class="lede">Three worked examples at the top of the rubric, built so the room can see what a 5 looks like
in each of the four criteria before it starts. File due <b>Thursday 1 October, 5:00 PM PT</b>. Presentations
<b>Monday 5 October</b>, five minutes per team, everyone speaks.</p>
<div class="six"><b>&ldquo;A game involving collaboration.&rdquo;</b><br>
Not co-op bolted onto a shooter. A game whose subject is people needing each other.</div>
<div class="meta">
<span><b>67 images</b> across three boards</span>
<span><b>28</b> generated, palette-locked</span>
<span><b>39</b> curated from the public domain</span>
<span>Every source named, every link live</span>
</div>
</header>

<div class="howto">
<h3>How to read these, and what to steal</h3>
<ol>
<li><b>Every image carries a sentence saying why it belongs.</b> That sentence is the assignment. An image
you cannot justify out loud is an image that is costing you marks, however beautiful it is.</li>
<li><b>The palette is measured, not claimed.</b> Each strip below was sampled from the actual pixels of the
actual plates, with the percentage of the board each color owns. If your stated tone and your measured
palette disagree, the palette is telling the truth.</li>
<li><b>Two palettes per board, on purpose.</b> The plates that define the look and the plates that are
reference material do not have the same colors, and pretending otherwise is the most common way a board
quietly lies about itself.</li>
<li><b>Sourcing is part of the grade and part of the syllabus.</b> Curated work here is public domain from
the Met's Open Access collection, with artist, date, medium and a working link. Generated work says it was
generated, names the model, and prints the prompt.</li>
<li><b>A mood board for a game needs the screen, not just the world.</b> Every board here carries plates
tagged <b>in-game</b>: the HUD, the camera, the split screen, the level seen from above, the menu. A board
made only of beautiful photographs describes a film. The question a game board has to answer is what the
player is looking at while all that beauty is happening.</li>
<li><b>Each board says what it is not.</b> One sentence ruling something out sharpens a reading faster than
three sentences describing it.</li>
</ol>
</div>

{"".join(sections)}

<section class="close">
<h2>How these three answer the rubric</h2>
<table class="rub">
<thead><tr><th>Criterion</th><th>What a 5 looks like here</th></tr></thead>
<tbody>
<tr><td>Visual Cohesion</td><td>Each board holds one light source, one weather and one distance. Rope is lit
by cold sky and one warm object. The Last Sitting is lit by tungsten and heat lamps and never by daylight.
Signal Garden is lit entirely from the ground up. You can put any plate from one board next to any other
plate from the same board and they agree about what time it is.</td></tr>
<tr><td>Curation &amp; Justification</td><td>Sixty-seven plates, sixty-seven reasons, each one naming the
design problem the image solves rather than the mood it evokes. The test to apply to your own: replace
&ldquo;this feels right&rdquo; with a sentence a programmer could act on.</td></tr>
<tr><td>Color &amp; Palette Development</td><td>Each board was generated against a locked five-color set,
then measured afterward to check the lock held. The measured strip is printed next to the plates so the
claim is falsifiable. Three distinct languages: cold gray with one rust accent, tungsten browns with chili
red, indigo with two light colors that exist only because something is glowing.</td></tr>
<tr><td>Presentation &amp; Accessibility</td><td>Wall labels, not a collage. Every plate is titled,
justified and sourced. The page reads on a phone, prints, needs no JavaScript, and every external link
resolves.</td></tr>
</tbody>
</table>

<div class="notes">
<h3>Two honest notes, because a board that hides its seams teaches nothing</h3>
<p><b>The reference plates drag the palette toward paper.</b> Measured across all images, every board comes
out browner and lighter than it looks, because four hundred years of aged paper and varnish is in the
average. That is why the strips are split. When you present, show the look palette and say plainly that the
historical plates are there for composition and motif.</p>
<p><b>The generated plates are disclosed on purpose.</b> This is tier two under the framework we read in
Session 14: a person directing a generative model inside a normal pipeline, with the direction visible.
Tier three, a prompt standing in for your own seeing, is the thing this course forbids, and the way you
prove you are not doing it is to publish the prompt and the reason next to the picture.</p>
<p><b>Signal Garden was one screen for an hour, and it was visibly the weakest board of the three.</b>
The generation calls for its three most important frames failed, and what failed was exactly the set that
answers the question the board exists to ask: the asymmetric split where one half is lit and the other is
nearly black, the map that only knows what the two of you have told each other, and the leaf whose veins are
the menu. With one screen the board was twenty beautiful pictures of a mood. With four it is a game.
<b>The lesson survives the fix, so it is left here on purpose:</b> count your screens before you fall in love
with your photographs, because a board can look finished and still be missing the only images that explain
what the player does.</p>
<p><b>One source was broken and is not on this page.</b> The Met's own image asset for object 56235,
another impression of the Hokusai climbing print, returns a 404. A second impression, object 55281, is
live and is what you see on the Rope board. Check your links before you submit; a dead source is an
unsourced image.</p>
</div>
</section>

<footer>
Built for CTIN 290, Fall 2026, section 18432. Curated works are Open Access from The Metropolitan Museum of
Art and are linked to their catalogue records. Generated works were made with Recraft V4.1 through
Higgsfield on 21 September 2026 against the five-color lock printed with each board, and every prompt is
reproduced in full. Palette measurements are median-cut quantizations of the published images themselves.
The three game concepts are written for teaching and are not anyone's pitch.
</footer>

</div>
</body></html>"""

pathlib.Path(__file__).parent.joinpath("index.html").write_text(HTML, encoding="utf-8")
tot = sum(len(M[b]["items"]) for b in M)
print("wrote index.html", len(HTML), "bytes; plates:", tot)
for b in M: print(" ", b, len(M[b]["items"]), "images")
