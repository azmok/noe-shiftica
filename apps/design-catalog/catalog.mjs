import { fonts, themes } from './themes.mjs';

const $ = (selector) => document.querySelector(selector);
const fields = {
  size: ['文字サイズ', 12, 32, .5, 'px'],
  leading: ['行高', 1, 2.4, .01, ''],
  tracking: ['字間', -.06, .12, .001, 'em'],
  weight: ['太さ', 300, 800, 100, ''],
  rail: ['本文幅', 280, 900, 1, 'px'],
  inset: ['外側の余白', 8, 80, 1, 'px'],
  paragraph: ['段落間隔', 0, 64, 1, 'px'],
  media: ['画像の余白', 0, 88, 1, 'px'],
};
const storageKey = 'noe-design-catalog-v1';
const defaultPanels = [
  { theme: 'apple', layout: 'auto', viewport: 0 },
  { theme: 'airbnb', layout: 'one', viewport: 0 },
  { theme: 'apple', layout: 'auto', viewport: 768 },
];
const defaults = () => ({
  version: 1, sample: 'essay', count: 1, sync: true,
  appearance: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  panels: defaultPanels.map(panel => ({ ...panel, overrides: {}, note: '' })),
});
let samples;
let state;
let panels = [];
let observer;
let editingIndex = 0;
let editorTrigger;
const pendingScroll = new WeakMap();
const own = (object, key) => Object.hasOwn(object, key);
const option = (value, label) => new Option(label, value);
const message = (text) => { $('#status').textContent = text; };
const spreadGap = 20;

function readSession(value) {
  if (value?.version !== 1 || ![1, 2, 3].includes(value.count) ||
      !Array.isArray(value.panels) || value.panels.length < value.count ||
      !samples.some(sample => sample.id === value.sample) || typeof value.sync !== 'boolean') {
    throw new Error('対応していない設定ファイルです。');
  }
  const result = { ...defaults(), count: value.count, sample: value.sample, sync: value.sync };
  if (['light', 'dark'].includes(value.appearance)) result.appearance = value.appearance;
  value.panels.slice(0, 3).forEach((panel, index) => {
    if (!panel || !own(themes, panel.theme) || !['one', 'two', 'auto'].includes(panel.layout) ||
        ![0, 390, 768, 1024, 1440].includes(panel.viewport)) {
      throw new Error('パネル設定に使えない値があります。');
    }
    const overrides = {};
    for (const [field, [, min, max]] of Object.entries(fields)) {
      const item = panel.overrides?.[field];
      if (Number.isFinite(item) && item >= min && item <= max) overrides[field] = item;
    }
    if (own(fonts, panel.overrides?.font)) overrides.font = panel.overrides.font;
    result.panels[index] = {
      theme: panel.theme, layout: panel.layout, viewport: panel.viewport,
      overrides, note: typeof panel.note === 'string' ? panel.note.slice(0, 5000) : '',
    };
  });
  return result;
}

function saveLocal() {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* JSON export still works. */ }
}

function applyAppearance() {
  document.documentElement.dataset.appearance = state.appearance;
  for (const input of document.querySelectorAll('[name="appearance"]')) {
    input.checked = input.value === state.appearance;
  }
}

function makeControl(field, label, input) {
  const control = document.createElement('label');
  control.className = 'control';
  control.append(document.createTextNode(label));
  const output = document.createElement('output');
  if (input.type === 'range') control.append(output);
  input.dataset.override = field;
  control.append(input);
  return { control, input, output };
}

function syncScroll(source) {
  if (pendingScroll.has(source)) {
    const expected = pendingScroll.get(source);
    pendingScroll.delete(source);
    if (Math.abs(source.scrollTop - expected) <= 2) return;
  }
  if (!state.sync) return;
  const travel = source.scrollHeight - source.clientHeight;
  if (travel <= 0) return;
  const ratio = source.scrollTop / travel;
  for (const { scroll } of panels) {
    if (scroll === source) continue;
    const top = Math.round(ratio * (scroll.scrollHeight - scroll.clientHeight));
    if (Math.abs(scroll.scrollTop - top) <= 2) continue;
    pendingScroll.set(scroll, top);
    scroll.scrollTop = top;
  }
}

function showEditorTarget() {
  if ($('#editor').hidden) return;
  $('#editor-target').value = String(editingIndex);
  $('#editor-content').replaceChildren(panels[editingIndex].properties);
  panels.forEach((panel, index) => panel.node.toggleAttribute('data-editing', index === editingIndex));
}

function setEditor(open, trigger) {
  $('#editor').hidden = !open;
  $('#workspace').toggleAttribute('data-editor-open', open);
  $('#editor-toggle').setAttribute('aria-expanded', String(open));
  if (open) {
    editorTrigger = trigger;
    showEditorTarget();
    $('#editor-close').focus();
  } else {
    panels.forEach(panel => panel.node.removeAttribute('data-editing'));
    $('#editor-content').replaceChildren();
    (editorTrigger?.isConnected ? editorTrigger : $('#editor-toggle')).focus();
  }
}

function makePanel(index) {
  const data = state.panels[index];
  const node = $('#panel-template').content.firstElementChild.cloneNode(true);
  const scroll = node.querySelector('.preview-scroll');
  const preview = node.querySelector('.preview');
  const track = node.querySelector('.spread-track');
  const mirror = node.querySelector('.spread-mirror');
  const properties = $('#editor-template').content.firstElementChild.cloneNode(true);
  const controls = properties.querySelector('.controls');
  const heading = node.querySelector('.panel-bar h2');
  heading.id = `panel-${index + 1}`;
  heading.textContent = 'ABC'[index];
  node.setAttribute('aria-labelledby', heading.id);
  scroll.setAttribute('aria-label', `記事プレビュー ${heading.textContent}`);
  const edit = node.querySelector('.panel-edit');
  edit.setAttribute('aria-label', `パネル ${heading.textContent} を調整`);
  edit.addEventListener('click', () => {
    editingIndex = index;
    setEditor(true, edit);
  });
  properties.querySelector('[data-field="theme"]').append(...Object.entries(themes).map(([id, theme]) => option(id, theme.label)));
  for (const select of properties.querySelectorAll('[data-field]')) {
    const field = select.dataset.field;
    select.value = data[field];
    select.addEventListener('change', () => {
      data[field] = field === 'viewport' ? Number(select.value) : select.value;
      if (field === 'theme') data.overrides = {};
      applyStyle(panel);
      saveLocal();
    });
  }

  const font = document.createElement('select');
  font.append(...Object.entries(fonts).map(([id, item]) => option(id, item.label)));
  const inputs = { font: makeControl('font', 'フォント', font) };
  for (const [field, [label, min, max, step]] of Object.entries(fields)) {
    const range = document.createElement('input');
    range.type = 'range';
    range.min = min;
    range.max = max;
    range.step = step;
    inputs[field] = makeControl(field, label, range);
  }
  for (const [field, { control, input }] of Object.entries(inputs)) {
    controls.append(control);
    input.addEventListener('input', () => {
      data.overrides[field] = field === 'font' ? input.value : Number(input.value);
      applyStyle(panel);
      saveLocal();
    });
  }

  const note = properties.querySelector('textarea');
  note.value = data.note;
  note.addEventListener('input', () => {
    data.note = note.value;
    saveLocal();
  });
  properties.querySelector('[data-reset]').addEventListener('click', () => {
    data.overrides = {};
    applyStyle(panel);
    saveLocal();
  });
  scroll.addEventListener('scroll', () => {
    positionSpread(panel);
    syncScroll(scroll);
  }, { passive: true });
  const panel = { data, node, scroll, preview, track, mirror, properties, inputs, linear: [], spreadKey: '', slotHeight: 0 };
  return panel;
}

function positionSpread({ scroll, track }) {
  if (scroll.hasAttribute('data-spread')) {
    track.style.setProperty('--spread-offset', `${scroll.scrollTop}px`);
  }
}

function measureSpread(panel) {
  const { scroll, preview, track } = panel;
  if (!scroll.hasAttribute('data-spread')) return;
  const frame = scroll.clientHeight;
  const article = preview.getBoundingClientRect().height;
  // One scrollbar moves both readings. Stop when the right window reaches the end.
  track.style.setProperty('--frame-height', `${frame}px`);
  track.style.setProperty('--track-height', `${Math.max(frame, Math.ceil(article - frame))}px`);
  positionSpread(panel);
}

function refreshMirror(panel) {
  const { preview, mirror } = panel;
  const stream = document.createElement('div');
  stream.className = 'spread-stream';
  stream.append(preview.cloneNode(true));
  mirror.replaceChildren(stream);
}

function spreadUnits([header, hero, body]) {
  const title = header.cloneNode(true);
  const intro = title.querySelector('.story-intro');
  intro.remove();
  const units = [title];
  if (intro.textContent.trim()) {
    const deck = document.createElement('div');
    deck.className = 'story-header';
    deck.append(intro);
    units.push(deck);
  }
  if (!hero.hidden) units.push(hero.cloneNode(true));
  const blocks = [...body.childNodes].filter(node => node.nodeType === Node.ELEMENT_NODE || node.textContent.trim());
  for (let index = 0; index < blocks.length; index++) {
    const block = blocks[index];
    const unit = document.createElement('div');
    unit.className = 'story-body';
    unit.append(block.cloneNode(true));
    if (block.matches?.('h2, h3, h4, h5, h6') && blocks[index + 1]?.matches?.('p')) {
      unit.append(blocks[++index].cloneNode(true));
    }
    units.push(unit);
  }
  return units;
}

function packSpread(panel) {
  const { scroll, preview, linear } = panel;
  const frame = scroll.clientHeight;
  const key = `${frame};${preview.dataset.theme};${preview.style.cssText}`;
  if (!frame || !linear.length || panel.spreadKey === key) return;
  const oldSlotHeight = panel.slotHeight;
  const scrollUnits = oldSlotHeight ? scroll.scrollTop / oldSlotHeight : 0;
  const slotHeight = frame / 2;
  const zoom = Number(preview.style.getPropertyValue('--zoom'));
  preview.style.setProperty('--slot-height', `${slotHeight / zoom}px`);

  const rack = document.createElement('div');
  rack.className = 'spread-rack';
  const units = spreadUnits(linear).map((content) => {
    const item = document.createElement('div');
    item.className = 'spread-unit';
    item.append(content);
    return item;
  });
  rack.append(...units);
  preview.replaceChildren(rack);
  const limits = rack.getBoundingClientRect();
  const start = rack.firstElementChild.getBoundingClientRect().top;
  const capacity = slotHeight - 2 * (start - limits.top) - 1;
  const heights = units.map(unit => unit.getBoundingClientRect().height);
  const pages = [];
  let remaining = 0;
  let page;
  units.forEach((unit, index) => {
    const height = heights[index];
    if (!page || height > remaining) {
      page = document.createElement('div');
      page.className = 'spread-slot';
      page.dataset.slot = String(pages.length + 1);
      pages.push(page);
      remaining = capacity;
    }
    if (height > capacity && capacity > 0) {
      // Keep an oversized figure or table intact at the rest positions.
      unit.style.transform = `scale(${capacity / height})`;
      unit.style.transformOrigin = 'top center';
    }
    page.append(unit);
    remaining -= height;
  });
  preview.replaceChildren(...pages);
  panel.slotHeight = slotHeight;
  panel.spreadKey = `${frame};${preview.dataset.theme};${preview.style.cssText}`;
  refreshMirror(panel);
  measureSpread(panel);
  scroll.scrollTop = scrollUnits * slotHeight;
  positionSpread(panel);
}

function applyStyle(panel) {
  const { data, node, preview, scroll, track, properties, inputs } = panel;
  const theme = themes[data.theme];
  const available = scroll.clientWidth;
  if (!available) return;
  const width = data.viewport || available;
  const tokens = { ...theme.tokens(width), ...data.overrides };
  const spread = data.layout === 'two' || (data.layout === 'auto' && width >= 768);
  const changedLayout = scroll.hasAttribute('data-spread') !== spread;
  const canvas = Math.min(available, width);
  const zoom = canvas / width;
  const px = (value) => `${value}px`;
  scroll.toggleAttribute('data-spread', spread);
  track.style.setProperty('--spread-width', px(canvas));
  track.style.setProperty('--spread-gap', px(spreadGap));
  preview.dataset.theme = data.theme;
  const cssProperties = {
    screen: spread ? px((canvas - spreadGap) / (2 * zoom)) : data.viewport ? px(width) : '100%', zoom,
    family: fonts[tokens.font].css, size: px(tokens.size), leading: tokens.leading,
    tracking: `${tokens.tracking}em`, weight: tokens.weight, rail: px(tokens.rail),
    inset: px(tokens.inset), 'paragraph-gap': px(tokens.paragraph), 'media-gap': px(tokens.media),
    'title-size': px(tokens.title), 'title-leading': px(tokens.titleLeading),
    'title-weight': tokens.titleWeight, 'title-gap': px(tokens.titleGap),
    'section-size': px(tokens.section), 'section-leading': px(tokens.sectionLeading),
    'section-tracking': `${tokens.sectionTracking}em`, 'section-weight': tokens.sectionWeight,
    'section-before': px(tokens.sectionBefore), 'section-after': px(tokens.sectionAfter),
  };
  for (const [name, value] of Object.entries(cssProperties)) preview.style.setProperty(`--${name}`, value);
  if (spread) {
    packSpread(panel);
  } else if (panel.spreadKey) {
    preview.replaceChildren(...panel.linear);
    panel.mirror.replaceChildren();
    panel.spreadKey = '';
    panel.slotHeight = 0;
  }
  if (changedLayout) scroll.scrollTop = 0;
  measureSpread(panel);
  for (const [field, { input, output }] of Object.entries(inputs)) {
    input.value = String(tokens[field]);
    if (field !== 'font') output.value = Number(tokens[field].toFixed(3)) + fields[field][4];
  }
  node.querySelector('.panel-theme').textContent = theme.label;
  properties.querySelector('.rationale').textContent = theme.rationale;
  properties.querySelector('.reference').href = theme.source;
}

function currentSample() {
  return samples.find(sample => sample.id === state.sample);
}

function renderArticle(panel) {
  const { preview, scroll } = panel;
  const sample = currentSample();
  const template = $('#panel-template').content.querySelector('.preview');
  preview.replaceChildren(...template.cloneNode(true).childNodes);
  preview.querySelector('.story-kind').textContent = sample.kind;
  preview.querySelector('.story-title').textContent = sample.title;
  preview.querySelector('.story-intro').textContent = sample.intro;
  const hero = preview.querySelector('.story-hero');
  hero.hidden = !sample.hero;
  if (sample.hero) hero.querySelector('img').src = sample.hero;
  const body = preview.querySelector('.story-body');
  // These snapshots are shipped with the app and reduced to editorial markup.
  body.innerHTML = sample.body;
  for (const image of body.querySelectorAll('img')) image.loading = 'eager';
  for (const table of body.querySelectorAll('table')) {
    const wrap = document.createElement('div');
    wrap.className = 'table-scroll';
    wrap.tabIndex = 0;
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', '表を横にスクロール');
    table.replaceWith(wrap);
    wrap.append(table);
  }
  const linear = [...preview.children];
  panel.linear = linear;
  panel.spreadKey = '';
  panel.slotHeight = 0;
  scroll.scrollTop = 0;
  const images = [...preview.querySelectorAll('img[src]')];
  Promise.allSettled(images.map(image => image.decode())).then(() => {
    if (panel.linear !== linear || !preview.isConnected || !scroll.hasAttribute('data-spread')) return;
    panel.spreadKey = '';
    packSpread(panel);
  });
  if (scroll.hasAttribute('data-spread')) packSpread(panel);
}

function renderPanels() {
  observer?.disconnect();
  applyAppearance();
  const target = $('#panels');
  target.style.setProperty('--panels', state.count);
  target.dataset.count = state.count;
  panels = Array.from({ length: state.count }, (_, index) => makePanel(index));
  target.replaceChildren(...panels.map(panel => panel.node));
  observer = new ResizeObserver(entries => {
    for (const entry of entries) {
      const panel = panels.find(item => item.scroll === entry.target || item.preview === entry.target);
      if (panel?.scroll === entry.target) applyStyle(panel);
      else if (panel) measureSpread(panel);
    }
  });
  panels.forEach(panel => {
    renderArticle(panel);
    applyStyle(panel);
    observer.observe(panel.scroll);
    observer.observe(panel.preview);
  });
  $('#sample').value = state.sample;
  $('#count').value = state.count;
  $('#sync').checked = state.sync;
  $('#sync').disabled = state.count === 1;
  $('#sync').closest('label').hidden = state.count === 1;
  $('#original').href = currentSample().source;
  editingIndex = Math.min(editingIndex, panels.length - 1);
  $('#editor-target').replaceChildren(...panels.map((_, index) => option(index, `パネル ${'ABC'[index]}`)));
  $('#editor-target').disabled = panels.length === 1;
  $('#editor-target').closest('label').hidden = panels.length === 1;
  showEditorTarget();
}

async function start() {
  const response = await fetch('./samples/index.json');
  if (!response.ok) throw new Error('サンプル記事を読み込めませんでした。');
  samples = await response.json();
  state = defaults();
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) state = readSession(JSON.parse(saved));
  } catch { message('前回の設定を読み込めなかったため、初期値を表示しました。'); }
  $('#sample').append(...samples.map(sample => option(sample.id, `[${sample.kind}] ${sample.title}`)));
  renderPanels();
  for (const input of document.querySelectorAll('[name="appearance"]')) {
    input.addEventListener('change', () => {
      state.appearance = input.value;
      applyAppearance();
      saveLocal();
    });
  }
  $('#editor-toggle').addEventListener('click', event => setEditor($('#editor').hidden, event.currentTarget));
  $('#editor-close').addEventListener('click', () => setEditor(false));
  $('#editor-target').addEventListener('change', event => {
    editingIndex = Number(event.target.value);
    showEditorTarget();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !$('#editor').hidden) {
      event.preventDefault();
      setEditor(false);
    }
  });
  $('#sample').addEventListener('change', event => {
    state.sample = event.target.value;
    $('#original').href = currentSample().source;
    panels.forEach(renderArticle);
    saveLocal();
  });
  $('#count').addEventListener('change', event => {
    state.count = Number(event.target.value);
    renderPanels();
    saveLocal();
  });
  $('#sync').addEventListener('change', event => {
    state.sync = event.target.checked;
    saveLocal();
  });
  $('#export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'noe-design-catalog.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    message('比較設定とメモをJSONに保存したで。');
  });
  $('#import').addEventListener('click', () => $('#file').click());
  $('#file').addEventListener('change', async event => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
      if (file.size > 100_000) throw new Error('設定ファイルが大きすぎます。');
      state = readSession(JSON.parse(await file.text()));
      renderPanels();
      saveLocal();
      message('比較設定とメモを読み込みました。');
    } catch {
      message('設定を読み込めませんでした。このカタログから保存したJSONを選んでください。');
    }
  });
}

start().catch(error => message(error.message));
