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
const storageKey = 'noe-design-catalog-v4';
const defaultPanels = [
  { theme: 'apple', layout: 'one', viewport: 1440 },
  { theme: 'airbnb', layout: 'one', viewport: 1440 },
  { theme: 'apple', layout: 'one', viewport: 390 },
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
const railHeight = 24;

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

let expandedPanel = null;
let fullscreenHintSeen = false;
const fullscreenHintKey = 'noe-design-catalog-fullscreen-hint-seen';

function showFullscreenHint(node) {
  if (fullscreenHintSeen) return;
  fullscreenHintSeen = true;
  try {
    if (localStorage.getItem(fullscreenHintKey)) return;
    localStorage.setItem(fullscreenHintKey, '1');
  } catch { /* Keep the one-time behavior for this page when storage is unavailable. */ }
  const hint = node.querySelector('.fullscreen-hint');
  hint.hidden = false;
  setTimeout(() => { hint.hidden = true; }, 5000);
}

function updateFullscreenButtons() {
  const active = expandedPanel || document.fullscreenElement;
  for (const { node } of panels) {
    const button = node.querySelector('.panel-fullscreen');
    const isActive = node === active;
    const label = isActive ? '全画面を閉じる' : '全画面';
    button.setAttribute('aria-pressed', String(isActive));
    button.setAttribute('aria-label', label);
    button.title = label;
    if (isActive) showFullscreenHint(node);
    else node.querySelector('.fullscreen-hint').hidden = true;
  }
}

function setExpandedPanel(node) {
  expandedPanel?.removeAttribute('data-expanded');
  expandedPanel = node;
  node?.setAttribute('data-expanded', '');
  document.documentElement.toggleAttribute('data-preview-expanded', Boolean(node));
  for (const element of document.querySelectorAll('.side, #editor, #panels > .panel')) {
    element.inert = Boolean(node && element !== node);
  }
  updateFullscreenButtons();
}

async function toggleFullscreen(node) {
  if (expandedPanel === node) {
    setExpandedPanel(null);
  } else if (document.fullscreenElement === node) {
    await document.exitFullscreen();
  } else if (document.fullscreenEnabled && node.requestFullscreen) {
    try {
      await node.requestFullscreen();
    } catch {
      setExpandedPanel(node);
    }
  } else {
    setExpandedPanel(node);
  }
}

function makePanel(index) {
  const data = state.panels[index];
  const node = $('#panel-template').content.firstElementChild.cloneNode(true);
  const scroll = node.querySelector('.preview-scroll');
  const preview = node.querySelector('.preview');
  const track = node.querySelector('.spread-track');
  const rightStream = node.querySelector('.spread-right .spread-stream');
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
  node.querySelector('.panel-fullscreen').addEventListener('click', () => {
    toggleFullscreen(node).catch(() => message('全画面表示を切り替えられませんでした。'));
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

  const segments = {
    theme: Object.entries(themes).map(([id, theme]) => [id, theme.label.replace(/ (Newsroom|Blog)$/, '')]),
    viewport: [['1440', 'PC'], ['768', 'iPad'], ['390', 'スマホ'], ['0', '実寸']],
  };
  for (const [field, items] of Object.entries(segments)) {
    node.querySelector(`[data-seg="${field}"]`).append(...items.map(([value, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.value = value;
      button.textContent = label;
      button.addEventListener('click', () => {
        const select = properties.querySelector(`[data-field="${field}"]`);
        select.value = value;
        select.dispatchEvent(new Event('change'));
      });
      return button;
    }));
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
  const panel = {
    data, node, scroll, preview, track, rightStream, properties, inputs,
    contentHeight: 0, maxOffset: 0, articleToken: 0,
  };
  return panel;
}

function clearBoundarySpacers(preview) {
  for (const el of preview.querySelectorAll('[data-spread-pushed]')) {
    el.style.marginTop = '';
    el.removeAttribute('data-spread-pushed');
  }
}

function alignMediaAcrossColumnBreaks(preview, contentHeight, zoom) {
  clearBoundarySpacers(preview);
  if (!contentHeight || !zoom) return;

  // Keep figures, hero images, and tables from getting sliced across the column-height seam (y = k * contentHeight).
  const targets = [
    ...preview.querySelectorAll('.story-hero:not([hidden]), .story-body figure, .story-body .table-scroll'),
  ];
  for (const el of targets) {
    const baseTop = preview.getBoundingClientRect().top;
    const rect = el.getBoundingClientRect();
    const height = rect.height;
    if (height <= 0 || height >= contentHeight * 0.96) continue;
    const relTop = rect.top - baseTop;
    const relBottom = rect.bottom - baseTop;
    const pageStart = Math.floor(relTop / contentHeight) * contentHeight;
    const seam = pageStart + contentHeight;
    if (relTop < seam - 1 && relBottom > seam + 1) {
      const pushPx = (seam - relTop) / zoom;
      const currentMargin = parseFloat(getComputedStyle(el).marginTop) || 0;
      el.style.marginTop = `${currentMargin + pushPx}px`;
      el.setAttribute('data-spread-pushed', '1');
    }
  }
}

function positionSpread(panel) {
  const { scroll, track, maxOffset } = panel;
  if (!scroll.hasAttribute('data-spread')) return;
  const offset = Math.max(0, Math.min(maxOffset, scroll.scrollTop));
  track.style.setProperty('--spread-offset', `${offset}px`);
}

function refreshMirror(panel) {
  const { preview, rightStream } = panel;
  const clone = preview.cloneNode(true);
  clone.removeAttribute('id');
  rightStream.replaceChildren(clone);
}

function measureSpread(panel, preserveRatio = true) {
  const { scroll, preview, track } = panel;
  if (!scroll.hasAttribute('data-spread')) return;
  const frame = scroll.clientHeight;
  if (!frame) return;
  const oldMax = panel.maxOffset;
  const ratio = preserveRatio && oldMax > 0 ? scroll.scrollTop / oldMax : 0;

  const contentHeight = Math.max(180, frame - railHeight * 2);
  const zoom = Number(preview.style.getPropertyValue('--zoom')) || 1;
  panel.contentHeight = contentHeight;
  track.style.setProperty('--frame-height', `${frame}px`);
  track.style.setProperty('--rail-h', `${railHeight}px`);
  track.style.setProperty('--content-height', `${contentHeight}px`);
  preview.style.setProperty('--content-height', `${contentHeight}px`);

  alignMediaAcrossColumnBreaks(preview, contentHeight, zoom);

  const articleHeight = preview.getBoundingClientRect().height;
  // Left shows [s, s + contentHeight], right shows [s + contentHeight, s + 2 * contentHeight].
  // Stop scrolling when right reaches the end of the article: s_max = articleHeight - 2 * contentHeight.
  const maxOffset = Math.max(0, Math.ceil(articleHeight - contentHeight * 2));
  panel.maxOffset = maxOffset;
  track.style.setProperty('--track-height', `${frame + maxOffset}px`);

  refreshMirror(panel);
  if (preserveRatio && oldMax > 0 && maxOffset > 0) {
    scroll.scrollTop = Math.round(ratio * maxOffset);
  }
  positionSpread(panel);
}

function applyStyle(panel) {
  const { data, node, preview, scroll, track, properties, inputs } = panel;
  const theme = themes[data.theme];
  const available = scroll.clientWidth;
  if (!available) return;
  const width = data.viewport || available;
  const tokens = { ...theme.tokens(width), ...data.overrides };
  const spread = (data.layout === 'two' && width >= 640) || (data.layout === 'auto' && width >= 768);
  const changedLayout = scroll.hasAttribute('data-spread') !== spread;
  const canvas = Math.min(available, width);
  const zoom = canvas / width;
  const px = (value) => `${value}px`;
  scroll.toggleAttribute('data-spread', spread);
  track.style.setProperty('--spread-width', px(canvas));
  track.style.setProperty('--spread-gap', px(spreadGap));
  preview.dataset.theme = data.theme;
  preview.dataset.size = theme.size(spread ? (canvas - spreadGap) / (2 * zoom) : width);
  const cssProperties = {
    screen: spread ? px((canvas - spreadGap) / (2 * zoom)) : data.viewport ? px(width) : '100%', zoom,
    family: fonts[tokens.font].css, features: fonts[tokens.font].features, size: px(tokens.size), leading: tokens.leading,
    tracking: `${tokens.tracking}em`, weight: tokens.weight, rail: px(tokens.rail),
    inset: px(tokens.inset), 'paragraph-gap': px(tokens.paragraph), 'media-gap': px(tokens.media),
    'title-size': px(tokens.title), 'title-leading': px(tokens.titleLeading),
    'title-weight': tokens.titleWeight, 'title-tracking': `${tokens.titleTracking}em`, 'title-gap': px(tokens.titleGap),
    'section-size': px(tokens.section), 'section-leading': px(tokens.sectionLeading),
    'section-tracking': `${tokens.sectionTracking}em`, 'section-weight': tokens.sectionWeight,
    lede: px(tokens.lede ?? tokens.section), 'section-before': px(tokens.sectionBefore), 'section-after': px(tokens.sectionAfter),
  };
  for (const [name, value] of Object.entries(cssProperties)) preview.style.setProperty(`--${name}`, value);
  if (spread) {
    if (changedLayout) scroll.scrollTop = 0;
    measureSpread(panel, !changedLayout);
  } else {
    clearBoundarySpacers(preview);
    panel.rightStream.replaceChildren();
    panel.maxOffset = 0;
    if (changedLayout) scroll.scrollTop = 0;
  }
  for (const [field, { input, output }] of Object.entries(inputs)) {
    input.value = String(tokens[field]);
    if (field !== 'font') output.value = Number(tokens[field].toFixed(3)) + fields[field][4];
  }
  node.querySelector('.panel-theme').textContent = theme.label;
  for (const button of node.querySelectorAll('.seg button')) {
    button.setAttribute('aria-pressed', String(button.value === String(data[button.parentElement.dataset.seg])));
  }
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
  preview.querySelector('.story-intro').hidden = !sample.intro;
  preview.querySelector('.related-list').replaceChildren(...samples.map(item => {
    const row = document.createElement('div');
    row.className = 'related-item';
    const image = new Image();
    image.alt = '';
    image.src = item.hero || samples.find(other => other.hero).hero;
    const text = document.createElement('div');
    for (const [name, value] of [['kind', item.kind], ['title', item.title], ['date', '2026年11月26日']]) {
      const line = document.createElement('p');
      line.className = `related-${name}`;
      line.textContent = value;
      text.append(line);
    }
    row.append(image, text);
    return row;
  }));
  const hero = preview.querySelector('.story-hero');
  hero.hidden = !sample.hero;
  if (sample.hero) hero.querySelector('img').src = sample.hero;
  const body = preview.querySelector('.story-body');
  // These snapshots are shipped with the app and reduced to editorial markup.
  body.innerHTML = sample.body;
  for (const node of [...body.childNodes]) {
    if (node.nodeType !== Node.TEXT_NODE || !node.data.trim()) continue;
    const line = document.createElement('p');
    node.replaceWith(line);
    line.append(node);
  }
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
  preview.style.setProperty('--hero', sample.hero ? `url("${new URL(sample.hero, location.href)}")` : 'none');
  preview.querySelector('.toc').replaceChildren(...[...body.querySelectorAll(':scope > h2')].slice(0, 6).map(heading => {
    const item = document.createElement('li');
    item.textContent = heading.textContent;
    return item;
  }));
  const token = ++panel.articleToken;
  panel.maxOffset = 0;
  scroll.scrollTop = 0;

  const images = [...preview.querySelectorAll('img[src]')];
  Promise.allSettled(images.map(image => image.decode())).then(() => {
    if (panel.articleToken !== token || !preview.isConnected || !scroll.hasAttribute('data-spread')) return;
    measureSpread(panel, true);
  });
  if (scroll.hasAttribute('data-spread')) measureSpread(panel, false);
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
      else if (panel && panel.scroll.hasAttribute('data-spread')) measureSpread(panel, true);
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
  document.addEventListener('fullscreenchange', updateFullscreenButtons);
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
    if (event.key !== 'Escape') return;
    const panel = expandedPanel || document.fullscreenElement;
    if (panel?.matches('.panel')) {
      event.preventDefault();
      toggleFullscreen(panel).catch(() => message('全画面表示を終了できませんでした。'));
    } else if (!$('#editor').hidden) {
      event.preventDefault();
      setEditor(false);
    }
  });
  $('#sample').addEventListener('change', event => {
    state.sample = event.target.value;
    $('#original').href = currentSample().source;
    panels.forEach(panel => { renderArticle(panel); applyStyle(panel); });
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
    message('比較設定とメモをJSONに保存しました。');
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
