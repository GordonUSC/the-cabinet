#!/usr/bin/env python3
"""CTIN 290 Session 9, the TIMED WALKTHROUGH. Minute by minute, at reading size.

Every wall-clock time is DERIVED from ~/usc/ctin290/COURSE-TRUTH.json, so this document
cannot drift from the run sheet Alex is working off. Steps inside a block are given a
duration and the clock accumulates; the builder asserts the steps add up to the block.

Gordon, 2026-09-21 04:35: "Print the correct version in the legible font... the timed
walkthrough." Type is the same scale as the professor's guide: nothing below 9.5pt,
prose in Charter, the clock and labels in Helvetica.
"""
import json, html, pathlib
from datetime import datetime, timedelta

T = json.loads(pathlib.Path("/Users/gordonai/usc/ctin290/COURSE-TRUTH.json").read_text(encoding="utf-8"))
BLOCKS = T["runsheet_overrides"]["9"]
def e(x): return html.escape(str(x))

# steps[block title] = [(minutes, what to DO, what to SAY or None)]
STEPS = {
"Sound and action": [
 (3, "Open Astra's sound-and-action lab on the projector. Run the same action three times: sound early, "
     "sound on time, sound late. Say nothing while it plays.", None),
 (4, "Ask for a show of hands on which one felt like contact. Then ask the one that matters: what changed, "
     "the picture or the sound?", "Nothing on screen moved. The only thing that changed was when you heard it."),
 (1, "Leave the lab open. You come back to this at 11:05 when Hamilton does the same trick with a cut.", None),
],
"One viewing question": [
 (2, "Write the day's question on the board and leave it there for 170 minutes. Do not answer it yet.",
     "In a theater your eye chooses. On a screen somebody chose for you. What did that buy, and what did it cost?"),
],
"Critical Role, the cold open": [
 (1, "Open 3Mbynm0pGX0 at 0:00. Full screen. Sound up. Tell them it runs about nineteen minutes and that "
     "they are watching for one thing.",
     "Four hundred and fifty hours of performance, one camera that barely moves. By noon you will be able "
     "to tell these people apart with the sound off."),
 (2, "Play 0:00:00 to 0:01:05. The GM asks Liam to introduce his character and Hal describes himself: an "
     "older orc, dark hair streaked white, fine but not ostentatious clothing, smile lines from a life well "
     "lived. Let it run, do not narrate over it.", None),
 (4, "Keep playing to 0:06:30. At 0:04:59 the GM turns to Luis and Azune Nayar gets the same treatment: the "
     "braid, the birthmark up the right side of the face, eyes like a sunset on an ocean.", None),
 (17, "Play on to 0:18:51 and STOP THERE. Do not go past it. At 0:18:51 the cold open ends and the show "
      "runs nine minutes of announcements and a wedding ring sponsor sketch.", None),
 (6, "Lights up. One question to the room before anyone opens a laptop. Take three answers, no more.",
     "They described themselves out loud, in order, before the show had a title card. What did each of them "
     "choose to tell you first?"),
],
"The three terms, performance labs": [
 (5, "Astra's blocking lab: session-9.html#performance-lab. Wide view, camera fixed, overhead plan visible. "
     "Run Approach and Move away and let them see all three end positions.",
     "Blocking is position plus trajectory. Who moved last, and what did that movement tell you before "
     "anybody spoke?"),
 (5, "Switch to ?mode=gesture. Open palm, folded arms, three fingertip cuff touches. Half speed if the room "
     "is missing it.",
     "Gesturality. If you muted this, how many of these people could you still tell apart?"),
 (5, "Switch to ?mode=framing, frozen at 3.0 seconds. Toggle Both performers against Listener reaction. Do "
     "not restart between crops, that is the whole point.",
     "Reaction shot. Whose face is the story right now, and is it the person talking?"),
],
"Ten-minute break": [
 (10, "The full ten, and leave the room. The back half is the half that has to land. Cue the Hamilton "
      "trailer to 0:00 while they are out so you are not scrubbing in front of them.", None),
],
"Hamilton, the trailer, three plays": [
 (2, "Play DSCKfXpAGHc once, cold, all sixty seconds. No setup, no question in advance.", None),
 (6, "Play it a second time with the sound OFF. Tell them to watch only where the cuts land and to count "
     "them on their fingers.",
     "You have no music and no lyrics now. Count the cuts. Somebody chose every one of those."),
 (8, "Play it a third time with sound, and have the room call each cut out loud as it happens. It will be "
     "ragged for fifteen seconds and then it locks in.", None),
 (6, "Go back to 0:27 and hold it. Angelica sings To your Union and the company answers underneath her in "
     "the same bars. Two performances at once, one frame.",
     "In the house you decide whether to watch her or watch them. Here the edit already decided, and you "
     "cannot undo it. Name the gain first: a close-up no seat could buy. Now name the loss."),
 (3, "Astra's question to close the block, from viewing-cues.html: a table, a stage, a chosen view.", None),
],
"Critical Role, a small gesture": [
 (2, "Back to 3Mbynm0pGX0 at 0:07:28. Seventy seconds this time, not nineteen minutes.", None),
 (4, "Play 7:28 to 8:38. Pause at 7:38 on Luis's hands. Run to 8:28 with Brennan speaking. Pause at 8:33 on "
     "Luis listening.",
     "Same three terms, one minute of tape. An hour ago you watched them establish a person. This is the "
     "same person, doing one small thing."),
 (2, "Name the cost out loud: the camera did not cut, so you chose where to look. That is the opposite of "
     "what Hamilton just did to you.", None),
],
"A camera choice for a game": [
 (4, "Astra's framing lab again, but turned toward their own work.",
     "Where do you put the lens when the performance was not staged for one?"),
 (8, "Take three answers and push each one: what does your choice cost the player? Write the three on the "
     "board. These become prototype notes in three weeks.", None),
],
"One World, Two Media, named": [
 (5, "Open assignment-video-essay.html with the rubric visible. Due Thursday 24 September, 5:00 PM PT. Say "
     "the connection plainly, because most of them will not make it themselves.",
     "Hamilton on stage against Hamilton on screen is one of the four approved pairs. The argument I just "
     "ran at 11:05 is the assignment. You watched one performed."),
],
"Evidence rehearsal and feedback": [
 (8, "student-notes.html. Each student rehearses one evidence-backed comparison with a partner: point at a "
     "frame, name the term, say what it costs.", None),
 (7, "I Like, I Wish, What If in pairs, then two share-backs to the room. Hold them to the vocabulary: the "
     "lighting is really good is not a sentence.", None),
 (5, "Name what is due and what is not. Nothing new is set tonight, and say the difference.",
     "No new homework. You already carry three things: the video Thursday, the mood board on the first, and "
     "the terms."),
],
"MOOD BOARD TEAM TIME, team set 1": [
 (3, "Teams into their four groups. Put the worked examples up on the projector while they settle: "
     "gordonusc.github.io/the-cabinet/ctin290-mood-boards/",
     "The only in-class time this project gets. Sessions 10, 11 and 12 have no team block, so the next time "
     "we are all in a room it is your presentation."),
 (7, "Team 1. Look at the board as it actually stands, not at a description of it. Then the two questions.",
     "Say your palette out loud. Now show me the one image you cannot justify."),
 (7, "Team 2. Same two questions. Name the single most likely reason this misses Thursday 1 October.", None),
 (7, "Team 3. Same. If a board is twenty beautiful photographs with no screens in it, say so now, not on "
     "5 October.", None),
 (6, "Team 4. Same. Before you leave each team, agree one thing that will be true by Wednesday and write "
     "it down.", None),
],
"Exit ticket, two lines": [
 (5, "Two lines on paper, collected at the door. Tell them why the second line matters.",
     "One term you learned today and where you saw it. One thing you are still unsure of. The second line "
     "is the one I actually need."),
],
}

rows, cur, nsteps = [], datetime(2026, 9, 21, 10, 0), 0
for b in BLOCKS:
    steps = STEPS[b["title"]]
    tot = sum(s[0] for s in steps)
    assert tot == b["minutes"], f"{b['title']}: steps total {tot}, block is {b['minutes']}"
    start = cur
    inner = []
    for mins, do, say in steps:
        nsteps += 1
        said = f'<p class="say">{e(say)}</p>' if say else ""
        inner.append(f'<tr><td class="st"><b>{cur:%-I:%M}</b><i>{mins} min</i></td>'
                     f'<td class="sd"><p>{e(do)}</p>{said}</td></tr>')
        cur += timedelta(minutes=mins)
    win = f' &middot; <b>{e(b["window"])}</b>' if b.get("window") else ""
    own = b["owner"].upper() if b["owner"] != "both" else ""
    rows.append(f'''<section class="blk">
<h2><span class="bt">{start:%-I:%M} to {cur:%-I:%M}</span>{e(b["title"])}
<small>{b["minutes"]} min{win}{(" &middot; " + own) if own else ""}</small></h2>
<table class="steps">{"".join(inner)}</table></section>''')

CSS = """
@page{size:letter;margin:.5in .55in .5in .55in}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font:13.2pt/1.5 Charter,"Bitstream Charter",Georgia,"Iowan Old Style",serif;color:#111;background:#fff;
     max-width:7.4in;margin:0 auto;padding:20px 0 40px}
h1,h2,.kick,.bt,.st,.meta b,footer,h2 small{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}
.kick{font-size:9.6pt;font-weight:700;letter-spacing:.17em;text-transform:uppercase;color:#a4442a}
h1{font-size:30pt;line-height:1;letter-spacing:-.015em;margin:8px 0 6px;font-weight:700}
h1 span{display:block;font-size:13.5pt;font-weight:400;color:#444;margin-top:8px;letter-spacing:0;
        font-family:Charter,Georgia,serif}
.meta{display:flex;flex-wrap:wrap;gap:4px 22px;font-size:10.4pt;color:#333;margin:12px 0 0;
      padding-top:9px;border-top:2.5pt solid #111}
.meta b{display:block;font-size:9.5pt;letter-spacing:.11em;text-transform:uppercase;color:#7c7c76}
.lede{margin-top:14px;font-size:12pt;padding:11px 14px;background:#f4f1ea;border-left:3px solid #a4442a}

.blk{margin-top:20px;break-inside:avoid}
h2{font-size:15pt;letter-spacing:-.01em;margin-bottom:5px;padding-bottom:4px;border-bottom:1.6pt solid #111;
   display:flex;align-items:baseline;gap:11px;flex-wrap:wrap}
.bt{font-size:12.5pt;color:#a4442a;font-weight:700;white-space:nowrap}
h2 small{margin-left:auto;font-size:9.5pt;font-weight:400;color:#7c7c76;letter-spacing:.04em;
         white-space:nowrap}
table.steps{width:100%;border-collapse:collapse}
.steps td{padding:8px 0;border-bottom:.5pt solid #e2e2dc;vertical-align:top}
.steps tr:last-child td{border-bottom:none}
.st{width:74px;padding-right:12px;white-space:nowrap}
.st b{display:block;font-size:11.5pt;font-weight:700}
.st i{display:block;font-style:normal;font-size:9.5pt;color:#7c7c76;letter-spacing:.05em;margin-top:2px}
.sd p{font-size:11.6pt;line-height:1.48}
.say{margin-top:6px;padding:7px 11px;background:#faf7f1;border-left:2.5pt solid #a4442a;
     font-style:italic;font-size:11.4pt}
.say::before{content:"Say: ";font-style:normal;font-weight:700;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;
             font-size:9.5pt;letter-spacing:.09em;text-transform:uppercase;color:#a4442a}
footer{margin-top:26px;padding-top:9px;border-top:.5pt solid #b9b9b4;font-size:9.5pt;color:#7c7c76;
       line-height:1.55}
@media screen{body{padding:30px 20px 50px}}
@media screen and (max-width:820px){
  body{max-width:100%;padding:20px 15px 40px}
  h1{font-size:22pt}
  h2{font-size:13pt}
  h2 small{margin-left:0;width:100%}
  .st{width:62px}
}
"""

HTML = f"""<!doctype html>
<html lang="en"><head>
<!-- STYLE: Stage manager's calling script | WHY: a run sheet says what the blocks are; a walkthrough says what you DO in each minute, so this is set like a call script: a narrow clock rail, one instruction per row, and every line you actually speak pulled out into its own marked box so you can find it with your eye while the room is looking at you. Set at the same reading size as the guide, nothing under 9.5pt. | ALT: the guide's Swiss timetable, rejected because a timetable is for orienting and this is for executing, and because the two documents need to look different in a stack at 10am. -->
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>CTIN 290 Session 9, timed walkthrough</title>
<style>{CSS}</style></head>
<body>
<p class="kick">CTIN 290 &middot; Digital Media Workshop &middot; Session 9</p>
<h1>The timed walkthrough<span>Monday 21 September 2026. What you do, minute by minute, from 10:00 to 12:50.</span></h1>
<div class="meta">
<div><b>Room</b>SCI L104</div>
<div><b>Length</b>170 minutes</div>
<div><b>Blocks</b>{len(BLOCKS)}</div>
<div><b>Steps</b>{nsteps}</div>
<div><b>Built from</b>COURSE-TRUTH {T['hash']}</div>
</div>
<p class="lede"><b>Two things this document will not let you get wrong.</b> Critical Role is the cold open,
0:00 to 18:51, and you <b>stop at 18:51</b> because the ads start there. Hamilton is the sixty second
trailer played three times, not Act I. Alex is working from the same clock at
<code>gordonusc.github.io/the-cabinet/ctin290-september-21/ALEX/</code></p>

{"".join(rows)}

<footer>
Every wall-clock time on this page is calculated from the single course source,
<code>~/usc/ctin290/COURSE-TRUTH.json</code>, hash {T['hash']}, and the builder asserts that the steps inside
each block add up to the block. Blocks marked ASTRA are Astra's labs and screens, kept as built. If this
document and any PDF in the September 21 packet disagree, this one is current: the packet binaries were
generated before Gordon's 4:05 AM ruling on the Critical Role screening.
</footer>
</body></html>"""

out = pathlib.Path(__file__).parent / "index.html"
out.write_text(HTML, encoding="utf-8")
print(f"wrote {out.name} {len(HTML)} bytes | {len(BLOCKS)} blocks, {nsteps} steps, 170 min")
