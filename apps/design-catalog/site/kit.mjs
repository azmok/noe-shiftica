import { live } from './content.mjs';

const params = new URLSearchParams(location.search);
const pick = (name, values) => (values.includes(params.get(name)) ? params.get(name) : values[0]);
export const page = pick('page', ['top', 'services', 'works', 'about', 'blog', 'article']);
export const appearance = pick('appearance', ['dark', 'light']);
export const style = pick('style', ['airbnb', 'apple', 'webflow']);

export const contact = `${live}/#contact`;
export const out = 'target="_blank" rel="noopener noreferrer"';
export const esc = (text) => String(text).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
export const each = (list, render) => list.map(render).join('');
export const link = (id) => `?page=${id}&style=${style}&appearance=${appearance}`;
const attrs = (href) => `href="${href}" ${href.startsWith('http') ? out : ''}`;
export const arrowLess = (label, href, kind = 'primary') => `<a class="btn ${kind}" ${attrs(href)}>${label}</a>`;
export const anchor = (label, href, cls = '') => `<a class="${cls}" ${attrs(href)}>${label}</a>`;
export const arrow = (dir) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${dir === 'prev' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}"/></svg>`;

// 横に流れる列。前後のボタンは data-scroll で動かす
export const scroller = (id, label, inner, cls = '') => `<div class="scroller ${cls}" id="${id}" tabindex="0" role="region" aria-label="${label}">${inner}</div>`;
export const paddles = (id) => `<span class="paddles"><button type="button" data-scroll="-1" data-for="${id}" aria-label="前へ">${arrow('prev')}</button><button type="button" data-scroll="1" data-for="${id}" aria-label="次へ">${arrow('next')}</button></span>`;

export async function sample() {
  const samples = await (await fetch('../samples/index.json')).json();
  const post = samples.find((item) => item.id === 'structured') ?? samples[0];
  return { post, src: (path) => path.replace(/^\.\//, '../'), body: post.body.replaceAll('"./samples/', '"../samples/') };
}

export function wrapTables(scope) {
  for (const table of document.querySelectorAll(`${scope} table`)) {
    const wrap = document.createElement('div');
    wrap.className = 'table-scroll';
    wrap.tabIndex = 0;
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', '表を横にスクロール');
    table.replaceWith(wrap);
    wrap.append(table);
  }
}
