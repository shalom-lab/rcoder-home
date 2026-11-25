(() => {
  'use strict';
  const title = document.getElementById('hero-heading');
  const toggle = document.querySelector('.hero-rotation');
  if (!title || !toggle) return;
  const parts = [...title.querySelectorAll('[data-hero-part]')];
  const lines = [...title.querySelectorAll('[data-hero-line]')].map(line =>
    [...line.children].map(part => Array.from(part.textContent)));
  if (parts.length !== 3 || lines.length < 2) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const control = toggle.querySelector('[data-hero-control]');
  const isChinese = document.documentElement.lang.startsWith('zh');
  const history = { index: 0, timer: 0, inView: true, playing: !motion.matches };
  const canRun = () => history.playing && history.inView && !document.hidden;
  function paint(line, count = Infinity, cursor = false) {
    let left = count;
    let cursorIndex = -1;
    for (let j = 0; j < parts.length; j++) {
      const take = Math.min(line[j].length, Math.max(0, left));
      parts[j].textContent = line[j].slice(0, take).join('');
      if (cursor && line[j].length && take < line[j].length && cursorIndex < 0) cursorIndex = j;
      left -= take;
    }
    for (let j = 0; j < parts.length; j++) parts[j].toggleAttribute('data-hero-cursor', j === cursorIndex);
  }
  function restore() {
    clearTimeout(history.timer);
    title.classList.remove('is-switching');
    paint(lines[history.index]);
  }
  function queue() {
    clearTimeout(history.timer);
    if (!canRun()) return;
    history.timer = setTimeout(change, 3300);
  }
  function change() {
    if (!canRun()) return;
    if (!motion.matches) title.classList.add('is-switching');
    history.timer = setTimeout(() => {
      if (!canRun()) { restore(); return; }
      history.index = (history.index + 1) % lines.length;
      const next = lines[history.index];
      title.classList.remove('is-switching');
      if (motion.matches) { paint(next); queue(); return; }
      let n = 1;
      const total = next.reduce((sum, p) => sum + p.length, 0);
      const tick = () => {
        if (!canRun()) { restore(); return; }
        paint(next, n, n < total);
        if (n >= total) { queue(); return; }
        n++;
        history.timer = setTimeout(tick, isChinese ? 73 : 31);
      };
      tick();
    }, motion.matches ? 0 : 175);
  }
  function showState() {
    toggle.setAttribute('aria-pressed', String(history.playing));
    control.textContent = history.playing ? toggle.dataset.heroPause : toggle.dataset.heroPlay;
  }
  toggle.addEventListener('click', () => {
    history.playing = !history.playing;
    showState();
    restore();
    queue();
  });
  motion.addEventListener?.('change', event => {
    if (event.matches) { history.playing = false; showState(); restore(); }
  });
  document.addEventListener('visibilitychange', () => { restore(); queue(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      history.inView = entry.isIntersecting;
      restore();
      queue();
    }, { threshold: 0.1 }).observe(title);
  }
  showState();
  toggle.hidden = false;
  queue();
})();
