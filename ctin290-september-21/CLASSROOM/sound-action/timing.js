(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.StrikeTiming = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const FIRST = 2.4, INTERVAL = 1.6, REPEATS = 6, DURATION = 11.6;
  const COUNT_IN = [0.25, 0.90, 1.55];
  const IMPACTS = Array.from({length: REPEATS}, (_, i) => FIRST + i * INTERVAL);
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const mix = (a, b, n) => a + (b - a) * clamp(n, 0, 1);
  const ease = n => (n = clamp(n, 0, 1)) * n * (3 - 2 * n);
  function events(offset) {
    return [...COUNT_IN.map((time, i) => ({time, kind:'count', index:i})),
      ...IMPACTS.map((time, i) => ({time:time + offset, kind:'impact', index:i}))]
      .sort((a,b) => a.time-b.time);
  }
  function futureEvents(position, offset) {
    // A resume never retriggers an event at or before the paused position.
    return events(offset).filter(event => event.time > position + 1e-7);
  }
  function schedule(position, offset, audioStart) {
    return futureEvents(position, offset).map(e => ({...e, when:audioStart + e.time - position}));
  }
  function positionAt(audioNow, anchorAudio, anchorPosition) {
    return clamp(anchorPosition + Math.max(0, audioNow - anchorAudio), 0, DURATION);
  }
  function scene(time, offset, reduced) {
    const t = clamp(time, 0, DURATION);
    const index = clamp(Math.floor((t - FIRST + 0.75) / INTERVAL), 0, REPEATS - 1);
    const impact = IMPACTS[index], relative = t - impact;
    let angle = -20, phase = 'READY';
    if (relative >= -0.75 && relative < -0.30) {
      phase = 'WINDUP'; angle = mix(-20, -58, ease((relative + .75) / .45));
    } else if (relative >= -.30 && relative < 0) {
      phase = 'STRIKE'; angle = mix(-58, 0, ((relative + .30) / .30) ** 2);
    } else if (relative >= 0 && relative < .18) {
      phase = 'CONTACT'; angle = 0;
    } else if (relative >= .18 && relative < .70) {
      phase = 'RELEASE'; angle = mix(0, -20, ease((relative - .18) / .52));
    }
    const contact = relative >= 0 && relative < .18;
    const sounding = IMPACTS.some(at => t >= at + offset && t < at + offset + .16);
    let count = '';
    if (t < 1.8) {
      const n = COUNT_IN.filter(at => t >= at).length;
      count = n > 0 ? String(4 - n) : 'READY';
    }
    // Reduced motion replaces the moving arm with two fixed poses. Timing cues remain.
    if (reduced) angle = contact ? 0 : -35;
    return {time:t,index,impact,relative,angle,phase,contact,sounding,count,
      timeline:clamp((relative + .75) / 1.5, 0, 1),
      progress:clamp(t / DURATION, 0, 1)};
  }
  return {FIRST,INTERVAL,REPEATS,DURATION,COUNT_IN,IMPACTS,clamp,events,futureEvents,schedule,positionAt,scene};
});
