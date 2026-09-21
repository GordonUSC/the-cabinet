/* Flat Rock Ranch: real photograph and primary-source venue context. */
(() => {
  'use strict';
  const scriptURL = document.currentScript && document.currentScript.src;
  const photoURL = new URL('assets/arrival-2026.webp', scriptURL || document.baseURI).href;
  const instances = new WeakMap();
  let nextId = 0;

  function mount(target) {
    const host = typeof target === 'string' ? document.querySelector(target) : target;
    if (!host) return null;
    if (instances.has(host)) return instances.get(host);
    const id = `gryphus-ranch-${++nextId}`;
    const section = document.createElement('section');
    section.className = 'gryphus-ranch';
    section.id = host.id ? `${host.id}-section` : 'the-ranch';
    section.setAttribute('aria-labelledby', `${id}-title`);
    section.dataset.motion = 'paused';
    section.innerHTML = `
      <figure class="gr-memory">
        <div class="gr-photo-frame"><img class="gr-photo" src="${photoURL}" alt="A real April 2026 arrival photograph: two friends at Flat Rock Ranch, with a low green hill, pale ranch road and red shed behind them." loading="lazy" width="1350" height="1800"></div>
        <div class="gr-photo-top"><span>THE PLACE WE CAME TOGETHER</span><button type="button" class="gr-motion" aria-label="Pause photo motion"><span class="gr-motion-icon" aria-hidden="true">Ⅱ</span><span class="gr-motion-label">Pause photo</span></button></div>
        <figcaption>A real moment at the ranch. <strong>April 2026.</strong></figcaption>
      </figure>
      <div class="gr-story">
        <p class="gr-kicker">FLAT ROCK RANCH · COMFORT, TEXAS</p>
        <h2 id="${id}-title">THIS IS<br>OUR HILL<br>COUNTRY.</h2>
        <p class="gr-intro">Low, rolling hills. Pale rock under your tires. Trees, open sky, and the kind of welcome you remember.</p>
        <div class="gr-facts" aria-label="About the ranch">
          <a href="https://www.flatrockranchtx.com/about" target="_blank" rel="noopener"><span class="gr-fact-value">1,300<span> ACRES</span></span><span class="gr-fact-copy">A family ranch for more than a century.<b aria-hidden="true">↗</b></span></a>
          <a href="https://www.flatrockranchtx.com/maps" target="_blank" rel="noopener"><span class="gr-fact-value">34+<span> MILES</span></span><span class="gr-fact-copy">Trails through Hill Country terrain.<b aria-hidden="true">↗</b></span></a>
          <a href="https://www.flatrockranchtx.com/about" target="_blank" rel="noopener"><span class="gr-fact-value gr-fact-words">STILL A RANCH.</span><span class="gr-fact-copy">Home to Black Angus cattle and Angora goats.<b aria-hidden="true">↗</b></span></a>
        </div>
        <div class="gr-actions"><a class="gr-primary" href="https://www.flatrockranchtx.com/maps" target="_blank" rel="noopener">Explore the trail maps <span aria-hidden="true">↗</span></a><a class="gr-secondary" href="https://www.flatrockranchtx.com/location" target="_blank" rel="noopener">Getting there <span aria-hidden="true">↗</span></a></div>
        <p class="gr-address">346 Flat Rock Creek Road · Comfort, Texas</p>
        <p class="gr-note">Ranch trail access during Gryphus will be confirmed with the festival program. <a href="https://www.flatrockranchtx.com/faqs" target="_blank" rel="noopener">Ranch visitor guide ↗</a></p>
      </div>`;
    host.appendChild(section);
    const button = section.querySelector('.gr-motion');
    const label = section.querySelector('.gr-motion-label');
    const icon = section.querySelector('.gr-motion-icon');
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let userPaused = false;
    let inView = false;
    let pageHidden = false;
    let destroyed = false;
    try { userPaused = localStorage.getItem('gryphus-ranch-motion') === 'paused'; } catch (_) {}

    function sync() {
      const reduced = media.matches;
      const active = !destroyed && !userPaused && !reduced && inView && !document.hidden && !pageHidden;
      section.dataset.motion = active ? 'running' : 'paused';
      button.disabled = reduced;
      label.textContent = reduced ? 'Still photo' : userPaused ? 'Play photo' : 'Pause photo';
      icon.textContent = reduced ? '○' : userPaused ? '▷' : 'Ⅱ';
      button.setAttribute('aria-label', reduced ? 'Photo motion disabled by your reduced-motion preference' : userPaused ? 'Play gentle photo motion' : 'Pause photo motion');
    }
    function toggle() {
      userPaused = !userPaused;
      try { localStorage.setItem('gryphus-ranch-motion', userPaused ? 'paused' : 'playing'); } catch (_) {}
      sync();
    }
    function hide() { pageHidden = true; sync(); }
    function show() { pageHidden = false; sync(); }
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      inView = entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= .08);
      sync();
    }, {threshold: [0, .08, .25]}) : null;
    function visibilityFallback() {
      const rect = section.getBoundingClientRect();
      inView = rect.bottom > 0 && rect.top < window.innerHeight;
      sync();
    }
    button.addEventListener('click', toggle);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pagehide', hide);
    window.addEventListener('pageshow', show);
    if (media.addEventListener) media.addEventListener('change', sync);
    else media.addListener(sync);
    if (observer) observer.observe(section);
    else {
      window.addEventListener('scroll', visibilityFallback, {passive: true});
      window.addEventListener('resize', visibilityFallback, {passive: true});
      visibilityFallback();
    }
    sync();
    const api = { element: section, destroy() {
      destroyed = true;
      sync();
      if (observer) observer.disconnect();
      button.removeEventListener('click', toggle);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('pageshow', show);
      window.removeEventListener('scroll', visibilityFallback);
      window.removeEventListener('resize', visibilityFallback);
      if (media.removeEventListener) media.removeEventListener('change', sync);
      else media.removeListener(sync);
      section.remove();
      instances.delete(host);
    }};
    instances.set(host, api);
    return api;
  }
  window.GryphusRanch = {mount};
  function boot() { document.querySelectorAll('[data-gryphus-ranch]').forEach(mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
