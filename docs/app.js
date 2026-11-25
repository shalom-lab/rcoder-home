(() => {
  // Use plain links even without JavaScript. With it, keep shared section IDs
  // across both localized pages; don't carry an unknown or private fragment.
  const language = document.getElementById('switch-language');
  const sections = new Set(['#top', '#main', '#workflow', '#demo', '#faq']);
  function syncLanguageLink() {
    const section = sections.has(window.location.hash) ? window.location.hash : '';
    language.href = language.dataset.baseHref + section;
  }
  syncLanguageLink();
  for (const event of ['hashchange', 'pageshow']) window.addEventListener(event, syncLanguageLink);

  const list = document.querySelector('[role="tablist"]');
  const steps = Array.from(list.querySelectorAll('[role="tab"]'));
  function select(next, moveFocus) {
    steps.forEach((tab, i) => {
      const selected = i === next;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
    });
    if (moveFocus) steps[next].focus();
  }
  const compact = window.matchMedia('(max-width: 830px)');
  function syncOrientation() { list.setAttribute('aria-orientation', compact.matches ? 'horizontal' : 'vertical'); }
  syncOrientation();
  compact.addEventListener?.('change', syncOrientation);
  steps.forEach((tab, i) => tab.addEventListener('click', () => select(i, false)));
  list.addEventListener('keydown', event => {
    const active = steps.indexOf(event.target);
    if (active < 0) return;
    const next = ({ ArrowRight: active + 1, ArrowDown: active + 1, ArrowLeft: active - 1,
      ArrowUp: active - 1, Home: 0, End: steps.length - 1 })[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select((next + steps.length) % steps.length, true);
  });
  const prompt = document.getElementById('prompt-text');
  const detail = document.getElementById('prompt-details');
  const status = document.getElementById('copy-status');
  const copyButton = document.getElementById('copy-prompt');
  copyButton.addEventListener('click', async () => {
    status.textContent = '';
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(prompt.textContent.trim());
      status.textContent = status.dataset.success;
    } catch {
      detail.open = true;
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(prompt);
      selection?.removeAllRanges();
      selection?.addRange(range);
      status.textContent = status.dataset.fallback;
    }
  });
})();
