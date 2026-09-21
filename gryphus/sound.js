/* Gryphus: an original twenty-second sound sketch. No external media. */
(() => {
  'use strict';
  const DURATION = 20;
  const STEP = 0.75;
  const mounts = new Map();
  let currentPlayer = null;
  let serial = 0;
  const midi = n => 440 * 2 ** ((n - 69) / 12);
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

  class MoodPlayer {
    constructor(host) {
      this.host = host;
      this.run = null;
      this.destroyed = false;
      this.volume = 0.22;
      this.muted = false;
      this.phase = 'idle';
      this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.uid = 'gryphus-mood-' + (++serial);
      host.classList.add('gryphus-mood');
      host.innerHTML = '<div class="gm-heading"><span class="gm-overline">A little room to slow down</span><div class="gm-equalizer" aria-hidden="true">' +
        Array.from({ length: 13 }, (_, i) => '<i style="--gm-rest:' + (0.15 + Math.sin(i / 12 * Math.PI) * 0.23).toFixed(2) + '"></i>').join('') +
        '</div></div><div class="gm-main"><button class="gm-play" type="button"><span class="gm-play-icon" aria-hidden="true">▶</span> <span>Hear the mood</span></button>' +
        '<button class="gm-stop" type="button" disabled>Stop sound</button><span class="gm-clock" aria-hidden="true">0:00 / 0:20</span></div>' +
        '<div class="gm-progress-track"><progress class="gm-progress" max="20" value="0" aria-label="Sound sketch progress">0%</progress></div>' +
        '<div class="gm-settings"><button class="gm-mute" type="button" aria-pressed="false">Mute</button>' +
        '<label class="gm-volume" for="' + this.uid + '-volume">Volume <input id="' + this.uid + '-volume" type="range" min="0" max="60" step="1" value="22" aria-valuetext="22 percent"></label>' +
        '<span class="gm-credit">20 seconds · An original sound sketch</span></div>' +
        '<p class="gm-status" role="status" aria-live="polite">Warm strings. A little open air.</p>';
      const q = selector => host.querySelector(selector);
      this.ui = { play: q('.gm-play'), stop: q('.gm-stop'), mute: q('.gm-mute'), volume: q('input'),
        progress: q('progress'), clock: q('.gm-clock'), status: q('.gm-status'), bars: [...host.querySelectorAll('.gm-equalizer i')] };
      this.onPlay = () => this.start();
      this.onStop = () => this.stop('stopped');
      this.onMute = () => this.setMuted(!this.muted);
      this.onVolume = () => this.setVolume(Number(this.ui.volume.value) / 100);
      this.onHidden = () => { if (document.hidden) this.stop('hidden'); };
      this.onPageHide = () => this.stop('hidden');
      this.onMotion = () => { if (this.reduced.matches) this.resetBars(); };
      this.ui.play.addEventListener('click', this.onPlay);
      this.ui.stop.addEventListener('click', this.onStop);
      this.ui.mute.addEventListener('click', this.onMute);
      this.ui.volume.addEventListener('input', this.onVolume);
      document.addEventListener('visibilitychange', this.onHidden);
      window.addEventListener('pagehide', this.onPageHide);
      if (this.reduced.addEventListener) this.reduced.addEventListener('change', this.onMotion);
      else this.reduced.addListener(this.onMotion);
    }

    async start() {
      if (this.destroyed || this.run || document.hidden) return false;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        this.ui.status.textContent = 'Sound is unavailable in this browser.';
        return false;
      }
      if (currentPlayer && currentPlayer !== this) currentPlayer.stop('stopped');
      currentPlayer = this;
      this.phase = 'starting';
      this.host.dataset.playing = 'true';
      this.ui.play.disabled = true;
      this.ui.stop.disabled = false;
      this.ui.status.textContent = 'Opening a little space…';
      this.setProgress(0);
      let run;
      try {
        const ctx = new AudioContext({ latencyHint: 'interactive' });
        run = { ctx, sources: [], frame: 0, finishTimer: 0, closed: false, disposed: false, startedAt: 0 };
        this.run = run;
        // resume() is invoked by the user's click, never by visibility restoration.
        await ctx.resume();
        if (this.run !== run || run.disposed || this.destroyed || document.hidden) {
          this.dispose(run, false);
          if (this.run === run) this.stop('hidden');
          return false;
        }
        if (ctx.state !== 'running') throw new Error('Audio did not become available');
        this.build(run);
        this.phase = 'playing';
        this.ui.status.textContent = this.muted ? 'Playing with sound muted.' : 'Take twenty seconds. There’s nowhere else to be.';
        run.finishTimer = window.setTimeout(() => {
          if (this.run === run) this.stop('complete');
        }, (DURATION + 0.08) * 1000);
        this.draw(run);
        return true;
      } catch (_) {
        if (run) this.dispose(run, false);
        if (this.run === run || !run) {
          this.run = null;
          if (currentPlayer === this) currentPlayer = null;
          this.phase = 'idle';
          this.resetUI();
          this.ui.status.textContent = 'Sound did not start. Tap Hear the mood to try again.';
        }
        return false;
      }
    }

    build(run) {
      const ctx = run.ctx;
      const start = ctx.currentTime + 0.055;
      run.startedAt = start;
      const bus = ctx.createGain();
      const soft = ctx.createDynamicsCompressor();
      soft.threshold.value = -18;
      soft.knee.value = 16;
      soft.ratio.value = 3;
      soft.attack.value = 0.008;
      soft.release.value = 0.18;
      const envelope = ctx.createGain();
      envelope.gain.setValueAtTime(0, ctx.currentTime);
      envelope.gain.linearRampToValueAtTime(0.8, start + 0.35);
      envelope.gain.setValueAtTime(0.8, start + 17.9);
      envelope.gain.linearRampToValueAtTime(0, start + DURATION);
      const volume = ctx.createGain();
      volume.gain.value = this.muted ? 0 : this.volume;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.76;
      bus.connect(soft).connect(envelope).connect(volume).connect(analyser).connect(ctx.destination);
      run.bus = bus;
      run.envelope = envelope;
      run.volume = volume;
      run.analyser = analyser;
      run.levels = new Uint8Array(analyser.frequencyBinCount);

      // A quiet stereo echo gives the plucks air without a sampled room or field recording.
      const echo = ctx.createDelay(1);
      echo.delayTime.value = 0.31;
      const echoLevel = ctx.createGain();
      echoLevel.gain.value = 0.14;
      const echoFilter = ctx.createBiquadFilter();
      echoFilter.type = 'lowpass';
      echoFilter.frequency.value = 1800;
      bus.connect(echo).connect(echoFilter).connect(echoLevel).connect(soft);

      // Dadd9, Gmaj7, Bm7, Asus2, Gmaj7, Dadd9. Six bars at 80 BPM.
      const chords = [[50,57,62,64,69],[43,54,59,62,66],[47,54,57,62,66],
        [45,52,57,59,64],[43,54,59,62,66],[50,57,62,64,69]];
      const pattern = [[0,1],[0.5,2],[1.5,3],[2,1],[2.5,4],[3.5,2]];
      chords.forEach((chord, bar) => {
        const at = start + bar * STEP * 4;
        this.pluck(run, midi(chord[0]), at, 0.13, 2.5, -0.12);
        pattern.forEach(([beat, note], index) => {
          const lastBar = bar === chords.length - 1;
          const level = (index === 0 || index === 3 ? 0.17 : 0.125) * (lastBar ? 0.88 : 1);
          this.pluck(run, midi(chord[note] + 12), at + beat * STEP, level, 1.7, index % 2 ? 0.2 : -0.2);
        });
        // A soft wooden pulse, not a drum-machine backbeat.
        this.tap(run, at + STEP, 0.035);
        this.tap(run, at + STEP * 3, 0.026);
      });
      // A last, open D lets the phrase settle into its release.
      this.pluck(run, midi(74), start + 18, 0.11, 2, 0.1);
    }

    pluck(run, frequency, at, level, length, pan) {
      const ctx = run.ctx;
      const oscillator = ctx.createOscillator();
      oscillator.type = 'triangle';
      oscillator.frequency.value = frequency;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(5200, frequency * 7), at);
      filter.frequency.exponentialRampToValueAtTime(Math.max(600, frequency * 1.7), at + 0.5);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(level, at + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
      oscillator.connect(filter).connect(gain);
      if (ctx.createStereoPanner) {
        const panner = ctx.createStereoPanner();
        panner.pan.value = pan;
        gain.connect(panner).connect(run.bus);
      } else gain.connect(run.bus);
      oscillator.start(at);
      oscillator.stop(at + length + 0.03);
      run.sources.push(oscillator);
    }

    tap(run, at, level) {
      const ctx = run.ctx;
      const oscillator = ctx.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(170, at);
      oscillator.frequency.exponentialRampToValueAtTime(85, at + 0.09);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(level, at + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.13);
      oscillator.connect(gain).connect(run.bus);
      oscillator.start(at);
      oscillator.stop(at + 0.15);
      run.sources.push(oscillator);
    }

    setVolume(value) {
      if (this.destroyed) return;
      this.volume = clamp(Number.isFinite(value) ? value : 0.22, 0, 0.6);
      this.ui.volume.value = String(Math.round(this.volume * 100));
      this.ui.volume.setAttribute('aria-valuetext', Math.round(this.volume * 100) + ' percent');
      this.updateVolume();
    }

    setMuted(value) {
      if (this.destroyed) return;
      this.muted = Boolean(value);
      this.ui.mute.setAttribute('aria-pressed', String(this.muted));
      this.ui.mute.textContent = this.muted ? 'Unmute' : 'Mute';
      this.updateVolume();
      if (this.run) this.ui.status.textContent = this.muted ? 'Playing with sound muted.' : 'Sound on.';
      if (this.muted) this.resetBars();
    }

    updateVolume() {
      const run = this.run;
      if (!run || !run.volume || run.disposed) return;
      const param = run.volume.gain;
      param.cancelScheduledValues(run.ctx.currentTime);
      param.setTargetAtTime(this.muted ? 0 : this.volume, run.ctx.currentTime, 0.035);
    }

    setProgress(seconds) {
      const value = clamp(seconds, 0, DURATION);
      this.ui.progress.value = value;
      this.ui.progress.textContent = Math.round(value / DURATION * 100) + '%';
      this.ui.clock.textContent = '0:' + String(Math.floor(value)).padStart(2, '0') + ' / 0:20';
    }

    draw(run) {
      if (this.run !== run || run.disposed) return;
      const elapsed = Math.max(0, run.ctx.currentTime - run.startedAt);
      this.setProgress(elapsed);
      if (elapsed >= DURATION) {
        this.stop('complete');
        return;
      }
      if (!this.reduced.matches && !this.muted) {
        run.analyser.getByteFrequencyData(run.levels);
        this.ui.bars.forEach((bar, i) => {
          const index = 1 + Math.round(i * 2.7);
          const level = Math.min(1, run.levels[index] / 160);
          bar.style.transform = 'scaleY(' + (0.12 + level * 0.88).toFixed(3) + ')';
        });
      }
      run.frame = window.requestAnimationFrame(() => this.draw(run));
    }

    resetBars() {
      this.ui.bars.forEach(bar => bar.style.removeProperty('transform'));
    }

    dispose(run, release = true) {
      if (!run || run.disposed) return;
      run.disposed = true;
      window.cancelAnimationFrame(run.frame);
      window.clearTimeout(run.finishTimer);
      const ctx = run.ctx;
      const now = ctx.currentTime;
      const tail = release && ctx.state === 'running' ? 0.12 : 0;
      if (run.envelope) {
        const gain = run.envelope.gain;
        try {
          if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(now);
          else { gain.cancelScheduledValues(now); gain.setValueAtTime(gain.value, now); }
          gain.linearRampToValueAtTime(0, now + tail);
        } catch (_) {}
      }
      run.sources.forEach(source => { try { source.stop(now + tail + 0.005); } catch (_) {} });
      const close = () => {
        if (run.closed) return;
        run.closed = true;
        if (ctx.state !== 'closed') ctx.close().catch(() => {});
      };
      if (tail) window.setTimeout(close, 150);
      else close();
    }

    resetUI() {
      this.host.dataset.playing = 'false';
      this.ui.play.disabled = false;
      this.ui.stop.disabled = true;
      this.resetBars();
    }

    stop(reason = 'stopped') {
      const run = this.run;
      if (!run) return;
      this.run = null;
      if (currentPlayer === this) currentPlayer = null;
      this.phase = 'idle';
      this.dispose(run, reason !== 'hidden' && reason !== 'destroyed');
      this.resetUI();
      this.setProgress(reason === 'complete' ? DURATION : 0);
      this.ui.status.textContent = reason === 'complete' ? 'Keep a little of that with you. Play again any time.' :
        reason === 'hidden' ? 'Sound stopped while you were away. Tap to play again.' : 'Sound stopped.';
    }

    getState() {
      return { playing: this.phase === 'playing', starting: this.phase === 'starting',
        muted: this.muted, volume: this.volume, seconds: this.ui.progress.value,
        reducedMotion: this.reduced.matches, destroyed: this.destroyed };
    }

    destroy() {
      if (this.destroyed) return;
      this.stop('destroyed');
      this.destroyed = true;
      this.ui.play.removeEventListener('click', this.onPlay);
      this.ui.stop.removeEventListener('click', this.onStop);
      this.ui.mute.removeEventListener('click', this.onMute);
      this.ui.volume.removeEventListener('input', this.onVolume);
      document.removeEventListener('visibilitychange', this.onHidden);
      window.removeEventListener('pagehide', this.onPageHide);
      if (this.reduced.removeEventListener) this.reduced.removeEventListener('change', this.onMotion);
      else this.reduced.removeListener(this.onMotion);
      this.host.replaceChildren();
      this.host.classList.remove('gryphus-mood');
      mounts.delete(this.host);
    }
  }

  function mount(target) {
    const host = typeof target === 'string' ? document.querySelector(target) : target;
    if (!host) return null;
    if (!mounts.has(host)) mounts.set(host, new MoodPlayer(host));
    return mounts.get(host);
  }
  function mountAll() { return [...document.querySelectorAll('[data-gryphus-sound]')].map(mount); }
  window.GryphusMood = Object.freeze({ mount, mountAll, destroyAll: () => [...mounts.values()].forEach(player => player.destroy()) });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll, { once: true });
  else mountAll();
})();

