import { categories, patterns, synthesizedReportTokens } from './ui/data.mjs';

const $ = (selector) => document.querySelector(selector);
const storageKey = 'noe-design-catalog-ui-v1';

const state = {
  category: 'all',
  query: '',
  appearance: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
};

try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
  if (categories.some((c) => c.id === saved.category)) state.category = saved.category;
  if (saved.appearance === 'dark' || saved.appearance === 'light') state.appearance = saved.appearance;
} catch { /* defaults */ }

const setStatus = (msg) => {
  $('#status').textContent = msg;
};

async function copyText(text, label) {
  try {
    await navigator.clipboard.writeText(text);
    setStatus(`${label}をコピーしました。`);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.cssText = 'position:fixed;opacity:0';
    document.body.append(area);
    area.select();
    document.execCommand('copy');
    area.remove();
    setStatus(`${label}をコピーしました。`);
  }
}

function applyAppearance() {
  document.documentElement.dataset.appearance = state.appearance;
  for (const input of document.querySelectorAll('[name="appearance"]')) {
    input.checked = input.value === state.appearance;
  }
}

function saveState() {
  try { localStorage.setItem(storageKey, JSON.stringify({ category: state.category, appearance: state.appearance })); } catch { /* ignore */ }
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') node.className = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value !== null && value !== undefined) node.setAttribute(key, String(value));
  }
  for (const child of children) {
    if (child === null || child === undefined) continue;
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

function buildLiveDemo(pattern) {
  if (pattern.id === 'factura-dark-surface') {
    let mode = 'all';
    const note = el('span', {}, '状態: すべて表示（1pxヘアライン + 0 shadow）');
    const toggleBtn = el('button', {
      type: 'button',
      className: 'demo-fx-cta',
      onClick: () => {
        mode = mode === 'all' ? 'action' : 'all';
        note.textContent = mode === 'all' ? '状態: すべて表示（1pxヘアライン + 0 shadow）' : '状態: 確認待ちのみ強調（差し色 #BA5539）';
      },
    }, '表示を切替');
    return el('div', { className: 'demo-fx' },
      el('div', { className: 'demo-fx-grid' },
        el('div', { className: 'demo-fx-card' }, el('small', {}, 'DONE'), el('strong', {}, '06')),
        el('div', { className: 'demo-fx-card' }, el('small', {}, 'OPEN'), el('strong', {}, '01')),
        el('div', { className: 'demo-fx-card' }, el('small', {}, 'REVIEW'), el('strong', { style: 'color:#ba5539' }, '02')),
      ),
      el('div', { className: 'demo-fx-bar' }, note, toggleBtn),
    );
  }

  if (pattern.id === 'cheese-ai-pill-ambient') {
    const out = el('div', { className: 'demo-ca-out' }, 'チップを選ぶか入力して Enter で反映');
    const input = el('input', { type: 'text', placeholder: '例: 確認事項だけ表示して' });
    const run = () => {
      const val = input.value.trim();
      out.textContent = val ? `▶ フィルタ適用: 「${val}」` : '入力が空です（チップを押すと自動入力）';
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
    const chips = ['確認事項のみ', '検証ログを展開', '変更ファイル一覧'].map((label) =>
      el('button', { type: 'button', onClick: () => { input.value = label; run(); } }, label),
    );
    return el('div', { className: 'demo-ca' },
      el('div', { className: 'demo-ca-pill' }, input, el('button', { type: 'button', 'aria-label': '適用', onClick: run }, '↑')),
      el('div', { className: 'demo-ca-chips' }, ...chips),
      out,
    );
  }

  if (pattern.id === 'tirus-warm-task-cards') {
    const badge = el('span', { className: 'demo-tr-badge' }, '1 / 3 完了');
    const items = [
      { label: 'Awwwards 6サイトからトークン抽出', tag: 'Done', checked: true },
      { label: 'UI全般カタログにスクショ＋CSS追加', tag: 'Review', checked: false },
      { label: 'OpenUI 報告テンプレートを適用', tag: 'Next', checked: false },
    ];
    const boxes = [];
    const update = () => {
      const done = boxes.filter((b) => b.checked).length;
      badge.textContent = `${done} / ${boxes.length} 完了`;
    };
    const rows = items.map((item) => {
      const cb = el('input', { type: 'checkbox', onChange: update });
      cb.checked = item.checked;
      boxes.push(cb);
      return el('div', { className: 'demo-tr-item' },
        el('label', {}, cb, el('span', {}, item.label)),
        el('span', { className: 'demo-tr-tag' }, item.tag),
      );
    });
    return el('div', { className: 'demo-tr' },
      el('div', { className: 'demo-tr-top' }, el('span', {}, 'TODAY TASKS'), badge),
      ...rows,
    );
  }

  if (pattern.id === 'artemii-mono-inverted-list') {
    const data = [
      ['REPORT-RUNTIME.JS', 'OPENUI BUNDLE', 'PASS'],
      ['DESIGN-CATALOG/UI', 'AWWWARDS 06', 'READY'],
      ['UTF-8 / NO-NUL', 'PRE-CHECK', 'OK'],
      ['AGENTS.MD §6', 'REPORT RULE', 'SYNC'],
    ];
    const rowNodes = [];
    const select = (idx) => {
      rowNodes.forEach((n, i) => n.setAttribute('aria-selected', String(i === idx)));
    };
    data.forEach(([name, kind, status], idx) => {
      const row = el('button', {
        type: 'button',
        className: 'demo-al-row',
        'aria-selected': String(idx === 0),
        onClick: () => select(idx),
      }, el('span', {}, name), el('span', {}, kind), el('span', {}, status));
      rowNodes.push(row);
    });
    return el('div', { className: 'demo-al' },
      el('div', { className: 'demo-al-head' }, el('span', {}, 'VERIFICATION LOG'), el('span', {}, '04 ITEMS')),
      ...rowNodes,
    );
  }

  if (pattern.id === 'studio-loum-grid-dock') {
    const tabs = [
      ['01 SUMMARY', '結論: 3件完了・確認1件。報告を Generative UI 化しました。'],
      ['02 DIFF', '変更: design-catalog (UI全般) + report-ui ランタイム。'],
      ['03 QA', '検証: typecheck / build / HTTP 200 / UTF-8 全通過。'],
    ];
    const view = el('div', { className: 'demo-sl-view' }, tabs[0][1]);
    const btns = tabs.map(([label, content], idx) =>
      el('button', {
        type: 'button',
        'aria-pressed': String(idx === 0),
        onClick: (e) => {
          btns.forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget)));
          view.textContent = content;
        },
      }, label),
    );
    const now = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    return el('div', { className: 'demo-sl' },
      view,
      el('div', { className: 'demo-sl-dock' }, ...btns, el('span', { className: 'demo-sl-clock' }, `JP ${now}`)),
    );
  }

  return el('div', { className: 'demo-crl' },
    el('p', { className: 'demo-crl-title' }, 'REPORT /V.02'),
    el('div', { className: 'demo-crl-row' }, el('code', {}, '(1)'), el('span', {}, '番号を左列に独立配置することで、絵文字無しでも視線が一瞬で整理される。')),
    el('div', { className: 'demo-crl-row' }, el('code', {}, '(2)'), el('span', {}, '大見出しと極小メタのコントラストだけで、余計な装飾を削ぎ落とす。')),
  );
}

function buildPatternCard(pattern) {
  const cat = categories.find((c) => c.id === pattern.category);
  const tabDefs = [
    ['demo', 'ライブ見本'],
    ['shot', 'スクショ & 色'],
    ['notes', '自然言語'],
    ['css', 'CSS'],
    ['js', 'JS'],
  ];

  const panes = new Map();

  // 1. Live demo
  panes.set('demo', el('div', { className: 'ui-pane' }, buildLiveDemo(pattern)));

  // 2. Screenshot + palette
  const swatches = pattern.palette.map((item) =>
    el('button', {
      type: 'button',
      className: 'ui-swatch',
      onClick: () => copyText(item.hex, `${pattern.siteName} ${item.role} (${item.hex})`),
    },
      el('span', { className: 'ui-swatch-dot', style: `background:${item.hex}` }),
      el('small', {}, item.role),
      el('code', {}, item.hex),
    ),
  );
  panes.set('shot', el('div', { className: 'ui-pane', hidden: '' },
    el('div', { className: 'ui-shot-wrap' },
      el('img', { src: pattern.screenshot, alt: `${pattern.siteName} の実サイトスクリーンショット`, loading: 'lazy' }),
    ),
    el('div', { className: 'ui-swatches' }, ...swatches),
    el('div', { className: 'ui-metrics' },
      el('span', {}, `Font: ${pattern.fonts[0]}`),
      el('span', {}, `Unit: ${pattern.metrics.baseUnit}`),
      el('span', {}, `Radius: ${pattern.metrics.radius}`),
      el('span', {}, `Shadow: ${pattern.metrics.shadow}`),
    ),
  ));

  // 3. Natural language
  panes.set('notes', el('div', { className: 'ui-pane', hidden: '' },
    el('div', { className: 'ui-notes' },
      el('p', {}, pattern.naturalLanguage.summary),
      el('div', {},
        el('h4', {}, 'なぜ効いているか（抽出ポイント）'),
        el('ul', {}, ...pattern.naturalLanguage.whyItWorks.map((item) => el('li', {}, item))),
      ),
      el('div', {},
        el('h4', {}, '使い所'),
        el('p', {}, pattern.naturalLanguage.whenToUse),
      ),
      el('div', { className: 'ui-avoid' },
        el('h4', {}, '避けるべきアンチパターン'),
        el('ul', {}, ...pattern.naturalLanguage.avoid.map((item) => el('li', {}, item))),
      ),
    ),
  ));

  // 4. CSS
  panes.set('css', el('div', { className: 'ui-pane', hidden: '' },
    el('div', { className: 'ui-code-head' },
      el('span', {}, '抽出トークン & コンポーネント CSS'),
      el('button', { type: 'button', className: 'ui-copy-btn', onClick: () => copyText(pattern.css, `${pattern.siteName} CSS`) }, 'CSSをコピー'),
    ),
    el('pre', { className: 'ui-pre' }, pattern.css),
  ));

  // 5. JS
  panes.set('js', el('div', { className: 'ui-pane', hidden: '' },
    el('div', { className: 'ui-code-head' },
      el('span', {}, 'マイクロインタラクション JS'),
      el('button', { type: 'button', className: 'ui-copy-btn', onClick: () => copyText(pattern.js, `${pattern.siteName} JS`) }, 'JSをコピー'),
    ),
    el('pre', { className: 'ui-pre' }, pattern.js),
  ));

  const tabButtons = tabDefs.map(([id, label], idx) =>
    el('button', {
      type: 'button',
      role: 'tab',
      'aria-selected': String(idx === 0),
      onClick: () => {
        tabButtons.forEach((b, i) => b.setAttribute('aria-selected', String(i === idx)));
        for (const [paneId, paneEl] of panes.entries()) {
          paneEl.hidden = paneId !== id;
        }
      },
    }, label),
  );

  return el('article', { className: 'ui-card' },
    el('header', { className: 'ui-card-head' },
      el('div', {},
        el('div', { className: 'ui-card-meta' },
          el('span', { className: 'ui-cat-tag' }, cat ? cat.label : pattern.category),
          el('span', {}, pattern.scheme === 'dark' ? 'DARK' : 'LIGHT'),
          el('span', {}, pattern.measuredAt),
        ),
        el('h3', {}, pattern.title),
        el('p', { className: 'ui-award' }, pattern.award),
      ),
      el('div', { className: 'ui-links' },
        el('a', { href: pattern.liveUrl, target: '_blank', rel: 'noopener noreferrer' }, '実サイト'),
        el('a', { href: pattern.awwwardsUrl, target: '_blank', rel: 'noopener noreferrer' }, 'Awwwards'),
      ),
    ),
    el('div', { className: 'ui-tabs', role: 'tablist', 'aria-label': `${pattern.siteName} の抽出ビュー` }, ...tabButtons),
    ...panes.values(),
  );
}

function buildSynthesizedCss() {
  const { dark, light, typography, motion } = synthesizedReportTokens;
  const toVars = (obj) => Object.entries(obj).map(([k, v]) => `  --rep-${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}: ${v};`).join('\n');
  return `/* Synthesized from Noe Shiftica UI Catalog (Awwwards 6 references) */
:root {
  --rep-font-sans: ${typography.sans};
  --rep-font-mono: ${typography.mono};
  --rep-ease: ${motion.ease};
${toVars(dark)}
}
:root[data-theme="light"] {
${toVars(light)}
}
`;
}

function render() {
  applyAppearance();
  const q = state.query.trim().toLowerCase();
  const filtered = patterns.filter((p) => {
    if (state.category !== 'all' && p.category !== state.category) return false;
    if (!q) return true;
    const hay = [
      p.title, p.siteName, p.award, p.category, p.scheme,
      ...p.fonts, p.naturalLanguage.summary, p.naturalLanguage.whenToUse,
    ].join(' ').toLowerCase();
    return hay.includes(q);
  });

  const activeCat = categories.find((c) => c.id === state.category);
  $('#heading').textContent = state.category === 'all' ? 'すべての UI パターン' : `${activeCat.label}（${activeCat.en}）`;
  $('#count-pill').textContent = `${filtered.length} / ${patterns.length} パターン`;

  for (const btn of document.querySelectorAll('#cat-list button')) {
    btn.setAttribute('aria-pressed', String(btn.value === state.category));
  }

  const grid = $('#cards');
  if (filtered.length === 0) {
    grid.replaceChildren(el('p', { className: 'status' }, '一致するパターンがありません。キーワードかカテゴリを変えてみてください。'));
  } else {
    grid.replaceChildren(...filtered.map(buildPatternCard));
  }
}

function init() {
  const list = $('#cat-list');
  for (const cat of categories) {
    const count = cat.id === 'all' ? patterns.length : patterns.filter((p) => p.category === cat.id).length;
    const btn = el('button', {
      type: 'button',
      value: cat.id,
      onClick: () => {
        state.category = cat.id;
        saveState();
        render();
      },
    }, cat.label, el('small', {}, String(count)));
    list.append(btn);
  }

  $('#search').addEventListener('input', (e) => {
    state.query = e.target.value;
    render();
  });

  for (const input of document.querySelectorAll('[name="appearance"]')) {
    input.addEventListener('change', () => {
      state.appearance = input.value;
      saveState();
      applyAppearance();
    });
  }

  $('#copy-tokens').addEventListener('click', () => copyText(buildSynthesizedCss(), '統合デザイントークン CSS'));

  $('#export-tokens').addEventListener('click', () => {
    const payload = { synthesizedReportTokens, patterns };
    const blob = new Blob([JSON.stringify(payload, null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'noe-ui-general-catalog.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('UI全般カタログのトークンJSONを保存しました。');
  });

  render();
}

init();
