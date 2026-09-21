/* After Hours: an original, sample-free instrument. No network or storage. */
(() => {
  'use strict';

  const TRACKS = ['Kick', 'Clap', 'Bass', 'Glow'];
  const PRESETS = {
    warm112: { label: 'Warm-up', bpm: 112, notes: [[0, 6, 8, 14], [4, 12], [0, 3, 6, 8, 11, 14], [0, 8]] },
    house128: { label: 'House', bpm: 128, notes: [[0, 4, 8, 12], [4, 12], [2, 6, 10, 14], [0, 10]] },
    dnb174: { label: 'Drum & bass', bpm: 174, notes: [[0, 7, 10], [4, 12], [0, 3, 7, 10, 14], [0, 8]] }
  };
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const copy = value => JSON.parse(JSON.stringify(value));
  const fromPreset = key => ({ version: 1, preset: key, bpm: PRESETS[key].bpm, volume: 0.12,
    tracks: PRESETS[key].notes.map(steps => Array.from({ length: 16 }, (_, i) => steps.includes(i) ? 1 : 0)) });
  let state = fromPreset('warm112');
  let instance = null;

  function validState(value) {
    if (!value || value.version !== 1 || !Object.hasOwn(PRESETS, value.preset)) return null;
    if (value.bpm !== PRESETS[value.preset].bpm || !Number.isFinite(value.volume)) return null;
    if (!Array.isArray(value.tracks) || value.tracks.length !== 4) return null;
    if (value.tracks.some(row => !Array.isArray(row) || row.length !== 16 || row.some(cell => cell !== 0 && cell !== 1))) return null;
    return { version: 1, preset: value.preset, bpm: value.bpm, volume: clamp(value.volume, 0, 0.3), tracks: value.tracks.map(row => row.slice()) };
  }

  function mount(root, options = {}) {
    if (!(root instanceof Element)) throw new TypeError('AfterHoursInstrument.mount needs a root element.');
    if (instance) instance.destroy();
    instance = new Instrument(root, options);
    return window.AfterHoursInstrument;
  }

  class Instrument {
    constructor(root, options) {
      this.root = root;
      this.options = options;
      this.context = null;
      this.playing = false;
      this.starting = false;
      this.generation = 0;
      this.voices = new Set();
      this.queue = [];
      this.currentStep = -1;
      this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.root.classList.add('jam-instrument');
      this.root.innerHTML = `
        <div class="jam-panel">
          <div class="jam-heading"><div><p class="jam-kicker">A LITTLE MUSIC WE CAN MAKE</p><h3 class="jam-title">Your part. My part. <em>Our sound.</em></h3></div><span class="jam-tempo" aria-label="Tempo"></span></div>
          <p class="jam-intro">Pick a mood. Tap a few steps. Every lit square adds something to the loop.</p>
          <div class="jam-presets" role="group" aria-label="Choose a musical mood">${Object.entries(PRESETS).map(([key, preset]) => `<button type="button" class="jam-preset" data-jam-preset="${key}" aria-pressed="false"><strong>${preset.label}</strong><span>${preset.bpm} BPM</span></button>`).join('')}</div>
          <div class="jam-visual"><canvas class="jam-canvas" aria-hidden="true"></canvas><span class="jam-visual-caption">The room is ready.</span></div>
          <div class="jam-transport"><button type="button" class="jam-play" aria-pressed="false">Play our loop</button><button type="button" class="jam-vary">Try a variation</button><label class="jam-volume">Volume <input class="jam-volume-input" type="range" min="0" max="0.3" step="0.01" value="0.12" aria-label="Instrument volume"><output class="jam-volume-output">40%</output></label></div>
          <p class="jam-status" role="status" aria-live="polite">Original sounds. No right notes required.</p>
          <div class="jam-tracks">${TRACKS.map((track, ti) => `<fieldset class="jam-row jam-track-${ti}"><legend><span>${track}</span><small>${['The ground beneath us', 'A little lift', 'Follow the low end', 'Leave a light on'][ti]}</small></legend><div class="jam-halves">${[0, 8].map(start => `<div class="jam-half"><span class="jam-half-label">Steps ${start + 1}–${start + 8}</span><div class="jam-steps">${Array.from({ length: 8 }, (_, j) => { const step = start + j; return `<button type="button" class="jam-step${step % 4 === 0 ? ' jam-downbeat' : ''}" data-jam-track="${ti}" data-jam-step="${step}" aria-label="${track}, step ${step + 1}" aria-pressed="false"><span>${step + 1}</span></button>`; }).join('')}</div></div>`).join('')}</div></fieldset>`).join('')}</div>
          <p class="jam-note">Made here with original synthesized sounds. Try passing the screen to someone and changing one track each.</p>
        </div>`;
      this.buttons = [...root.querySelectorAll('.jam-step')];
      this.playButton = root.querySelector('.jam-play');
      this.status = root.querySelector('.jam-status');
      this.canvas = root.querySelector('.jam-canvas');
      this.paint = this.canvas.getContext('2d');
      this.clickHandler = event => this.click(event);
      this.inputHandler = event => this.input(event);
      this.visibilityHandler = () => { if (document.hidden) this.stop('Paused while you were away.'); };
      this.motionHandler = () => { if (this.reduced.matches) this.drawStill(); };
      root.addEventListener('click', this.clickHandler);
      root.addEventListener('input', this.inputHandler);
      document.addEventListener('visibilitychange', this.visibilityHandler);
      this.reduced.addEventListener('change', this.motionHandler);
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.canvas);
      this.refresh();
      this.resize();
    }

    changed() {
      if (typeof this.options.onChange === 'function') this.options.onChange(copy(state));
    }

    click(event) {
      const button = event.target.closest('button');
      if (!button || !this.root.contains(button)) return;
      if (button.dataset.jamPreset) {
        const wasPlaying = this.playing;
        this.stop();
        const volume = state.volume;
        state = fromPreset(button.dataset.jamPreset);
        state.volume = volume;
        this.refresh();
        this.status.textContent = `${PRESETS[state.preset].label} · ${state.bpm} BPM. Your new starting point.`;
        this.changed();
        if (wasPlaying) this.start();
      } else if (button.hasAttribute('data-jam-track')) {
        const track = Number(button.dataset.jamTrack), step = Number(button.dataset.jamStep);
        state.tracks[track][step] = 1 - state.tracks[track][step];
        button.setAttribute('aria-pressed', String(Boolean(state.tracks[track][step])));
        if (!this.playing) this.drawStill();
        this.changed();
      } else if (button.classList.contains('jam-play')) {
        if (this.playing || this.starting) this.stop(); else this.start();
      } else if (button.classList.contains('jam-vary')) {
        this.vary();
      }
    }

    input(event) {
      if (!event.target.classList.contains('jam-volume-input')) return;
      state.volume = clamp(Number(event.target.value), 0, 0.3);
      this.root.querySelector('.jam-volume-output').textContent = `${Math.round(state.volume / 0.3 * 100)}%`;
      if (this.master && this.context) this.master.gain.setTargetAtTime(state.volume, this.context.currentTime, 0.03);
      this.changed();
    }

    vary() {
      const last = JSON.stringify(state.tracks);
      state.tracks = fromPreset(state.preset).tracks;
      const pick = array => array[Math.floor(Math.random() * array.length)];
      const kickExtra = pick(state.preset === 'house128' ? [7, 11, 15] : [2, 6, 11, 14]);
      state.tracks[0][kickExtra] = 1;
      // Keep the backbeat and root anchors; vary syncopation and chord spacing.
      state.tracks[1][pick([3, 7, 11, 15])] = Math.random() > 0.45 ? 1 : 0;
      state.tracks[2] = Array.from({ length: 16 }, (_, i) => i === 0 || i === 8 || (i % 4 !== 0 && Math.random() > 0.6) ? 1 : 0);
      const glowStep = pick([6, 8, 10]);
      state.tracks[3] = Array.from({ length: 16 }, (_, i) => i === 0 || i === glowStep ? 1 : 0);
      // Guarantee a changed pattern, even if the random choices repeat.
      if (JSON.stringify(state.tracks) === last) state.tracks[2][15] = 1 - state.tracks[2][15];
      this.refresh();
      this.status.textContent = 'A fresh variation. The pulse stays; the little details change.';
      this.changed();
    }

    refresh() {
      this.root.querySelectorAll('[data-jam-preset]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.jamPreset === state.preset)));
      this.buttons.forEach(button => button.setAttribute('aria-pressed', String(Boolean(state.tracks[Number(button.dataset.jamTrack)][Number(button.dataset.jamStep)]))));
      this.root.querySelector('.jam-tempo').textContent = `${state.bpm} BPM`;
      this.root.querySelector('.jam-volume-input').value = String(state.volume);
      this.root.querySelector('.jam-volume-output').textContent = `${Math.round(state.volume / 0.3 * 100)}%`;
      if (!this.playing) this.drawStill();
    }

    prepareAudio() {
      if (this.context) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error('Audio unavailable');
      const ctx = this.context = new AudioContext();
      this.master = ctx.createGain();
      this.master.gain.value = state.volume;
      this.compressor = ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -18;
      this.compressor.knee.value = 12;
      this.compressor.ratio.value = 12;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.16;
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.88;
      this.wave = new Uint8Array(this.analyser.fftSize);
      this.master.connect(this.compressor);
      this.compressor.connect(this.analyser);
      this.analyser.connect(ctx.destination);
      this.noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.35), ctx.sampleRate);
      const buffer = this.noise.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) buffer[i] = Math.random() * 2 - 1;
    }

    async start() {
      if (this.playing || this.starting) return;
      const generation = ++this.generation;
      this.starting = true;
      this.playButton.textContent = 'Starting…';
      try {
        this.prepareAudio();
        // Called in the gesture turn so the parent can stop other media synchronously.
        if (typeof this.options.onStart === 'function') this.options.onStart();
        await this.context.resume();
        if (generation !== this.generation) {
          if (!this.playing && !this.starting && this.context.state === 'running') this.context.suspend().catch(() => {});
          return;
        }
        if (document.hidden) { this.stop('Paused while you were away.'); return; }
        if (this.context.state !== 'running') throw new Error('Playback did not start');
        this.master.gain.cancelScheduledValues(this.context.currentTime);
        this.master.gain.setValueAtTime(0, this.context.currentTime);
        this.master.gain.linearRampToValueAtTime(state.volume, this.context.currentTime + 0.025);
        this.playing = true;
        this.starting = false;
        this.queue = [];
        this.nextStep = 0;
        this.nextTime = this.context.currentTime + 0.06;
        this.root.classList.add('jam-playing');
        this.playButton.textContent = 'Stop our loop';
        this.playButton.setAttribute('aria-pressed', 'true');
        this.status.textContent = 'Playing. Change a step and hear it on the next pass.';
        this.root.querySelector('.jam-visual-caption').textContent = 'A little more beautiful together.';
        this.schedule();
        this.timer = window.setInterval(() => this.schedule(), 25);
        this.frame = requestAnimationFrame(time => this.animate(time));
      } catch (error) {
        if (generation === this.generation) this.stop('Sound could not start here. You can still shape the pattern and try Play again.');
      } finally {
        if (generation === this.generation) this.starting = false;
      }
    }

    schedule() {
      if (!this.playing || this.context.state !== 'running') return;
      const now = this.context.currentTime;
      // If a stalled tab skipped ahead, restart from the next step; never schedule a burst.
      if (this.nextTime < now - 0.12) this.nextTime = now + 0.025;
      while (this.nextTime < now + 0.1) {
        const step = this.nextStep;
        for (let track = 0; track < 4; track++) if (state.tracks[track][step]) this.voice(track, step, this.nextTime);
        this.queue.push({ step, time: this.nextTime });
        this.nextTime += 60 / state.bpm / 4;
        this.nextStep = (step + 1) % 16;
      }
    }

    track(source, nodes, end) {
      this.voices.add(source);
      source.onended = () => {
        this.voices.delete(source);
        source.disconnect();
        nodes.forEach(node => node.disconnect());
      };
      source.stop(end);
    }

    oscillator(freq, time, duration, level, type = 'sine', slide = 0, cutoff = 0) {
      const ctx = this.context, source = ctx.createOscillator(), gain = ctx.createGain(), nodes = [gain];
      source.type = type;
      source.frequency.setValueAtTime(freq, time);
      if (slide) source.frequency.exponentialRampToValueAtTime(slide, time + Math.min(0.13, duration / 2));
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(level, time + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      if (cutoff) {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.setValueAtTime(cutoff, time); filter.Q.value = 0.6;
        filter.frequency.exponentialRampToValueAtTime(Math.max(140, cutoff * 0.35), time + duration);
        source.connect(filter); filter.connect(gain); nodes.push(filter);
      } else source.connect(gain);
      gain.connect(this.master);
      source.start(time);
      this.track(source, nodes, time + duration + 0.025);
    }

    hiss(time, duration, level, frequency) {
      const ctx = this.context, source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      source.buffer = this.noise;
      filter.type = 'highpass'; filter.frequency.value = frequency;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(level, time + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      source.connect(filter); filter.connect(gain); gain.connect(this.master);
      source.start(time);
      this.track(source, [filter, gain], time + duration + 0.01);
    }

    voice(track, step, time) {
      const sixteenth = 60 / state.bpm / 4;
      if (track === 0) {
        this.oscillator(145, time, 0.28, 0.75, 'sine', 44);
        this.hiss(time, 0.014, 0.05, 2500);
      } else if (track === 1) {
        this.hiss(time, 0.035, 0.16, 1300);
        this.hiss(time + 0.016, 0.045, 0.12, 1700);
        this.hiss(time + 0.032, 0.12, 0.12, 1000);
        this.oscillator(190, time, 0.085, 0.05, 'triangle');
      } else if (track === 2) {
        const roots = [55, 55, 65.406, 49], freq = roots[Math.floor(step / 4)];
        this.oscillator(freq, time, Math.min(0.34, sixteenth * 1.8), 0.34, 'triangle', 0, 680);
        this.oscillator(freq * 2, time, Math.min(0.2, sixteenth), 0.055, 'sine');
      } else {
        const root = step < 8 ? 220 : 196;
        [1, 1.2, 1.5, 2].forEach((ratio, i) => {
          this.oscillator(root * ratio, time + i * 0.014, 0.86, 0.075, 'sine');
          this.oscillator(root * ratio * 1.003, time + i * 0.014, 0.65, 0.018, 'triangle', 0, 1300);
        });
      }
    }

    animate(time) {
      if (!this.playing) return;
      let changed = false;
      while (this.queue.length && this.queue[0].time <= this.context.currentTime) {
        this.currentStep = this.queue.shift().step;
        changed = true;
      }
      if (changed) this.buttons.forEach(button => button.classList.toggle('jam-current', Number(button.dataset.jamStep) === this.currentStep));
      if (!this.reduced.matches && !this.options.reducedMotion) this.draw(time / 1000);
      // The playhead remains useful with reduced motion; the canvas stays still.
      this.frame = requestAnimationFrame(next => this.animate(next));
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect(), scale = Math.min(2, window.devicePixelRatio || 1);
      this.width = Math.max(1, rect.width); this.height = Math.max(1, rect.height);
      this.canvas.width = Math.round(this.width * scale); this.canvas.height = Math.round(this.height * scale);
      this.paint.setTransform(scale, 0, 0, scale, 0, 0);
      this.drawStill();
    }

    drawStill() { this.draw(0, true); }

    draw(time, still = false) {
      const ctx = this.paint, w = this.width, h = this.height;
      if (!ctx || !w || !h) return;
      ctx.clearRect(0, 0, w, h);
      const active = state.tracks.reduce((sum, row) => sum + row.reduce((a, b) => a + b, 0), 0) / 64;
      let energy = 0;
      if (!still && this.analyser) {
        this.analyser.getByteTimeDomainData(this.wave);
        energy = Math.sqrt(this.wave.reduce((sum, n) => sum + ((n - 128) / 128) ** 2, 0) / this.wave.length);
      }
      this.visualEnergy = still ? 0 : (this.visualEnergy || 0) * 0.92 + energy * 0.08;
      const amplitude = h * (0.12 + active * 0.13 + this.visualEnergy * 0.7);
      const gradient = ctx.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, '#e8b970'); gradient.addColorStop(0.5, '#f8ecd4'); gradient.addColorStop(1, '#baa8ec');
      for (let ribbon = 0; ribbon < 5; ribbon++) {
        ctx.beginPath();
        for (let x = 0; x <= w + 4; x += 4) {
          const angle = x / w * Math.PI * 2;
          const y = h * 0.49 + Math.sin(angle + time * 0.36 + ribbon * 0.22) * amplitude * Math.sin(x / w * Math.PI) + ribbon * 4 - 8;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = gradient; ctx.globalAlpha = 0.16 + ribbon * 0.075; ctx.lineWidth = ribbon === 2 ? 1.8 : 1; ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    stop(message = 'Paused. Your pattern is still here.') {
      ++this.generation;
      this.playing = false;
      this.starting = false;
      clearInterval(this.timer);
      cancelAnimationFrame(this.frame);
      this.queue = [];
      this.currentStep = -1;
      if (this.context) {
        const now = this.context.currentTime;
        this.master.gain.cancelScheduledValues(now);
        this.master.gain.setValueAtTime(0, now);
        this.voices.forEach(source => { try { source.stop(now); } catch (_) { /* Already stopped. */ } });
        if (this.context.state === 'running') this.context.suspend().catch(() => {});
      }
      this.root.classList.remove('jam-playing');
      this.buttons.forEach(button => button.classList.remove('jam-current'));
      this.playButton.textContent = 'Play our loop';
      this.playButton.setAttribute('aria-pressed', 'false');
      this.status.textContent = message;
      this.root.querySelector('.jam-visual-caption').textContent = 'The room is ready.';
      this.drawStill();
    }

    destroy() {
      this.stop();
      this.resizeObserver.disconnect();
      this.reduced.removeEventListener('change', this.motionHandler);
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.root.removeEventListener('click', this.clickHandler);
      this.root.removeEventListener('input', this.inputHandler);
      if (this.context) this.context.close().catch(() => {});
      this.root.replaceChildren();
      this.root.classList.remove('jam-instrument');
    }
  }

  window.AfterHoursInstrument = Object.freeze({
    mount,
    stop() { if (instance) instance.stop(); },
    serialize() { return copy(state); },
    restore(value) {
      const clean = validState(value);
      if (!clean) return false;
      if (instance) instance.stop('Your shared pattern is ready. Press Play when you like.');
      state = clean;
      if (instance) instance.refresh();
      return true;
    }
  });
})();
