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
  const promptHead = isChinese ? /^(一句话|一切，只需一句话)/ : /^one prompt\b/i;
  const isPrompt = lines.map(line => promptHead.test(line.flat().join('')));
  function shuffle(items) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }
  function newDeck(previous) {
    const prompt = [], other = [];
    isPrompt.forEach((grouped, i) => (grouped ? prompt : other).push(i));
    shuffle(prompt); shuffle(other);
    // Put at most one prompt headline in each gap between other headlines.
    // Prefer a different opening on first arrival and respect the last title at a deck boundary.
    const avoidOpeningPrompt = isPrompt[previous] || (previous === -1 && Math.random() < .75);
    const slots = shuffle(Array.from({ length: other.length + 1 }, (_, i) => i)
      .filter(i => i !== 0 || !avoidOpeningPrompt));
    if (slots.length < prompt.length || !other.length) {
      const deck = shuffle(lines.map((_, i) => i));
      if (deck[0] === previous) [deck[0], deck[1]] = [deck[1], deck[0]];
      return deck;
    }
    const selected = new Set(slots.slice(0, prompt.length));
    if (!selected.has(0) && other[0] === previous) {
      const j = 1 + Math.floor(Math.random() * (other.length - 1));
      [other[0], other[j]] = [other[j], other[0]];
    }
    const deck = [];
    for (let i = 0; i <= other.length; i++) {
      if (selected.has(i)) deck.push(prompt.pop());
      if (i < other.length) deck.push(other[i]);
    }
    return deck;
  }
  let deck = newDeck(motion.matches ? 0 : -1);
  const history = { index: motion.matches ? 0 : deck.shift(), timer: 0, inView: true, playing: !motion.matches };
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
    history.timer = setTimeout(change, 4700);
  }
  function change() {
    if (!canRun()) return;
    if (!motion.matches) title.classList.add('is-switching');
    history.timer = setTimeout(() => {
      if (!canRun()) { restore(); return; }
      if (!deck.length) deck = newDeck(history.index);
      history.index = deck.shift();
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
        const ch = next.flat()[n - 1];
        const delay = (isChinese ? 101 : 48) + (/[,.!?，。！？、]/.test(ch) ? 75 : 0);
        history.timer = setTimeout(tick, delay);
      };
      tick();
    }, motion.matches ? 0 : 300);
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
  paint(lines[history.index]);
  showState();
  toggle.hidden = false;
  queue();
})();
