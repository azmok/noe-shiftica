import { blob } from './blob.mjs';
import { appearance, page, style } from './kit.mjs';
import { posts } from './content.mjs';

document.documentElement.dataset.appearance = appearance;
document.documentElement.dataset.style = style;
const sheets = style === 'airbnb' ? ['airbnb'] : ['common', style];
const [theme] = await Promise.all([
  import(`./${style}.mjs`).then((module) => module.default),
  ...sheets.map((name) => new Promise((done) => {
    const sheet = document.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.href = `./${name}.css`;
    sheet.onload = done;
    sheet.onerror = done;
    document.head.append(sheet);
  })),
]);

document.title = `${page} · Noe Shiftica 見本（${style}）`;
document.body.className = `page-${page}`;
document.body.innerHTML = theme.shell(page, theme.pages[page]());

const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const menu = document.querySelector('.menu');
menu?.addEventListener('click', () => menu.setAttribute('aria-expanded', String(menu.getAttribute('aria-expanded') !== 'true')));

const chips = document.querySelector('.chips');
chips?.addEventListener('click', ({ target }) => {
  if (!target.matches('button')) return;
  for (const chip of chips.querySelectorAll('button')) chip.setAttribute('aria-pressed', String(chip === target));
  const cards = document.querySelectorAll('#posts > *');
  posts.forEach((post, i) => { if (cards[i]) cards[i].hidden = target.value !== 'すべて' && post.group !== target.value; });
});

for (const button of document.querySelectorAll('[data-scroll]')) {
  const target = document.getElementById(button.dataset.for);
  const step = Number(button.dataset.scroll);
  button.addEventListener('click', () => {
    const item = target.firstElementChild;
    const gap = parseFloat(getComputedStyle(target).columnGap) || 0;
    target.scrollBy({ left: step * (item.getBoundingClientRect().width + gap), behavior: calm ? 'auto' : 'smooth' });
  });
  const update = () => { button.disabled = step < 0 ? target.scrollLeft < 4 : target.scrollLeft > target.scrollWidth - target.clientWidth - (parseFloat(getComputedStyle(target).paddingRight) || 0) - 4; };
  target.addEventListener('scroll', update, { passive: true });
  new ResizeObserver(update).observe(target);
}

for (const canvas of document.querySelectorAll('canvas')) blob(canvas, { calm, light: appearance === 'light' && !canvas.closest('[data-dark]') });

if (page === 'article') {
  try { await theme.fill(); } catch { document.querySelector('#post').textContent = '記事の見本を読み込めませんでした。'; }
}
if (!calm && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('in'); observer.unobserve(entry.target); }
  }, { rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('[data-in]').forEach((element) => { element.classList.add('wait'); observer.observe(element); });
}
