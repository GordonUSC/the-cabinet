#!/usr/bin/env python3
"""CTIN 290 Session 9 professor's guide, built for a printer, not a screen.

All session text is lifted VERBATIM from the artifact of record
(ede331ff-e34c-4854-abe5-926ca519213d) via /tmp/sessions.json and /tmp/gloss.json.
Nothing of Gordon's is paraphrased. Everything I add is marked as mine.
"""
import json, html, pathlib, re

S = json.load(open("/tmp/sessions.json"))
G = json.load(open("/tmp/gloss.json"))
s9 = next(x for x in S if str(x["number"]) == "9")
terms = [t for t in G if str(t.get("session")) == "9"]
START = 10 * 60  # 10:00 AM

def dedash(t):
    """The artifact's media titles still carry en dashes. Gordon's documents do not.
    Normalise here rather than in his source, the same way the rundown builder did."""
    t = str(t or "")
    t = re.sub(r"(\d)\s*[\u2013\u2014]\s*(\d)", r"\1 to \2", t)
    t = re.sub(r"\s*[\u2013\u2014]\s*", ", ", t)
    return t
def e(x): return html.escape(dedash(x))
def clock(m):
    h, mm = divmod(m, 60)
    ap = "AM" if h < 12 else "PM"
    hh = h if 1 <= h <= 12 else (h - 12 if h > 12 else 12)
    return f"{hh}:{mm:02d}\u00a0{ap}"
def span(t):
    a, b = t.split("min")[0].split("-")
    return int(a), int(b)

# ---- the ranked objectives. Mine, built from his own `learning` line. --------
OBJ = [
 ("Name a visual signature and point at the frames that carry it.",
  "Costume, posture, gesture, and the way those choices persist across hours of performance. "
  "This is the exact skill the Visual Analysis video is graded on and it is due Thursday, so "
  "if only one thing survives the morning, this is it.",
  "DO NOT CUT"),
 ("Say out loud what a cut costs.",
  "In a theater your eye chooses and you can watch the person who is not speaking. On a screen "
  "somebody chose for you. Name the gain, close-ups no seat could buy, then name the loss. This "
  "is the first appearance of Adaptation, which you name properly in Session 12.",
  "PROTECT IT"),
 ("Put three terms in their hands: blocking, gesturality, reaction shot.",
  "Each one gets seen on screen before it gets defined. The exit ticket tells you whether they "
  "actually landed.",
  "RECOVERABLE"),
]

DAY = [
 ("9:00\u00a0AM", "USC Games Faculty &amp; Staff, Zoom", "Gini Benson's weekly. Ends 10:00.", "clash"),
 ("9:00\u00a0AM", "USC Dept call", "Your own entry, ends 9:50.", ""),
 ("10:00\u00a0AM", "CTIN 290 Session 9, SCI L104", "170 minutes. This document.", "now"),
 ("10:00\u00a0AM", "Gordon / Alex, Google Meet", "Two hours, straight through class. On the GGP calendar, not this one.", "clash"),
 ("2:00\u00a0PM", "Jeff McClusky, Festival University", "Introduced by Travis Laurendine. 15 colleges, 8 festivals.", ""),
 ("3:00\u00a0PM", "Remy Routh", "Moved from 2:00 when McClusky landed.", ""),
]

rows = []
t = START
for b in s9["timing"]:
    a, z = span(b["time"])
    lab, _, body = b["activity"].partition(":")
    rows.append((START + a, START + z, z - a, lab.strip(), body.strip() or b["activity"]))

def block_html():
    out = []
    for a, z, mins, lab, body in rows:
        cls = " brk" if "Break" in lab else (" tick" if "Exit Ticket" in lab else "")
        out.append(f'''<tr class="blk{cls}">
<td class="t"><b>{clock(a)}</b><span>{clock(z)}</span><i>{mins} min</i></td>
<td class="b"><h4>{e(lab)}</h4><p>{e(body)}</p></td></tr>''')
    return "\n".join(out)

def frayer():
    out = []
    for t_ in terms:
        out.append(f'''<div class="frayer">
<h4>{e(t_["term"])}</h4>
<div class="fg">
<div><b>Definition</b><p>{e(t_["def"])}</p></div>
<div><b>What to look at</b><p>{e(t_["look"])}</p></div>
<div><b>Where you see it</b><p>{e(t_["timestamp"])}<br><span class="u">{e(t_["url"])}</span></p></div>
<div><b>Ask the room</b><p>{e(ASK[t_["term"]])}</p></div>
</div></div>''')
    return "\n".join(out)

ASK = {
 "Blocking": "Who moved last, and what did that movement tell you before anybody spoke?",
 "Gesturality": "If you muted this, how many of these people could you still tell apart?",
 "Reaction Shot": "Whose face is the story right now, and is it the person talking?",
}

# Durations pulled from YouTube twice tonight, oEmbed for identity and the watch
# page for lengthSeconds. The worker session pulled the same four independently and
# got the same numbers. This is the field the guide never had and most needed.
DUR = {"Uo9z2gIUmUo": "1:26", "3Mbynm0pGX0": "4 h 27 m",
       "DSCKfXpAGHc": "1:00", "wxN1T1uxQ2g": "2:42"}
CUE = {"Uo9z2gIUmUo": "DO NOT OPEN", "3Mbynm0pGX0": "10:12 AM",
       "DSCKfXpAGHc": "11:16 AM", "wxN1T1uxQ2g": "on demand"}
MEDIA = []
seen = set()
for m in s9["media"]:
    vid = m["url"].rsplit("=", 1)[-1]
    if (vid, m["title"]) in seen: continue
    seen.add((vid, m["title"]))
    MEDIA.append((m["title"], CUE.get(vid, m["playIn"]), m["url"],
                  DUR.get(vid, "?") + " long \u00b7 " + m["timestamp"], m["note"]))
for t_ in terms:
    vid = t_["url"].rsplit("=", 1)[-1]
    MEDIA.append((t_["term"] + " (glossary clip)", CUE.get(vid, "on demand"), t_["url"],
                  DUR.get(vid, "?") + " long \u00b7 " + ("Throughout" if t_["term"] == "Gesturality"
                   else t_["timestamp"]), t_["look"]))

CSS = """
@page { size: letter; margin: 0.55in 0.6in 0.55in 0.6in; }
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font:10.5pt/1.45 "Helvetica Neue",Helvetica,Arial,sans-serif;color:#111;background:#fff;
     max-width:7.3in;margin:0 auto;padding:22px 0 40px}
h1,h2,h3,h4{font-weight:700;letter-spacing:-.012em}
.rule{border:0;border-top:2.5pt solid #111;margin:0}
.thin{border:0;border-top:.5pt solid #b9b9b4;margin:0}

header{margin-bottom:14px}
.kick{font-size:7.6pt;font-weight:700;letter-spacing:.17em;text-transform:uppercase;color:#a4442a}
h1{font-size:27pt;line-height:.98;margin:7px 0 4px}
h1 span{display:block;font-size:12.5pt;font-weight:400;color:#444;letter-spacing:0;margin-top:7px}
.meta{display:flex;flex-wrap:wrap;gap:0 26px;font-size:8.6pt;color:#333;margin:11px 0 0;
      padding-top:9px;border-top:.5pt solid #b9b9b4}
.meta b{display:block;font-size:7.2pt;letter-spacing:.13em;text-transform:uppercase;color:#7c7c76}

h2{font-size:8.4pt;letter-spacing:.17em;text-transform:uppercase;color:#a4442a;
   margin:26px 0 9px;padding-bottom:5px;border-bottom:2.5pt solid #111}
h2 small{float:right;font-size:7.4pt;letter-spacing:.09em;color:#7c7c76;font-weight:400;
         text-transform:none;padding-top:2px}

table{width:100%;border-collapse:collapse;table-layout:fixed}
.obj td{padding:9px 0;border-bottom:.5pt solid #d7d7d2;vertical-align:top}
.obj .n{width:30px;font-size:17pt;font-weight:700;color:#a4442a;line-height:1}
.obj .x{width:104px;text-align:right;font-size:6.9pt;font-weight:700;letter-spacing:.1em;
        text-transform:uppercase;color:#fff;padding-left:9px}
.obj .x span{display:inline-block;background:#111;padding:3px 6px}
.obj .x span.warn{background:#a4442a}
.obj .x span.ok{background:#8a8a84}
.obj h4{font-size:11pt;margin-bottom:3px}
.obj p{font-size:9pt;color:#333}

.blk td{padding:9px 0;border-bottom:.5pt solid #d7d7d2;vertical-align:top}
.blk .t{width:86px;padding-right:12px}
.blk .t b{display:block;font-size:12.5pt;line-height:1.05;letter-spacing:-.02em}
.blk .t span{display:block;font-size:9pt;color:#7c7c76;line-height:1.15}
.blk .t i{display:block;font-style:normal;font-size:6.9pt;font-weight:700;letter-spacing:.1em;
          text-transform:uppercase;color:#a4442a;margin-top:4px}
.blk .b h4{font-size:10.5pt;margin-bottom:3px}
.blk .b p{font-size:9pt;color:#2b2b2b}
.blk.brk .b h4,.blk.brk .t b{color:#7c7c76}
.blk.tick .b{border-left:2.5pt solid #a4442a;padding-left:10px}

.day td{padding:6px 0;border-bottom:.5pt solid #d7d7d2;font-size:9pt;vertical-align:top}
.day .h{width:74px;font-weight:700}
.day .w{width:62px;text-align:right;font-size:6.9pt;font-weight:700;letter-spacing:.09em;
        text-transform:uppercase;color:#a4442a}
.day tr.now td{background:#f2ece4}
.day .s{color:#666;font-size:8.4pt}

.frayer{border:.5pt solid #b9b9b4;margin-bottom:9px;break-inside:avoid}
.frayer h4{font-size:11pt;background:#111;color:#fff;padding:5px 9px}
.fg{display:grid;grid-template-columns:1fr 1fr}
.fg>div{padding:7px 9px;border-top:.5pt solid #d7d7d2}
.fg>div:nth-child(odd){border-right:.5pt solid #d7d7d2}
.fg b{display:block;font-size:6.9pt;font-weight:700;letter-spacing:.11em;text-transform:uppercase;
      color:#a4442a;margin-bottom:3px}
.fg p{font-size:8.6pt;line-height:1.4}
.u{font-size:7.4pt;color:#666;word-break:break-all}

.med td{padding:7px 0;border-bottom:.5pt solid #d7d7d2;font-size:8.8pt;vertical-align:top}
.med .c{width:78px;font-size:6.9pt;font-weight:700;letter-spacing:.09em;text-transform:uppercase;
        color:#a4442a;padding-right:10px}
.med h4{font-size:9.6pt;margin-bottom:2px}
.med .u{display:block;margin-top:3px}

.box{border:2.5pt solid #111;padding:11px 13px;margin:11px 0;break-inside:avoid}
.box.warn{border-color:#a4442a}
.box h4{font-size:9.4pt;margin-bottom:5px}
.box p{font-size:8.8pt;margin-bottom:5px}
.box p:last-child{margin-bottom:0}
.box ul{margin-left:15px;font-size:8.8pt}
.box li{margin-bottom:3px}

.lines{margin-top:7px}
.lines div{border-bottom:.5pt solid #9a9a94;height:23px}
.blk td,.obj td,.day td,.med td{break-inside:avoid}
h2{break-after:avoid}
.pg{break-before:page}
footer{margin-top:26px;padding-top:8px;border-top:.5pt solid #b9b9b4;
       font-size:7.4pt;color:#7c7c76;line-height:1.5}
@media screen{body{padding:34px 24px 60px}}
"""

HTML = f"""<!doctype html>
<html lang="en"><head>
<!-- STYLE: Muller-Brockmann (Swiss timetable) | WHY: this is a run sheet read while standing at a podium mid-sentence, so the first read has to be the CLOCK; everything hangs off one rule, hierarchy comes from size and white space alone, and there is exactly one accent colour so the thing that is burning can be the only thing that is red | ALT: Wyman signage, rejected because signage is built for someone moving past at ten feet and Gordon is holding this at eighteen inches, and because I shipped Wyman hours ago today. -->
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>CTIN 290 Session 9, professor's guide</title>
<style>{CSS}</style></head>
<body>

<header>
<p class="kick">CTIN 290 &middot; Digital Media Workshop &middot; From Console to Community</p>
<h1>Session 9<span>Critical Role and long-form narrative. {e(s9['unit'])}.</span></h1>
<div class="meta">
<div><b>Date</b>Monday 21 September 2026</div>
<div><b>Time</b>10:00 AM to 12:50 PM</div>
<div><b>Length</b>170 minutes</div>
<div><b>Room</b>SCI L104</div>
<div><b>Section</b>18432</div>
</div>
</header>

<h2>Before you walk in<small>two things on the calendar sit on top of this class</small></h2>
<table class="day">
{''.join(f'<tr class="{c}"><td class="h">{h}</td><td><b>{t}</b><br><span class="s">{s}</span></td>'
         f'<td class="w">{"CLASH" if c=="clash" else ("NOW" if c=="now" else "")}</td></tr>'
         for h,t,s,c in DAY)}
</table>
<div class="box warn">
<h4>The two collisions, plainly</h4>
<p><b>Gini Benson's faculty meeting ends at 10:00 and class starts at 10:00.</b> You cannot be on Zoom at
9:59 and in SCI L104 at 10:00. Leave the Zoom at 9:45 or accept that Session 9 opens at 10:10, which costs
you the opening block.</p>
<p><b>Gordon / Alex is booked 10:00 to 12:00, straight through the class.</b> It is a recurring hold on the
GGP calendar, so it does not show next to CTIN 290 on your main one. Alex is owed a prompt answer, so move
it rather than ghost it.</p>
</div>

<h2>Three objectives, ranked<small>if you ran out of time, cut from the bottom</small></h2>
<table class="obj">
{''.join(f'<tr><td class="n">{i+1}</td><td><h4>{e(h)}</h4><p>{e(b)}</p></td>'
         f'<td class="x"><span class="{"warn" if i==0 else ("" if i==1 else "ok")}">{e(x)}</span></td></tr>'
         for i,(h,b,x) in enumerate(OBJ))}
</table>
<div class="box">
<h4>Where the slack actually is</h4>
<p>Synthesis runs <b>59 minutes</b>, from 11:46 to 12:45. It is by far the longest block and the only one
with real give in it. If you are behind after the break, take it out of there, not out of Hamilton.
Fifteen minutes of peer sharing still does the work; skipping the second text loses the day's idea.</p>
</div>

<h2>The run sheet<small>wall clock, because elapsed minutes are useless while teaching</small></h2>
<table>{block_html()}</table>

<h2>Say these four things out loud</h2>
<div class="box">
<ul>
<li><b>At 10:00.</b> "Four hundred and fifty hours of performance, one camera that barely moves. By noon
you will be able to tell these people apart with the sound off."</li>
<li><b>At 11:16, opening Hamilton.</b> "In a theater your eye chooses. On a screen somebody chose for you.
What did that buy, and what did it cost?"</li>
<li><b>Whenever you name a term.</b> Show it on screen first, define it second. All three of today's terms
are visible before they are words.</li>
<li><b>At 12:45, collecting the exit tickets.</b> "One term and where you saw it. One thing you are still
unsure of. The second line is the one I actually need."</li>
</ul>
</div>

<h2>Today's three terms<small>seen before defined, one question each</small></h2>
{frayer()}

<h2>Media, in play order</h2>
<table class="med">
{''.join(f'<tr><td class="c">{e(c)}</td><td><h4>{e(t)}</h4><p>{e(n)}</p>'
         f'<span class="u">{e(u)} &middot; {e(ts)}</span></td></tr>' for t,c,u,ts,n in MEDIA)}
</table>
<div class="box warn">
<h4>The 10:12 block cannot run as written, and this is the one thing to fix before you walk in</h4>
<p><b>"Watch CR opening 30 min" points at a video that is 1 minute 26 seconds long.</b>
<code>Uo9z2gIUmUo</code> is a clip called <i>The Tables Converge</i>. Open it at 10:12 and you have
eighty-six seconds and then thirty-four minutes of nothing in front of twelve people.</p>
<p><b>Play <code>3Mbynm0pGX0</code> instead.</b> That is <i>The Fall of Thjazi Fang, Campaign 4,
Episode 1</i>, four hours and twenty-seven minutes, the actual episode with the actual character
introductions in it. Same official channel. Durations checked twice tonight, two different methods,
same answers.</p>
<p><b>Scrub it before 10:00 and write the number here, because a cold scrub in front of the room is
four minutes you do not have:</b> the episode proper starts at <b>_______</b> and you stop at
<b>_______</b>.</p>
<p><b>Hamilton is sixty seconds and the block is thirty minutes.</b> That is not a problem, it is the
shape of the block: play it three times. Cold. Again muted, so they watch only where the cuts land.
Then a third time with the room calling each cut out loud. Ninety seconds of tape, twenty-eight
minutes of argument.</p>
<p><b>Two smaller ones.</b> "Action Sequences" is the same 1:26 clip under a different name, so there
is no third Critical Role video. And the glossary calls <code>3Mbynm0pGX0</code> "Key Character
Moments" and says "sample any 10 min" with no timestamp, which is a four and a half hour video; pick
your ten minutes tonight, not at the podium.</p>
</div>

<h2>What is due, and what is coming</h2>
<div class="box">
<ul>
<li><b>Thursday 24 September, 5:00 PM PT. Visual Analysis Video, 10%.</b> One world, two media, three to
five minutes. Session 9 is the last Monday before it lands, and today's whole first hour is the skill it
is graded on. Say the deadline out loud at 10:00 and again at 12:45.</li>
<li><b>Tonight's homework, from the synthesis block.</b> Watch one hour of Critical Role. Annotate one
character's visual arc.</li>
<li><b>Mood board.</b> The rubric says the file is due <b>Thursday 1 October</b> with presentations Monday
5 October. The grading table in the same guide still says 24 September. <b>These contradict each other and
students will ask.</b> Say 1 October, which is the corrected date and the one the rubric explains, then
get the grading table fixed.</li>
</ul>
</div>

<h2>What they were asked to do before today<small>from the syllabus, so you can ask for it</small></h2>
<div class="box">
<p>Sample ten minutes of Critical Role Campaign 4, Episode 1 before class. Rewatch Blocking,
Gesturality and Reaction Shot afterwards.</p>
<p><b>Session 9 collects nothing and issues no graded work.</b> Nothing is due at the door today, so
the only thing you are chasing in the room is whether they watched.</p>
</div>

<h2>One spare activity, if you finish early</h2>
<div class="box">
<h4>Sound off, five minutes</h4>
<p>Play any ten minutes of <code>3Mbynm0pGX0</code> with the audio muted. Ask them to write down, without
conferring, who is currently the most powerful person at that table and what told them. Then unmute and
play the same ten minutes again.</p>
<p>It costs five minutes, it proves gesturality and reaction shot in one move, and it hands them a method
they can use on Thursday's assignment tonight.</p>
</div>

<h2>After class, two lines<small>write them before you open the laptop</small></h2>
<div class="box">
<p><b>What paid for the extra minutes today?</b></p>
<div class="lines"><div></div><div></div></div>
<p style="margin-top:9px"><b>What is the most common thing on the exit tickets, and how do you open Session 10 with it?</b></p>
<div class="lines"><div></div><div></div></div>
</div>

<footer>
Session text, timing blocks and glossary entries are lifted verbatim from the CTIN 290 Fall 2026
Teacher's Guide, artifact ede331ff. Objectives, the ranking, the wall clock, the spare activity, the
four spoken lines and the defect notes are Darby's and are marked as such.
Every video verified live against the YouTube oEmbed endpoint on 20 September 2026.
Calendar read from gbellamy@gmail.com and ggpcharity@gmail.com the same evening.
Built for letter paper.
</footer>

</body></html>"""

pathlib.Path("index.html").write_text(HTML, encoding="utf-8")
print("wrote index.html", len(HTML), "bytes")
print("blocks:", len(rows), "terms:", len(terms), "media:", len(MEDIA))
tot = rows[-1][1] - rows[0][0]
assert tot == 170, tot
print("run sheet spans", tot, "minutes, 10:00 to", clock(rows[-1][1]).replace("\u00a0"," "))
