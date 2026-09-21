(() => {
  'use strict';
  const T = window.StrikeTiming, S = window.StrikeScene, $ = id => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let context = null, master = null, offset = 0, position = 0;
  let state = 'idle', generation = 0, frameId = null, testTimer = null;
  let anchorAudio = 0, anchorPosition = 0, announcedStrike = -1, clockKind = '';
  const sources = new Set();
  const modeName = () => offset === 0 ? 'On time' : offset < 0 ? 'Sound early' : 'Sound late';
  const status = text => { $('status').textContent = text; };

  function ensureContext() {
    if (!context) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error('Web Audio is unavailable');
      context = new Audio({latencyHint:'interactive'});
      master = context.createGain();
      master.gain.value = Number($('volume').value) / 100;
      master.connect(context.destination);
      context.addEventListener('statechange', () => {
        if (state === 'playing' && context.state !== 'running') {
          pause('Audio was interrupted. Press Resume when the room is ready.');
        }
      });
    }
    return context;
  }

  // The audio engine owns the schedule. Rendering never starts a sound.
  function tone(when, duration, frequency, endFrequency, gain, kind = 'sine') {
    const oscillator = context.createOscillator(), envelope = context.createGain();
    oscillator.type = kind;
    oscillator.frequency.setValueAtTime(frequency, when);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, when + duration);
    envelope.gain.setValueAtTime(0, when);
    envelope.gain.linearRampToValueAtTime(gain, when + .002);
    envelope.gain.exponentialRampToValueAtTime(.0001, when + duration);
    oscillator.connect(envelope); envelope.connect(master);
    const record = {oscillator,envelope}; sources.add(record);
    oscillator.onended = () => {
      sources.delete(record); oscillator.disconnect(); envelope.disconnect();
    };
    oscillator.start(when); oscillator.stop(when + duration + .01);
  }
  function impact(when) {
    // A crisp attack plus a lower resonant body survives ordinary room speakers.
    tone(when, .045, 1250, 720, .21, 'triangle');
    tone(when, .155, 185, 76, .46, 'sine');
  }
  function scheduleAudio(from) {
    T.schedule(from, offset, anchorAudio).forEach(event => {
      if (event.kind === 'impact') impact(event.when);
      else tone(event.when, .085, event.index === 2 ? 990 : 660,
        event.index === 2 ? 990 : 660, .20);
    });
  }
  function cancelSources() {
    for (const item of sources) {
      item.oscillator.onended = null;
      try { item.oscillator.stop(); } catch (_) { /* already ended */ }
      item.oscillator.disconnect(); item.envelope.disconnect();
    }
    sources.clear();
  }
  function invalidate() {
    ++generation;
    cancelAnimationFrame(frameId); frameId = null;
    clearTimeout(testTimer); testTimer = null;
    cancelSources();
  }
  function audibleTime(now = performance.now()) {
    if (context && typeof context.getOutputTimestamp === 'function') {
      const stamp = context.getOutputTimestamp();
      const age = now - stamp.performanceTime;
      if (stamp.contextTime > 0 && stamp.performanceTime > 0 && age >= -20 && age < 500) {
        clockKind = 'output timestamp';
        return stamp.contextTime + Math.max(0, age) / 1000;
      }
    }
    clockKind = 'latency estimate';
    return context ? Math.max(0, context.currentTime -
      (Number(context.baseLatency) || 0) - (Number(context.outputLatency) || 0)) : 0;
  }
  function currentPosition(now) {
    return state === 'playing' ? T.positionAt(audibleTime(now), anchorAudio, anchorPosition) : position;
  }
  function controls() {
    const running = state === 'playing' || state === 'starting' || state === 'testing';
    $('play').disabled = state === 'starting' || state === 'playing';
    $('play').textContent = state === 'starting' ? 'Preparing sound…' :
      state === 'paused' ? '▶ Resume with sound' : state === 'finished' ? '▶ Replay with sound' : '▶ Play with sound';
    $('pause').disabled = !running;
    $('stage').dataset.mode = state;
  }
  function paint() {
    const manual = state === 'manual';
    $('stage').innerHTML = S.render(position, offset, reduce.matches, manual);
    const scene = T.scene(position, offset, reduce.matches);
    document.querySelectorAll('.playhead').forEach(head => { head.style.left = `${scene.timeline * 100}%`; });
    $('sound-mark').style.left = `${(offset + .75) / 1.5 * 100}%`;
    const rel = Math.round((position - T.FIRST) * 1000);
    if (manual) {
      $('scrub').value = String(T.clamp(rel, -750, 750));
      $('scrub-value').textContent = `${rel > 0 ? '+' : rel < 0 ? '−' : ''}${Math.abs(rel)} ms`;
      const soundAt = offset * 1000;
      $('inspection-readout').textContent = `SILENT. Contact: 0 ms. Sound event: ${soundAt > 0 ? '+' : soundAt < 0 ? '−' : ''}${Math.abs(soundAt)} ms. ${scene.contact ? 'The mallet is touching the pad.' : 'The mallet is above the pad.'}`;
    }
  }
  function frame(now) {
    if (state !== 'playing') return;
    position = currentPosition(now); paint();
    const scene = T.scene(position, offset, reduce.matches);
    if (scene.index !== announcedStrike && position >= T.FIRST - .75) {
      announcedStrike = scene.index;
      status(`${modeName()} · strike ${scene.index + 1} of 6. ${offset === 0 ? 'Sound at contact.' : offset < 0 ? 'Sound a quarter second before contact.' : 'Sound a quarter second after contact.'}`);
    }
    if (position >= T.DURATION) {
      invalidate(); state = 'finished'; controls(); paint();
      context.suspend().catch(() => {});
      status(`${modeName()} complete. Choose another version and compare: what did you see, what did you hear?`);
      return;
    }
    frameId = requestAnimationFrame(frame);
  }
  async function start(restart = false) {
    const from = restart || state === 'finished' || state === 'manual' ? 0 : position;
    invalidate(); const token = generation;
    position = from; state = 'starting'; controls(); paint();
    status('Preparing sound. Listen for three count-in notes.');
    try {
      ensureContext(); await context.resume();
      if (token !== generation || document.hidden) {
        if (token === generation) pause('Paused because the page is not visible.');
        return;
      }
      if (context.state !== 'running') throw new Error('Audio did not start');
      anchorAudio = context.currentTime + .18; anchorPosition = from;
      announcedStrike = -1;
      scheduleAudio(from); state = 'playing'; controls();
      if (Number($('volume').value) === 0) status('Volume is at zero. Raise it to hear the comparison.');
      else status(from ? 'Resuming the same version.' : 'Three count-in notes, then six strikes. Watch the gap between mallet and pad.');
      frameId = requestAnimationFrame(frame);
    } catch (error) {
      if (token !== generation) return;
      invalidate(); state = 'paused'; controls(); paint();
      status('Sound did not start. Press Test sound once, then Play. Silent inspection and the backup films are also available.');
    }
  }
  function pause(message) {
    position = currentPosition();
    invalidate(); state = 'paused'; controls(); paint();
    if (context && context.state !== 'closed') context.suspend().catch(() => {});
    status(message || 'Paused. Resume continues this version; Restart includes the count-in again.');
  }
  function inspect(relative) {
    invalidate(); state = 'manual';
    if (context) context.suspend().catch(() => {});
    position = T.FIRST + T.clamp(relative, -.75, .75);
    $('inspect').open = true; controls(); paint();
    status('Silent inspection. Step through one identical strike; orange marks the sound event without playing it.');
  }
  $('play').addEventListener('click', () => start());
  $('restart').addEventListener('click', () => start(true));
  $('pause').addEventListener('click', () => pause());
  document.querySelectorAll('[data-offset]').forEach(button => button.addEventListener('click', () => {
    const wasRunning = state === 'playing' || state === 'starting';
    const wasManual = state === 'manual', manualPosition = position;
    invalidate(); offset = Number(button.dataset.offset);
    document.querySelectorAll('[data-offset]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    $('timing-description').textContent = offset === 0 ?
      'Both events occur together. The blue contact stays fixed in every version.' :
      `Orange sound moves ¼ second ${offset < 0 ? 'before' : 'after'} blue contact. The action stays identical.`;
    if (wasManual) { inspect(manualPosition - T.FIRST); return; }
    position = 0; state = 'idle'; controls(); paint();
    if (wasRunning) start(true);
    else { if (context) context.suspend().catch(() => {}); status(`${modeName()} selected. Press Play with sound for the same six strikes.`); }
  }));
  $('test').addEventListener('click', async () => {
    invalidate(); const token = generation;
    state = 'testing'; position = 0; controls(); paint();
    status('Sound test: two clear hits. Adjust the room volume until both are easy to hear.');
    try {
      ensureContext(); await context.resume();
      if (token !== generation || document.hidden) {
        if (token === generation) pause('Sound test paused because the page is not visible.');
        return;
      }
      if (context.state !== 'running') throw new Error('Audio did not start');
      const at = context.currentTime + .15; impact(at); impact(at + .5);
      testTimer = setTimeout(() => {
        if (token !== generation) return;
        invalidate(); state = 'idle'; controls(); paint(); context.suspend().catch(() => {});
        status(Number($('volume').value) === 0 ? 'Volume is at zero. Raise it, then test again.' : 'Sound test finished. Ready: choose a version, then Play with sound.');
      }, 1150);
    } catch (_) {
      if (token !== generation) return;
      invalidate(); state = 'idle'; controls();
      status('Audio is unavailable here. Use silent inspection or open one of the backup films in the room’s video player.');
    }
  });
  $('volume').addEventListener('input', () => {
    const volume = Number($('volume').value) / 100;
    $('volume-value').textContent = `${Math.round(volume * 100)}%`;
    if (master) master.gain.setTargetAtTime(volume, context.currentTime, .01);
    if (!volume) status('Volume is at zero. The animation continues; raise volume to hear the comparison.');
  });
  $('inspect-start').addEventListener('click', () => inspect(-.75));
  $('at-contact').addEventListener('click', () => inspect(0));
  $('step-back').addEventListener('click', () => inspect((state === 'manual' ? position - T.FIRST : 0) - .05));
  $('step-forward').addEventListener('click', () => inspect((state === 'manual' ? position - T.FIRST : -.75) + .05));
  $('scrub').addEventListener('input', () => inspect(Number($('scrub').value) / 1000));
  $('fullscreen').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.body.requestFullscreen) await document.body.requestFullscreen();
      else status('Use your browser’s full-screen command to fill the projector.');
    } catch (_) { status('Use your browser’s full-screen command to fill the projector.'); }
  });
  document.addEventListener('fullscreenchange', () => { $('fullscreen').textContent = document.fullscreenElement ? 'Exit full screen ↙' : 'Fill screen ↗'; });
  document.addEventListener('keydown', event => {
    if (event.code !== 'Space' || /INPUT|BUTTON|TEXTAREA|SUMMARY|A/.test(event.target.tagName)) return;
    event.preventDefault(); if (state === 'playing' || state === 'starting') pause(); else start();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && ['playing','starting','testing'].includes(state)) pause('Paused when the page was hidden. Press Resume to continue.');
  });
  window.addEventListener('pagehide', () => pause('Paused.'));
  reduce.addEventListener?.('change', paint);
  // Small read-only diagnostic surface for timing verification; not used by the lesson UI.
  window.StrikeLabDiagnostics = () => ({state,position,offset,clockKind,scheduledSources:sources.size});
  controls(); paint();
})();
