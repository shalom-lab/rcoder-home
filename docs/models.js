(() => {
  'use strict';
  const list = document.getElementById('models-list');
  if (!list) return;
  const panel = list.closest('.models-panel');
  const button = panel.querySelector('.models-toggle');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const second = list.cloneNode(true);
  second.removeAttribute('id');
  second.setAttribute('aria-hidden', 'true');
  second.hidden = true;
  list.after(second);
  let playing = !motion.matches;
  let onScreen = !('IntersectionObserver' in window);
  function visibility() {
    panel.classList.toggle('is-visible', onScreen && !document.hidden);
  }
  function display() {
    panel.classList.toggle('is-moving', playing);
    // The duplicate only supplies the seamless visual loop, never a second accessible list.
    second.hidden = !playing;
    button.textContent = playing ? button.dataset.stop : button.dataset.play;
  }
  button.addEventListener('click', () => {
    playing = !playing;
    display();
  });
  motion.addEventListener?.('change', event => {
    if (event.matches) { playing = false; display(); }
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      visibility();
    }).observe(list.parentElement.parentElement);
  }
  document.addEventListener('visibilitychange', visibility);
  button.hidden = false;
  display();
  visibility();
})();
