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
 ("10:00\u00a0AM", "Gordon / Alex, Google Meet", "Recurring hold on the GGP calendar. NOT happening today, Gordon confirmed.", "dead"),
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
.day tr.dead td{color:#9a9a93;text-decoration:line-through;text-decoration-color:#c9c9c2}
.day tr.dead td.w{color:#9a9a93;text-decoration:none}
.day tr.dead .s{color:#a5a59e}
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
h3.sub{font-size:10.5pt;margin:15px 0 6px;padding-bottom:3px;border-bottom:1.4pt solid #111;
        display:flex;justify-content:space-between;align-items:baseline;gap:12px}
h3.sub span{font-weight:400;font-size:8.4pt;color:#6d6d66;letter-spacing:0;white-space:nowrap}
h3.sub code{font-size:9pt}
table{max-width:100%}
table.cue{width:100%;border-collapse:collapse;font-size:8.7pt;break-inside:auto;table-layout:fixed}
table.cue td,table.cue th{overflow-wrap:anywhere}
table.cue th{font-size:7.2pt;text-transform:uppercase;letter-spacing:.11em;color:#6d6d66;
             text-align:left;padding:0 6px 3px 0;border-bottom:.5pt solid #b9b9b4;font-weight:700}
table.cue td{padding:6px 6px 6px 0;border-bottom:.5pt solid #e2e2dc;vertical-align:top;line-height:1.42}
table.cue tr{break-inside:avoid}
table.cue td:nth-child(1),table.cue td:nth-child(2),table.cue td:nth-child(3){
  font-family:"SF Mono",Menlo,Consolas,monospace;font-size:8pt;white-space:nowrap}
table.cue td:nth-child(3){color:#6d6d66}
table.cue tr.go td{background:#fbf4f1}
table.cue tr.no td{background:#f3f3ef;color:#5a5a54}
td.v,td.x,td.m{font:700 7.2pt "Helvetica Neue",Helvetica,Arial,sans-serif;letter-spacing:.09em;
               text-align:right;white-space:nowrap}
td.v{color:#a4442a}
td.x{color:#111}
td.m{color:#9a9a93}
.diag{margin:14px 0 0;break-inside:avoid}
.diag+.diag{margin-top:18px;padding-top:14px;border-top:.5pt solid #d8d8d2}
.diag figcaption{font-size:8.6pt;color:#333;margin-bottom:7px}
.diag svg{width:100%;height:auto;display:block;background:#fff}
.diag .cap{font-size:8.6pt;line-height:1.5;margin-top:8px}
.ts{font-family:"SF Mono",Menlo,Consolas,monospace;font-size:.92em;background:#f2f2ee;
    padding:.5pt 3pt;border:.5pt solid #ddddd6;white-space:nowrap}
text.dl{font:600 8px "Helvetica Neue",Helvetica,Arial,sans-serif;fill:#111}
text.dt{font:600 7px "Helvetica Neue",Helvetica,Arial,sans-serif;fill:#6d6d66;letter-spacing:.05em}
text.dh{font:700 8.5px "Helvetica Neue",Helvetica,Arial,sans-serif;fill:#111;letter-spacing:.11em}
text.dn{font:700 9px "Helvetica Neue",Helvetica,Arial,sans-serif;fill:#fff}
text.dn.dk{fill:#111}
text.acc,.acc{fill:#a4442a;color:#a4442a}
.pg{break-before:page}
footer{margin-top:26px;padding-top:8px;border-top:.5pt solid #b9b9b4;
       font-size:7.4pt;color:#7c7c76;line-height:1.5}
@media screen{body{padding:34px 24px 60px}}
@media screen and (max-width:820px){
  body{max-width:100%;padding:22px 16px 48px}
  h1{font-size:22pt}
  h3.sub{flex-direction:column;align-items:flex-start;gap:2px}
  table.cue th:first-child,table.cue td:first-child{padding-left:0}
  table.cue td:nth-child(3),table.cue th:nth-child(3){display:none}
  .day .h{width:66px}
  .day .w{width:54px}
  .meta{gap:0 16px}
}
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

<h2>Before you walk in<small>what is actually sitting on top of this class</small></h2>
<table class="day">
{''.join(f'<tr class="{c}"><td class="h">{h}</td><td><b>{t}</b><br><span class="s">{s}</span></td>'
         f'<td class="w">{"CLASH" if c=="clash" else ("NOW" if c=="now" else ("NOT TODAY" if c=="dead" else ""))}</td></tr>'
         for h,t,s,c in DAY)}
</table>
<div class="box warn">
<h4>One real collision, and one ghost</h4>
<p><b>Gini Benson's faculty meeting ends at 10:00 and class starts at 10:00.</b> You cannot be on Zoom at
9:59 and in SCI L104 at 10:00. Leave the Zoom at 9:45 or accept that Session 9 opens at 10:10, which costs
you the opening block.</p>
<p><b>"Gordon / Alex", 10:00 to 12:00, is not happening today.</b> Gordon said so directly, and he is the
source that counts on his own morning. It is a standing recurring hold that Alex owns, it still prints on the
GGP calendar every Monday, and it is invisible next to CTIN 290 on the main one, which is exactly how it got
into the first draft of this page. <b>Kill the recurrence or decline the series</b>, or the next person who
reads this calendar, machine or human, makes the same mistake again.</p>
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

<h2 class="pg">Blocking, drawn<small>the same scene as a plan view, because blocking is a floor, not a definition</small></h2>
<div class="box">
<p>Both of today's clips block a scene in a way you can point at. Draw these on the board before you play
the tape, or put this page under the document camera. The rule the diagrams teach: <b>blocking is position
plus trajectory</b>, and it is doing work before anybody speaks.</p>

<figure class="diag">
<figcaption><b>A.</b> Critical Role, <span class="ts">0:37:31 to 0:40:52</span>. Nobody is on a screen here.
The Game Master says a floor plan out loud and four players stand on it.</figcaption>
<svg viewBox="0 0 700 312" role="img" aria-label="Director's floor plan: Thaisha and Occtis climb a cobblestone street toward the Fang house, while Hal, already facing downhill, waits in the doorway he chose after spotting them from the window.">
  <defs>
    <pattern id="cobble" width="15" height="15" patternUnits="userSpaceOnUse" patternTransform="rotate(-17)">
      <rect width="15" height="15" fill="#f4f4f0"/>
      <path d="M0 7.5h15M7.5 0v7.5M7.5 7.5v7.5" stroke="#dcdcd4" stroke-width="1.1"/>
    </pattern>
    <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="#a4442a"/></marker>
    <marker id="ahk" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="#8a8a82"/></marker>
  </defs>

  <path d="M8 268 L22 186 L468 86 L470 152 Z" fill="url(#cobble)" stroke="#c6c6bd" stroke-width="1.2"/>
  <g stroke="#cfcfc7" stroke-width="1.8" fill="none">
    <path d="M150 232 l22 -5 l-22 -5"/><path d="M240 212 l22 -5 l-22 -5"/><path d="M330 192 l22 -5 l-22 -5"/>
  </g>

  <path d="M470 20 h220 v170 h-220 z" fill="#efefec" stroke="#111" stroke-width="1.8"/>
  <text x="678" y="40" class="dl" text-anchor="end">the Fang home</text>
  <path d="M470 96 v54" stroke="#fff" stroke-width="7"/>
  <path d="M470 96 v54" stroke="#a4442a" stroke-width="3"/>
  <text x="484" y="170" class="dl acc">the door frame he chose</text>
  <path d="M560 56 h60 v11 h-60 z" fill="#fff" stroke="#8a8a82" stroke-width="1.3"/>
  <text x="590" y="50" class="dt" text-anchor="middle">window</text>

  <path d="M128 224 C 214 200, 310 166, 416 134" fill="none" stroke="#a4442a" stroke-width="2.6" marker-end="url(#ah)"/>
  <text x="222" y="222" class="dl acc" transform="rotate(-12 222 222)">they climb toward him</text>
  <text x="352" y="196" class="dt" transform="rotate(-12 352 196)">cobblestone street, rising</text>

  <path d="M586 72 C 500 96, 320 168, 178 218" fill="none" stroke="#8a8a82" stroke-width="1.2" stroke-dasharray="5 4" marker-end="url(#ahk)"/>
  <text x="14" y="100" class="dt">He heard them coming and found them from the window,</text>
  <text x="14" y="113" class="dt">so he was already standing here when they arrived. 0:40:40</text>

  <g class="act">
    <path d="M104 232 m-9 -14 a17 17 0 0 1 17 -1 z" fill="#111"/>
    <circle cx="104" cy="232" r="16" fill="#111"/><text x="104" y="237" class="dn" text-anchor="middle">T</text>
  </g>
  <text x="100" y="282" class="dl" text-anchor="middle">Thaisha</text>
  <text x="100" y="294" class="dt" text-anchor="middle">6&#8242;4&#8243;, in motion</text>

  <g class="act">
    <path d="M158 250 m-7 -11 a13 13 0 0 1 13 -1 z" fill="#111"/>
    <circle cx="158" cy="250" r="12.5" fill="#fff" stroke="#111" stroke-width="2"/>
    <text x="158" y="255" class="dn dk" text-anchor="middle">O</text>
  </g>
  <text x="176" y="282" class="dl" text-anchor="middle">Occtis</text>
  <text x="176" y="294" class="dt" text-anchor="middle">in motion</text>
  <circle cx="196" cy="264" r="5" fill="#a4442a"/><text x="208" y="268" class="dt acc">fox</text>

  <g class="act">
    <path d="M446 124 m-16 -9 a18 18 0 0 0 0 18 z" fill="#111"/>
    <circle cx="446" cy="124" r="16" fill="#fff" stroke="#111" stroke-width="2.6"/>
    <text x="446" y="129" class="dn dk" text-anchor="middle">H</text>
  </g>
  <text x="430" y="62" class="dl" text-anchor="middle">Hal</text>
  <text x="430" y="74" class="dt" text-anchor="middle">still, and already</text>
  <text x="430" y="85" class="dt" text-anchor="middle">facing downhill</text>

  <g transform="translate(300,286)">
    <circle cx="9" cy="5" r="9" fill="#fff" stroke="#111" stroke-width="2"/>
    <path d="M9 5 m-9 -5 a10 10 0 0 0 0 10 z" fill="#111"/>
    <text x="26" y="9" class="dt">the wedge is the way the body faces &#183; red is movement &#183; gray is a line of sight</text>
  </g>
</svg>
<p class="cap"><b>What the drawing gets you.</b> Two characters move, one does not, and the one who does not
move is the one who chose his position. Liam blocks Hal into the doorway out loud at <span class="ts">0:40:40</span>:
&ldquo;he heard conversation coming up the cobbled streets and spotted them out the window, so by the time you
arrive at the door, Hal is leaning against the frame, just smiling at you as you approach.&rdquo; Ask the room:
<b>who picked that spot, and what does standing there say that a line of dialogue would have had to say?</b></p>
</figure>

<figure class="diag">
<figcaption><b>B.</b> Hamilton, <span class="ts">0:27 to 0:41</span>. Same stage, two different machines
deciding what you look at.</figcaption>
<svg viewBox="0 0 700 290" role="img" aria-label="Left: a theater plan where one viewer's eye covers the whole stage at once. Right: the same stage as the camera frames it, in three successively tighter crops, only one of which is printed.">
  <text x="8" y="16" class="dh">IN THE ROOM &#183; your eye chooses</text>
  <path d="M10 30 h318 v118 h-318 z" fill="#efefec" stroke="#111" stroke-width="1.5"/>
  <text x="169" y="46" class="dt" text-anchor="middle">the stage, all of it, all the time</text>
  <g class="act">
    <path d="M86 92 m-11 -6 a12 12 0 0 0 0 12 z" fill="#a4442a"/>
    <circle cx="86" cy="92" r="11" fill="#a4442a"/><text x="86" y="96" class="dn" text-anchor="middle">A</text>
  </g>
  <text x="86" y="120" class="dl acc" text-anchor="middle">Angelica</text>
  <g fill="#fff" stroke="#111" stroke-width="1.8">
    <circle cx="204" cy="80" r="9"/><circle cx="238" cy="80" r="9"/><circle cx="272" cy="80" r="9"/>
    <circle cx="221" cy="108" r="9"/><circle cx="255" cy="108" r="9"/><circle cx="289" cy="108" r="9"/>
  </g>
  <text x="246" y="134" class="dl" text-anchor="middle">the company, answering underneath her</text>
  <path d="M169 262 L24 158 L314 158 Z" fill="#111" opacity="0.07"/>
  <path d="M169 262 L24 158 M169 262 L314 158" stroke="#111" stroke-width="1.1" stroke-dasharray="4 3"/>
  <circle cx="169" cy="266" r="10" fill="none" stroke="#111" stroke-width="2"/>
  <circle cx="169" cy="266" r="3.4" fill="#111"/>
  <text x="169" y="286" class="dl" text-anchor="middle">you, seat J14. Every one of them is available to you.</text>

  <text x="372" y="16" class="dh acc">ON THE SCREEN &#183; somebody chose for you</text>
  <path d="M372 30 h318 v118 h-318 z" fill="#efefec" stroke="#111" stroke-width="1.5"/>
  <g class="act">
    <path d="M448 92 m-11 -6 a12 12 0 0 0 0 12 z" fill="#a4442a"/>
    <circle cx="448" cy="92" r="11" fill="#a4442a"/><text x="448" y="96" class="dn" text-anchor="middle">A</text>
  </g>
  <g fill="#fff" stroke="#111" stroke-width="1.8">
    <circle cx="566" cy="80" r="9"/><circle cx="600" cy="80" r="9"/><circle cx="634" cy="80" r="9"/>
    <circle cx="583" cy="108" r="9"/><circle cx="617" cy="108" r="9"/><circle cx="651" cy="108" r="9"/>
  </g>
  <path d="M380 38 h302 v102 h-302 z" fill="none" stroke="#9a9a93" stroke-width="1.1" stroke-dasharray="4 3"/>
  <text x="385" y="50" class="dt">WIDE, not used</text>
  <path d="M410 56 h140 v72 h-140 z" fill="none" stroke="#9a9a93" stroke-width="1.1" stroke-dasharray="4 3"/>
  <text x="415" y="68" class="dt">MID, not used</text>
  <path d="M428 66 h44 v52 h-44 z" fill="none" stroke="#a4442a" stroke-width="3"/>
  <text x="428" y="140" class="dt acc">CLOSE &#183; the only one that got printed</text>
  <path d="M531 176 L481 148 L581 148 Z" fill="#111" opacity="0.07"/>
  <path d="M531 176 L481 148 M531 176 L581 148" stroke="#111" stroke-width="1.1"/>
  <path d="M508 176 h46 v30 h-46 z" fill="#111"/>
  <path d="M554 182 l20 -10 v26 z" fill="#111"/>
  <circle cx="531" cy="191" r="7" fill="#fff"/>
  <text x="531" y="228" class="dl" text-anchor="middle">the camera. It had all three. You get one.</text>
  <text x="531" y="242" class="dt" text-anchor="middle">and you cannot look away from it, or around it, or behind it</text>
</svg>
<p class="cap"><b>What the drawing gets you.</b> At <span class="ts">0:27</span> Angelica sings
&ldquo;To your Union!&rdquo; and the company answers her in the same bars, in parentheses, underneath.
<b>Two things happen at once and only one of them can be the close-up.</b> In the house you decide, in
real time, whether to watch her or watch them. On the Disney+ cut, the edit already decided, and you cannot
undo it. That is the whole 11:16 argument in one 14&#8209;second stretch of tape. The gain is real:
seat J14 never gets her face that size. Name the gain first, then the loss.</p>
</figure>
</div>

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
<p><b>You do not have to scrub it. The numbers are below</b>, pulled tonight off the episode's own
caption track. The short version: the episode opens <i>cold and in character</i>, and the Game Master spends
the first nineteen minutes asking his players, one at a time, to describe what their character looks like.
Your 10:48 activity is performed by the cast, on camera, before the show's own title card.</p>
<p><b>And there is a trap inside "the first 30 minutes."</b> At 0:18:51 the cold open ends and the show
runs nine minutes of announcements and a sponsor sketch about wedding rings. Play 0:00 to 0:30 straight
and you will be standing in front of twelve students watching Sam Riegel refuse to come out of his
dressing room.</p>
<p><b>Hamilton is sixty seconds and the block is thirty minutes.</b> That is not a problem, it is the
shape of the block: play it three times. Cold. Again muted, so they watch only where the cuts land.
Then a third time with the room calling each cut out loud. Ninety seconds of tape, twenty-eight
minutes of argument.</p>
<p><b>Two smaller ones.</b> "Action Sequences" is the same 1:26 clip under a different name, so there
is no third Critical Role video. And the glossary calls <code>3Mbynm0pGX0</code> "Key Character
Moments" and says "sample any 10 min" with no timestamp, which is a four and a half hour video; pick
your ten minutes tonight, not at the podium.</p>
</div>


<h2 class="pg">Inside the videos<small>in and out points, off each video&rsquo;s own caption track</small></h2>

<h3 class="sub">Critical Role, <code>3Mbynm0pGX0</code><span>4 h 27 m &middot; your 10:12 block</span></h3>
<table class="cue">
<tr><th>In</th><th>Out</th><th>Run</th><th>What is on screen</th><th>Do</th></tr>
<tr class="go"><td>0:00:00</td><td>0:18:51</td><td>18m 51s</td>
<td><b>The cold open, and the best eighteen minutes of teaching tape in this course.</b> Brennan Lee Mulligan
opens on Liam O&rsquo;Brien: &ldquo;someone you love very much is about to die. Could you please introduce us to
your character?&rdquo; Hal answers at <span class="ts">0:00:15</span> and describes himself: an older orc,
dark hair streaked white, &ldquo;fairly fine but not ostentatious clothing,&rdquo; smile lines at the eyes
&ldquo;from a life well lived.&rdquo; Brennan lays in the Guardian Wall and the gallows. At
<span class="ts">0:04:59</span> he turns to Luis Carazo and Azune Nayar gets the same treatment: the braid,
the birthmark up the right side of the face, eyes &ldquo;like a sunset on an ocean.&rdquo;</td>
<td class="v">PLAY</td></tr>
<tr class="no"><td>0:18:51</td><td>0:27:47</td><td>8m 56s</td>
<td><b>Announcements and the Thorum sponsor sketch.</b> Fanfare, a bit about Sam Riegel refusing to leave
his dressing room, a wedding-ring rap. Funny, and nine minutes of your class. The show itself calls it out:
Sam complains at <span class="ts">0:21:11</span> that there is &ldquo;this cold open now, before the best part
of the show: my ads.&rdquo; The game returns on &ldquo;welcome to Aram&aacute;n&rdquo; at
<span class="ts">0:27:47</span>.</td>
<td class="x">SKIP</td></tr>
<tr><td>0:27:47</td><td>0:37:43</td><td>9m 56s</td>
<td>The world proper: Dol-Makjar, the stage, the square. Good, not essential. This is the first place to cut
if you are behind.</td>
<td class="m">SPARE</td></tr>
<tr class="go"><td>0:37:43</td><td>0:41:00</td><td>3m 17s</td>
<td><b>Two more introductions and one piece of blocking said out loud.</b> &ldquo;Aabria, would you please
describe your character for us?&rdquo; Thaisha Lloy at <span class="ts">0:37:46</span>: 6&#8242;4&#8243;, an orc,
desaturated green skin, silver irises ringed in red, fingers going red and black at the tips, wearing her
family&rsquo;s colors, &ldquo;the blood and the soot and scale of smiths.&rdquo; Occtis Tachonis at
<span class="ts">0:39:17</span>: thin, dark noble clothing &ldquo;clean but worn,&rdquo; implements on the belt,
a book strapped to the leg, glassy-eyed, not blinking, a fox at his feet. Then at
<span class="ts">0:40:40</span> Liam puts Hal in the doorway. <b>That is diagram A.</b></td>
<td class="v">PLAY</td></tr>
</table>
<p class="cap"><b>Total tape: 22 minutes and 8 seconds inside a 36-minute block</b>, which leaves you fourteen
minutes to talk, and it lands you on the annotation activity already warm. Play 0:00:00 to 0:18:51, then
drag to 0:37:43.</p>
<p class="cap"><b>Say this out loud, because it is the actual lesson.</b> You cannot meet this cast in thirty
minutes. Tyranny does not name herself until <span class="ts">1:21:49</span>. Vaelus is introduced at
<span class="ts">4:11:16</span>, four hours in, in pure black. Character establishment in long-form is not a
scene, it is a <i>schedule</i>, and that is precisely what separates it from the ninety-minute film they are
comparing it against on Thursday.</p>

<h3 class="sub">Hamilton, <code>DSCKfXpAGHc</code><span>1:00 &middot; your 11:16 block, played three times</span></h3>
<table class="cue">
<tr><th colspan="2">At</th><th>Run</th><th>What is on screen</th><th>Do</th></tr>
<tr><td colspan="2">0:04</td><td>11s</td><td>&ldquo;Ladies and gentlemen, welcome to the show.&rdquo; An announcer, a
house, a curtain. The film opens by admitting it is a theater.</td><td class="m">pass 1</td></tr>
<tr><td colspan="2">0:15</td><td>12s</td><td>John Laurens: &ldquo;the ten-dollar Founding Father without a father.&rdquo;
One performer, one line, one obvious place to point the lens.</td><td class="m">pass 1</td></tr>
<tr class="go"><td colspan="2">0:27</td><td>14s</td><td><b>The fourteen seconds the whole block is built on.</b>
Angelica sings &ldquo;To your Union!&rdquo; and the company answers underneath her in the same bars, in
parentheses on the caption track: &ldquo;(To the Union! Revolution!)&rdquo; &hellip; &ldquo;(You provide, you
provide)&rdquo;. Two performances, simultaneous, one frame. Run it muted on pass 2 and have the room call the
cuts on pass 3.</td><td class="v">THE POINT</td></tr>
<tr><td colspan="2">0:46</td><td>6s</td><td>&ldquo;This&hellip; is Hamilton.&rdquo; Then the company on
&ldquo;Alexander Hamilton&rdquo; at 0:52.</td><td class="m">pass 1</td></tr>
</table>

<h3 class="sub">Everything Everywhere All At Once, <code>wxN1T1uxQ2g</code><span>2:42, not 2:26 &middot; the Gesturality clip</span></h3>
<table class="cue">
<tr><th colspan="2">At</th><th>Run</th><th>What is on screen</th><th>Do</th></tr>
<tr><td colspan="2">0:03</td><td>7s</td><td>&ldquo;Mrs. Wang, are you with us?&rdquo; Evelyn at the IRS desk, small,
cornered, apologetic.</td><td class="m">setup</td></tr>
<tr class="go"><td colspan="2">0:37</td><td>15s</td><td><b>Play exactly this for gesturality.</b> Same actor, same
face, a different man walks in: &ldquo;Evelyn, I&rsquo;m not your husband. I&rsquo;m another version of him from
another universe&rdquo; (<span class="ts">0:42</span>). The posture changes before the line explains it. Ask the
room which one they clocked first, the walk or the words.</td><td class="v">THE POINT</td></tr>
<tr><td colspan="2">0:56</td><td>12s</td><td>&ldquo;I&rsquo;ve seen thousands of Evelyns&hellip; you can access all
their memories, their emotions, even their skills.&rdquo; The thesis of the clip, and of the glossary entry.</td>
<td class="m">optional</td></tr>
<tr><td colspan="2">1:19</td><td>14s</td><td>&ldquo;Don&rsquo;t make me fight you, I am really good.&rdquo; /
&ldquo;I don&rsquo;t believe you.&rdquo; Then at 1:31, &ldquo;Wow, Mom is really good.&rdquo; One body, three
registers.</td><td class="m">optional</td></tr>
</table>
<p class="cap"><b>Fix in the glossary while you are here:</b> the Gesturality entry says 2:26. The video is
2:42, and the entry has no in point at all, which is what sent you to the whole trailer.</p>

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
Every video verified live against the YouTube oEmbed endpoint on 20 September 2026, and every duration
against the watch page&rsquo;s own lengthSeconds. The in and out points on this page were read on 21 September
2026 from each video&rsquo;s published caption track, which timestamps speech exactly; the quoted lines are
verbatim from it. What the camera is doing in any given second is the one thing a caption cannot tell you,
so the shot calls in the diagrams are arguments to make in the room, not claims about the edit.
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
