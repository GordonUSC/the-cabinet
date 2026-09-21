/* Gryphus 2026 listening archive. Catalog music, never a 2027 booking claim. */
(() => {
  'use strict';
  const spotify = id => 'https://open.spotify.com/artist/' + id + '?utm_source=openai&utm_medium=chatgpt';
  const artists = [
    { id: 'silas', name: 'Silas Lowe', day: 0, time: '3 PM', genre: 'American roots', spotify: '2VSAW7OcmNRphkIwRI3zQt', source: 'https://silaslowe.com/one-sheet', note: 'Folk, bluegrass, blues and honky-tonk, held together by a storyteller’s eye. His 2025 album Mirror Behind the Bar makes an inviting first stop.', start: 'Mirror Behind the Bar' },
    { id: 'delvon', name: 'Delvon Lamarr Organ Trio', day: 0, time: '6 PM + 8 PM', genre: 'Soul / jazz', spotify: '7owr01EP6gwCYjnfQtPKy8', source: 'https://www.coleminerecords.com/collections/delvon-lamar-organ-trio', note: 'Organ-led soul and jazz with a deep, easy groove. Two Friday set slots on the 2026 program gave this trio room to stretch.', start: 'Live at KEXP!' },
    { id: 'peterson', name: 'The Peterson Brothers', day: 1, time: '11 AM', genre: 'Electric blues / soul', spotify: '6op6sWjJ0fTmCg4bPyDkJs', source: 'https://www.petersonbrothersband.com/', note: 'Austin brothers Glenn Jr. and Alex bring guitar and bass into a joyful conversation across blues, soul, funk and jazz. Start with their album Experience.', start: 'Experience' },
    { id: 'cilantro', name: 'Cilantro Boombox', day: 1, time: '2 PM', genre: 'Latin / brass / groove', spotify: '56eDfGdSjdEvnlZOnwmcow', source: 'https://www.cilantroboombox.com/music', note: 'Austin-made dance music where Latin and Pan-African rhythms meet brass and electronics. Shine is a good doorway into their generous, full-band sound.', start: 'Shine' },
    { id: 'juanos', name: 'Los Juanos', day: 1, time: '4:30 PM', genre: 'Indie-regional Mexicano', spotify: '4ekCib4fVdIfgVt6OiKwXv', source: 'https://www.losjuanos.com/', note: 'From San Antonio: conjunto, corrido and cumbia norteña opening into dream pop, psychedelia and more. A sound that keeps crossing musical borders.', start: 'Intenciones' },
    { id: 'ikebe', name: 'Ikebe Shakedown', day: 1, time: '7 PM', genre: 'Cinematic soul / funk', spotify: '5ABBZoXY5r0UL1txACjinb', source: 'https://www.coleminerecords.com/collections/ikebe-shakedown/products/ikebe-shakedown-ikebe-shakedown', note: 'Brooklyn instrumental soul with horns out front and an unhurried pocket underneath. Afro-funk, disco and boogaloo give the music its color.', start: 'Ikebe Shakedown' },
    { id: 'redbearded', name: 'The Redbearded Strangers', day: 2, time: '11 AM', genre: 'Folk / country', spotify: null, source: null, note: 'The folk and country opening slot on Sunday’s 2026 program. This artist belongs in the festival story; a verified streaming link is still to come.', start: null },
    { id: 'ratking', name: 'Rat King Cole', day: 2, time: '2 PM', genre: 'Ska / jazz', spotify: '5goiUPtu8tr4dFbgE5tccK', source: 'https://theratkingcole.wixsite.com/theratkingcole', note: 'San Antonio ska-jazz, with reggae and funk in the mix. The band’s own listening page travels from No One at Home to Year of the Rat.', start: 'No One at Home' },
    { id: 'hearttones', name: 'Thee Heart Tones', day: 2, time: '5:30 PM', genre: 'Chicano soul', spotify: '1TSEWPOtBfCelJqufaJvvZ', source: 'https://bigcrownrecords.com/artists/thee-heart-tones/', note: 'Hawthorne, California soul, with Jazmine Alvarado’s voice at the center. Forever & Ever is a lovely place to begin before wandering through their catalog.', start: 'Forever & Ever' }
  ];
  const days = [
    { label: 'Friday', short: 'FRI', date: 'April 24, 2026', number: '24' },
    { label: 'Saturday', short: 'SAT', date: 'April 25, 2026', number: '25' },
    { label: 'Sunday', short: 'SUN', date: 'April 26, 2026', number: '26' }
  ];
  const instances = new Map();
  let active = null;
  let serial = 0;
  const escape = text => String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  function mount(target) {
    const host = typeof target === 'string' ? document.querySelector(target) : target;
    if (!host) return null;
    if (instances.has(host)) return instances.get(host);
    const uid = 'gl-' + (++serial);
    let selected = artists[1], destroyed = false, frame = null, timeout = null;
    host.classList.add('gryphus-lineup');
    host.innerHTML = `<div class="gl-heading"><div><p class="gl-kicker">THE 2026 LISTENING ROOM</p><h2>TAKE THE LONG<br>WAY THROUGH THE MUSIC.</h2></div><p class="gl-intro">Nine artists. Ten set times. <br>A little of what brought us together.<span>April 24–26, 2026 · Flat Rock Ranch</span></p></div><div class="gl-body"><div class="gl-program"><div class="gl-days" role="group" aria-label="Explore the 2026 festival days">${days.map((d,i) => `<button type="button" data-day="${i}" aria-pressed="${i===0}"><span>${d.short}</span><strong>${d.number}</strong><span>APR ’26</span></button>`).join('')}</div><div class="gl-artists" role="group" aria-label="2026 artists"></div><p class="gl-archive-note">FROM THE 2026 PROGRAM<br>2027 artists are still to be announced.</p></div><div class="gl-listening"><div class="gl-detail"><div class="gl-record" aria-hidden="true"><span>GRYPHUS<br><b>2026</b><small>THE LISTENING ROOM</small></span></div><div><p class="gl-genre"></p><h3 id="${uid}-artist"></h3><p class="gl-slot"></p></div></div><p class="gl-note"></p><div class="gl-player" aria-labelledby="${uid}-artist"><div class="gl-player-slot"></div></div><div class="gl-links"></div><p class="gl-status" role="status" aria-live="polite"></p></div></div><div class="gl-foot"><span>Artist catalog music, not recordings of the Gryphus sets.</span><a href="https://gryphusmusicfestival.com/" target="_blank" rel="noopener noreferrer">Official festival ↗</a></div>`;
    const q = sel => host.querySelector(sel);
    const ui = { artists:q('.gl-artists'), genre:q('.gl-genre'), name:q('h3'), slot:q('.gl-slot'), note:q('.gl-note'), player:q('.gl-player-slot'), links:q('.gl-links'), status:q('.gl-status') };
    function clearFrame() {
      clearTimeout(timeout); timeout = null;
      if (frame) { frame.remove(); frame = null; }
      if (active === api) active = null;
      host.removeAttribute('data-player-open');
    }
    function placeholder() {
      ui.player.innerHTML = selected.spotify
        ? `<button class="gl-load" type="button"><span class="gl-play-mark" aria-hidden="true">▶</span><span>Listen to ${escape(selected.name)}<small>Open the Spotify player here</small></span><span aria-hidden="true">↗</span></button><p class="gl-service-note">Spotify loads only when you choose to listen. Playback availability depends on Spotify.</p>`
        : '<div class="gl-unavailable"><span aria-hidden="true">♫</span><p>Part of the 2026 story.<br><small>A verified music link is still to come.</small></p></div>';
    }
    function stop(message = 'Player closed.') {
      if (destroyed) return;
      const hadFrame = !!frame;
      clearFrame(); placeholder();
      if (hadFrame) ui.status.textContent = message;
    }
    function renderArtist() {
      ui.genre.textContent = selected.genre;
      ui.name.textContent = selected.name;
      ui.slot.textContent = days[selected.day].date + ' · ' + selected.time;
      ui.note.textContent = selected.note;
      ui.links.innerHTML = (selected.spotify ? `<a href="${spotify(selected.spotify)}" target="_blank" rel="noopener noreferrer">Open in Spotify ↗</a>` : '') + (selected.source ? `<a href="${selected.source}" target="_blank" rel="noopener noreferrer">Artist / label story ↗</a>` : '');
      placeholder();
      host.querySelectorAll('[data-artist]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.artist === selected.id)));
    }
    function showDay(day, chooseFirst = true) {
      clearFrame();
      if (chooseFirst) selected = artists.find(artist => artist.day === day);
      host.querySelectorAll('[data-day]').forEach(button => button.setAttribute('aria-pressed', String(+button.dataset.day === day)));
      ui.artists.innerHTML = artists.filter(artist => artist.day === day).map(artist => `<button type="button" data-artist="${artist.id}" aria-pressed="${artist.id===selected.id}"><span class="gl-time">${artist.time}</span><span class="gl-artist-name">${artist.name}</span><span class="gl-select-mark" aria-hidden="true">↗</span></button>`).join('');
      renderArtist();
      ui.status.textContent = '';
    }
    function loadPlayer() {
      if (destroyed || document.hidden || !selected.spotify) return;
      if (active && active !== api) active.stop('Player closed.');
      document.querySelectorAll('[data-gryphus-sound]').forEach(soundHost => window.GryphusMood?.mount(soundHost)?.stop('stopped'));
      clearFrame();
      active = api;
      const artist = selected;
      ui.player.innerHTML = '<div class="gl-player-toolbar"><span>SPOTIFY · ARTIST CATALOG</span><button class="gl-stop" type="button">Close + stop</button></div>';
      frame = document.createElement('iframe');
      frame.title = artist.name + ' on Spotify';
      frame.src = 'https://open.spotify.com/embed/artist/' + artist.spotify + '?utm_source=generator&theme=0';
      frame.width = '100%'; frame.height = '352';
      frame.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
      frame.setAttribute('allowfullscreen', '');
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      ui.player.append(frame);
      host.dataset.playerOpen = 'true';
      ui.status.textContent = 'Choose a track in the player. Nothing plays automatically.';
      timeout = setTimeout(() => { if (frame && selected === artist) ui.status.textContent = 'If the player is unavailable, use Open in Spotify below.'; }, 10000);
    }
    function onClick(event) {
      const day = event.target.closest('[data-day]');
      const artist = event.target.closest('[data-artist]');
      if (day && host.contains(day)) showDay(+day.dataset.day);
      else if (artist && host.contains(artist)) { clearFrame(); selected = artists.find(item => item.id === artist.dataset.artist); renderArtist(); ui.status.textContent = ''; }
      else if (event.target.closest('.gl-load')) loadPlayer();
      else if (event.target.closest('.gl-stop')) { stop(); q('.gl-load')?.focus(); }
    }
    function onHidden() { if (document.hidden) stop('Player closed while you were away.'); }
    function onPageHide() { stop('Player closed.'); }
    function onOtherSound(event) { if (event.target.closest?.('.gm-play')) stop('Player closed for the original sound sketch.'); }
    const api = { stop, select: id => { const artist = artists.find(a => a.id === id); if (artist && !destroyed) { selected = artist; showDay(artist.day, false); } }, getState: () => ({ artist: selected.id, playerOpen: !!frame, destroyed }), destroy: () => { if (destroyed) return; clearFrame(); destroyed = true; host.removeEventListener('click', onClick); document.removeEventListener('click', onOtherSound, true); document.removeEventListener('visibilitychange', onHidden); window.removeEventListener('pagehide', onPageHide); host.innerHTML = ''; host.classList.remove('gryphus-lineup'); instances.delete(host); } };
    host.addEventListener('click', onClick);
    document.addEventListener('click', onOtherSound, true);
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', onPageHide);
    instances.set(host, api);
    showDay(0, false);
    return api;
  }
  const mountAll = () => [...document.querySelectorAll('[data-gryphus-lineup]')].map(mount);
  window.GryphusLineup = Object.freeze({ mount, mountAll, artists: Object.freeze(artists.map(artist => Object.freeze({ ...artist }))), destroyAll: () => [...instances.values()].forEach(instance => instance.destroy()) });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll, { once: true });
  else mountAll();
})();
