#!/usr/bin/env python3
"""Two model mood board presentations, with the run-of-show timecodes DERIVED from the
actual word counts rather than asserted.

Gordon, 2026-09-21: "5 to 6 minutes is fine." The first draft of this page claimed a
5:00 rail over 3.2 minutes of speech, which is the exact failure a run sheet exists to
prevent. Timings here are computed at WPM below, plus an explicit pause budget per block
for image changes and silences, so the rail is true.
"""
import pathlib, html, re

WPM = 145          # unhurried presentation pace for a nervous sophomore
def e(x): return html.escape(str(x))

# ---------------------------------------------------------------- script data
# block = (speaker, pause_seconds_for_cues_and_silence, cue_or_None, [paragraphs])
# a paragraph starting "**" is rendered bold-lead (a named speaker in a chorus block)

V1 = dict(
 kicker="Version One", title="Built on the verb",
 shape="<b>The shape:</b> open on the single image that <em>is</em> the game, then widen. World, then "
       "screen, then the argument for the curation, then what got cut. Each speaker owns one layer of the "
       "board rather than a slice of it, so nobody ever has to say “and here are some more images.” "
       "Safe, legible, and very hard to do badly. Choose this if your board has one obviously strongest image.",
 credits=[("Maya","Found and argued the reference set. Built the palette and ran the color extraction across "
                  "all 29 plates."),
          ("Devin","Made the in-game plates: the level layout, the ticket HUD, the split screen. Owns every "
                   "claim about what the player is looking at."),
          ("Priya","Curation and the cut list. Wrote the justification for every image and argued four of "
                   "them off the board.")],
 blocks=[
  ("Maya", 8,
   "One image on screen, full bleed, before anybody speaks. Hold it in silence for three seconds. That is "
   "Plate 202, two pairs of hands passing a plate across the pass.",
   ["This is our whole game, and we are going to spend the next six minutes on this one moment.",
    "Two people, one plate, and the exact instant before the handoff completes. Our six words were "
    "<em>a game involving collaboration,</em> and we read them as <b>timing</b>. Not friendship. Not "
    "teamwork as a warm feeling. Timing. I can do my part perfectly and it is still worthless if it "
    "arrives at the wrong second.",
    "So we built a restaurant. One narrow family kitchen, one Sunday service, three generations on the "
    "line, and nobody in it can plate, fire and run a pass at the same time. The game never lets you try."]),
  ("Maya", 6,
   "Switch to the palette strip. Point at each swatch as you name it.",
   ["The palette is measured, not chosen afterwards. We sampled every plate on the board and these six "
    "colors are what came back, with the share of the board each one owns.",
    "Everything is tungsten. <span class=\"term\">Warm/Cool</span> is doing structural work here, not "
    "mood work: the only cool thing in this world is stainless steel, and steel is exactly where the "
    "handoffs happen. Warmth is people, cold is equipment, and the plate crosses from one to the other "
    "and back.",
    "Twenty-seven percent of this board is that dark brown, which is what a kitchen actually looks like "
    "when the only light in it is the one above the pass. We set ourselves one rule early and we kept it: "
    "one light source, no daylight, ever. Every image on this board had to survive that rule or come off."]),
  ("Devin", 8,
   "Maya hands over by name: “Devin has the screens.” Move to the four in-game plates and keep "
   "them up for this whole block.",
   ["Maya just showed you the world. I am going to show you what the player is actually looking at, "
    "because a mood board for a game that contains only photographs is a mood board for a film.",
    "This is our level, seen from above. The stations are deliberately far enough apart that one player "
    "cannot cover two of them. That is <span class=\"term\">Blocking</span> doing design work: the floor "
    "plan creates the cooperation, so the game itself never has to ask for it.",
    "This is the HUD. Order tickets across the top, each with a draining ring, one already red. The "
    "antagonist of this game is a queue, so the queue gets the top of the screen. That is "
    "<span class=\"term\">Visual Hierarchy</span>, and it is also <span class=\"term\">Pacing</span>, "
    "because those rings are the only clock the player is given.",
    "This is the split screen. Two players, two stations, and the same plate visible at the edge of both "
    "views as it crosses. That seam is the game. It is the one piece of "
    "<span class=\"term\">Continuity</span> we cannot afford to get wrong, because if the plate does not "
    "read as the same object in both halves, the handoff stops meaning anything at all."]),
  ("Devin", 5,
   "Bring up the character select plate on its own. Say the next part plainly; it is a warning, not a "
   "feature.",
   ["One screen is on this board as a warning. This character select is drawn, and everything else here "
    "is photographic.",
    "We kept it for the structure, three bodies with three different reaches, and we flagged it in our own "
    "notes. If the art direction drifts that way, the board stops being one world. A "
    "<span class=\"term\">Calling Card</span> is only worth having if it is the one you chose."]),
  ("Priya", 8,
   "Devin hands over: “Priya chose what stayed.” Bring up Bruegel’s <em>The Harvesters</em>, "
   "1565, and the Cypriot terracotta side by side.",
   ["Fifteen of our twenty-nine images are paintings older than photography, and I want to tell you why "
    "that is not padding.",
    "This is Bruegel, 1565. People work, and then they eat under the same tree, in the same picture, and "
    "the meal is clearly the point of the labor. That is the structure of our entire game in one panel. "
    "It is also an <span class=\"term\">Establishing Shot</span>: it gives you the world and the stakes "
    "before a single character does anything.",
    "And this is a terracotta figure of a woman baking bread, made around 600 BCE. It is on the board to "
    "make one argument to this room. The subject of our game is roughly twenty-six centuries old. We did "
    "not invent this feeling, we joined it, and if your reference set only reaches back as far as games "
    "you have played, your board will look like the games you have played."]),
  ("Priya", 6,
   "Cut list up: four thumbnails with a line through each.",
   ["Four images came off this board and I argued every one of them off, so you should hear what we lost.",
    "A beautiful shot of a chef plating alone. Gone, because there is one person in it. A wide of the "
    "dining room at golden hour. Gone, because it broke the one-light rule. Two food close-ups that were "
    "the best-looking images we had. Gone, because neither of them has a person or a screen in it, and "
    "this is not a game about food.",
    "Cutting one wrong image raised this board further than adding three right ones would have."]),
  ("Priya", 4,
   "Back to Plate 202, the handoff. The same image you opened on. Then stop talking.",
   ["Twenty-nine images, one question. Two people, one plate, one second."]),
 ])

V2 = dict(
 kicker="Version Two", title="Built on the objections",
 shape="<b>The shape:</b> name the three things a smart person in this room is already thinking against "
       "your board, and answer them one each, one speaker per objection. Riskier, much more memorable, and "
       "it makes the critique afterwards better because you have pre-empted the easy notes. Choose this if "
       "your board is doing something that needs defending.",
 credits=[("Devin","In-game plates and the mechanic. Built the level layout, the HUD and the split screen."),
          ("Priya","Curation and sourcing. Every historical plate, its licence, and its justification."),
          ("Maya","Palette and cohesion. Ran the color extraction and held the board to one light source.")],
 blocks=[
  ("All three", 6,
   "Board on screen as a full grid, all 29 at once. The three of you stand together for this opening only, "
   "then Devin steps forward and the other two step back.",
   ["**Devin:** There are three things you are about to think about this board.",
    "**Priya:** We think all three of them are fair.",
    "**Maya:** So we are going to say them out loud before you have to."]),
  ("Devin", 8,
   "Title card: <em>“This is just Overcooked.”</em> Then the level layout and the split screen.",
   ["Objection one. This is just Overcooked.",
    "Here is the difference and it is in the floor plan. In Overcooked the kitchen is an obstacle course "
    "and the joke is that it is trying to kill you. Our stations are separated by exactly one thing: "
    "reach. Two people standing still cannot both touch the pass. That is "
    "<span class=\"term\">Blocking</span> as a design constraint rather than as a gag.",
    "And our failure state is not a fire. It is a plate that arrives thirty seconds late and goes out "
    "anyway. Nobody dies. The service just gets a little worse, and you both know exactly whose fault it "
    "was. That is a much more uncomfortable game and it is the one we want to make.",
    "It is also why the HUD shows the tickets and not your score. "
    "<span class=\"term\">Visual Hierarchy</span>: the thing at the top of the screen is the thing the "
    "game is about, and ours is a queue, not a competition between the two of you."]),
  ("Priya", 8,
   "Devin: “Priya has the second one.” Title card: <em>“The old paintings are padding.”</em> "
   "Bring up Le Nain and the terracotta.",
   ["Objection two. Half your board is museum paintings, so you found fifteen images and called it curation.",
    "The easy half of that is answered: every one is public domain from the Met, linked and credited, and "
    "we can show you the record for any of them. Here is the real answer.",
    "This is Le Nain, about 1640. A poor family looking straight out at you without apology. It is on the "
    "board as the <span class=\"term\">Tone</span> lock for our characters: dignity first, hardship "
    "second, pity never. When our artists draw a tired cook at midnight, this is the painting we point at "
    "to say <em>not pathetic.</em> One reference image settles an argument that would otherwise take three "
    "weeks.",
    "And the terracotta is from 600 BCE. It is here to stop us believing we invented anything."]),
  ("Priya", 5,
   "Stay on the grid. This next part is the one that earns the mark, so slow down.",
   ["The fair version of the objection is the one about ownership, so I will answer that too. Does a board "
    "that is half borrowed still count as ours.",
    "What we contributed is not the images, it is the argument for each one, and the four we removed. Every "
    "plate on here has a sentence saying what design problem it solves. If I cannot say that sentence, the "
    "image is not curation, it is decoration, and it comes off."]),
  ("Maya", 8,
   "Priya: “Maya has the last one, and it is the one we nearly got wrong.” Title card: "
   "<em>“It is all brown.”</em> Palette strip up.",
   ["Objection three, and this is the one we nearly failed on. It is all brown.",
    "It is. Twenty-seven percent of this board is that dark tungsten brown, and we are keeping it, because "
    "a kitchen at service has one light source and we refused to cheat that even when the board looked "
    "monotonous at week one.",
    "But look at what the constraint buys. When the only warm thing is human and the only cool thing is "
    "steel, <span class=\"term\">Warm/Cool</span> stops being a mood and starts being information: you can "
    "tell where a plate is in the process from its color temperature alone, before you read anything else "
    "in the frame.",
    "That is <span class=\"term\">Constraint</span>, the through-line since Session 2, doing the thing it "
    "always does. A narrow set of choices applied with total consistency reads as style."]),
  ("Maya", 5,
   "Point at the nine red moments on the grid, quickly, one after another.",
   ["One more thing the palette gave us that we did not plan. The chili red appears nine times on this "
    "board. Every single one of them is a moment something goes wrong.",
    "We did not decide that. We noticed it afterwards, and now it is a rule: in this game, red means a "
    "mistake. That is a <span class=\"term\">Color Script</span> we found by measuring our own board "
    "rather than by arguing about it."]),
  ("All three", 4,
   "Back to the full grid. One line each, fast, then stop talking and let the timer run out.",
   ["**Maya:** One light.",
    "**Priya:** Twenty-six centuries.",
    "**Devin:** Two people, one plate, one second."]),
 ])

def words(paras):
    t = " ".join(paras)
    t = re.sub(r"<[^>]+>", " ", t)
    t = html.unescape(t).replace("**", " ")
    return len([w for w in t.split() if any(c.isalnum() for c in w)])

def render(v):
    t = 0
    rows = []
    total_words = 0
    for speaker, pause, cue, paras in v["blocks"]:
        w = words(paras); total_words += w
        dur = w / WPM * 60 + pause
        mm, ss = divmod(int(t), 60)
        body = ""
        if cue:
            body += f'<div class="cue"><b>Cue</b>{cue}</div>'
        for p in paras:
            if p.startswith("**"):
                name, _, rest = p[2:].partition("**")
                body += f'<p><b>{e(name)}</b>{rest}</p>'
            else:
                body += f"<p>{p}</p>"
        rows.append(f'''<div class="row"><div class="rail"><p class="t">{mm}:{ss:02d}</p>
<p class="who">{e(speaker)}</p><p class="len">{round(dur)} sec</p></div>
<div class="say">{body}</div></div>''')
        t += dur
    mm, ss = divmod(int(round(t)), 60)
    cred = "".join(f'<li><span class="who">{e(n)}</span><span class="did">{e(d)}</span></li>'
                   for n, d in v["credits"])
    return f'''<h2 class="ver"><small>{e(v["kicker"])}</small>{e(v["title"])}</h2>
<p class="shape">{v["shape"]}</p>
<p class="runs"><b>Runs {mm}:{ss:02d}</b> at {WPM} words a minute, including {sum(b[1] for b in v["blocks"])}
seconds of deliberate pauses for cues and silences. {total_words} spoken words.</p>
<div class="credits"><h3>Who made what</h3><ul>{cred}</ul></div>
{"".join(rows)}''', t, total_words

shell = pathlib.Path("_shell.txt").read_text(encoding="utf-8")
h1, t1, w1 = render(V1)
h2, t2, w2 = render(V2)

HEADER = '''<header>
<p class="kick">CTIN 290 &middot; Group Project 1 &middot; Presentations Monday 5 October</p>
<h1>Two outstanding versions of the same six minutes
<em>One board, three speakers, two completely different ways to be excellent</em></h1>
<div class="rules">
<div><b>Five to six minutes</b><span>A visible timer. A pitch you cannot land in six minutes is a pitch you
do not yet understand.</span></div>
<div><b>Everyone speaks</b><span>Three people, so roughly two minutes each. Decide in advance who says what.
Do not improvise the split in the room.</span></div>
<div><b>Then four minutes</b><span>I Like, I Wish, What If from the room, which is not part of your
six.</span></div>
<div><b>Say the terms</b><span>Out loud, by name. &ldquo;The lighting is really good&rdquo; is not a
sentence. Use the vocabulary you have been building since August.</span></div>
</div>

<p class="lede">Both scripts below present <b>The Last Sitting</b>, the same board, from
<a href="https://gordonusc.github.io/the-cabinet/ctin290-mood-boards/">the worked examples page</a>. They
are not two drafts of one presentation. They are two different <b>structures</b>, and each one would earn
full marks, which is the whole point: there is no single correct shape for this.</p>
<p class="lede">Read the one that is least like what your team was already planning.</p>

<div class="flag"><b>The names are placeholders.</b> Maya, Devin and Priya are invented so the handoffs and
the credit are legible. Put your own three names in, and keep the habit of saying out loud who did what,
because on a group project the room cannot see the work. It can only see the presentation.</div>
</header>'''

AFTER = '''<div class="after"><h3>What both versions do, and what your team should steal</h3>
<p><b>Every claim is attached to an image.</b> Neither script ever says something the room cannot look at
while they hear it.</p>
<p><b>The terms are used, not listed.</b> Blocking, visual hierarchy, pacing, continuity, tone, warm/cool,
constraint, establishing shot, calling card, color script. Each one arrives because it explains the picture
on screen, never as a vocabulary check.</p>
<p><b>Credit is specific.</b> Not &ldquo;we all worked on it.&rdquo; Maya ran the color extraction. Devin
built the screens. Priya argued four images off the board. The room cannot see who did what unless somebody
says it, and the person who did the work should not have to be the one who says it.</p>
<p><b>Somebody says what got cut.</b> A board with a cut list is a board that somebody edited. A board with
no cut list is a folder.</p>
<p><b>Both admit something.</b> Version One flags its own style break. Version Two opens by handing the room
its own notes. Admitting a weakness and then showing it was a decision is the fastest way to sound like you
know what you made.</p></div>

<footer>
CTIN 290, Digital Media Workshop, Fall 2026. Both scripts present The Last Sitting from the worked examples
at <a href="https://gordonusc.github.io/the-cabinet/ctin290-mood-boards/">the mood board page</a>. Speaker
names are invented placeholders. <b>The timecodes on the left are calculated,</b> not estimated: every block
is its real word count at 145 words a minute plus a stated pause budget for image changes and silences.
Rehearse with a timer anyway, because everyone runs long the first time.
</footer>

</div>
</body></html>'''

out = shell + HEADER + h1 + h2 + AFTER
pathlib.Path("index.html").write_text(out, encoding="utf-8")
print(f"wrote index.html {len(out)} bytes")
print(f"  Version One: {w1} spoken words, runs {int(t1)//60}:{int(t1)%60:02d}")
print(f"  Version Two: {w2} spoken words, runs {int(t2)//60}:{int(t2)%60:02d}")
