const $ = (selector) => document.querySelector(selector);
const pages = [['top', 'トップ', '/'], ['services', 'サービス', '/services'], ['works', 'Works', '/services#works'], ['about', 'About', '/about'], ['blog', '記事一覧', '/blog'], ['article', '記事', '/blog/fully-remote-not-cutting-corners']];
const styles = [['apple', 'Apple'], ['airbnb', 'Airbnb'], ['webflow', 'Webflow']];
const modes = [['pair', 'PCとスマホ'], ['compare', '3テーマ（PC）'], ['phones', '3テーマ（スマホ）']];
const key = 'noe-design-catalog-pages-v2';
const state = { page: 'top', style: 'apple', mode: 'pair', appearance: 'dark' };
try { Object.assign(state, JSON.parse(localStorage.getItem(key)) ?? {}); } catch { /* 初期値で表示する */ }
const valid = { page: pages, style: styles, mode: modes, appearance: [['dark'], ['light']] };
for (const [name, list] of Object.entries(valid)) if (!list.some(([id]) => id === state[name])) state[name] = list[0][0];

let frames = [];
let observers = [];
let builtMode = '';
const urlOf = (style) => `./site/?page=${state.page}&style=${style}&appearance=${state.appearance}`;

function build() {
  for (const observer of observers) observer.disconnect();
  observers = [];
  const specs = state.mode === 'pair' ? [['PC', 1440, null], ['スマホ', 390, null]] : styles.map(([id, label]) => [label, state.mode === 'compare' ? 1440 : 390, id]);
  frames = specs.map(([label, width, style]) => {
    const node = $('#panel').content.firstElementChild.cloneNode(true);
    const frame = node.querySelector('iframe');
    const stage = node.querySelector('.stage');
    node.querySelector('.frame-title').textContent = label;
    node.querySelector('.frame-size').textContent = `${width}px`;
    frame.title = `${label}の見本`;
    const observer = new ResizeObserver(() => {
      const zoom = Math.min(1, stage.clientWidth / width);
      frame.style.width = `${width}px`;
      frame.style.height = `${Math.ceil(stage.clientHeight / zoom)}px`;
      frame.style.transform = `scale(${zoom})`;
      frame.style.marginInlineEnd = `${-width * (1 - zoom)}px`;
    });
    observer.observe(stage);
    observers.push(observer);
    const item = { frame, node, style };
    frame.addEventListener('load', () => {
      const at = new URLSearchParams(frame.contentWindow.location.search).get('page');
      if (at && at !== state.page && pages.some(([id]) => id === at)) { state.page = at; show(); }
    });
    return item;
  });
  $('#panels').className = `panels ${state.mode}`;
  $('#panels').replaceChildren(...frames.map(({ node }) => node));
  builtMode = state.mode;
}

function show() {
  if (builtMode !== state.mode) build();
  for (const { frame, style } of frames) {
    const url = new URL(urlOf(style ?? state.style), location.href).href;
    if (frame.contentWindow.location.href !== url) frame.contentWindow.location.replace(url);
  }
  const press = (selector, value) => { for (const button of document.querySelectorAll(`${selector} button`)) button.setAttribute('aria-pressed', String(button.value === value)); };
  press('#list', state.page);
  press('#styles', state.style);
  press('#modes', state.mode);
  for (const button of document.querySelectorAll('#styles button')) button.disabled = state.mode !== 'pair';
  for (const input of document.querySelectorAll('[name="site"]')) input.checked = input.value === state.appearance;
  document.documentElement.dataset.appearance = state.appearance;
  $('#open').href = urlOf(state.style);
  $('#live').href = `https://noe-shiftica.com${pages.find(([id]) => id === state.page)[2]}`;
  try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* 保存できなくても表示は続ける */ }
}

function buttons(target, list, name, note) {
  $(target).append(...list.map(([id, label, extra]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.value = id;
    button.append(label);
    if (note && extra.length <= 12) { const small = document.createElement('small'); small.textContent = extra; button.append(small); }
    button.addEventListener('click', () => { state[name] = id; show(); });
    return button;
  }));
}
buttons('#list', pages, 'page', true);
buttons('#styles', styles, 'style');
buttons('#modes', modes, 'mode');
for (const input of document.querySelectorAll('[name="site"]')) input.addEventListener('change', () => { state.appearance = input.value; show(); });
show();
