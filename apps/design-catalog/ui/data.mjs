// Measured live on 2026-11-26 via Firecrawl (branding + viewport screenshots)
// across 6 Awwwards-recognized sites. See docs/design-catalog/awwwards-ui-general.md.

export const categories = [
  { id: 'all', label: 'すべて', en: 'All' },
  { id: 'surface', label: 'サーフェス・暗背景', en: 'Surface & Dark' },
  { id: 'controls', label: 'ピル操作・AI入力', en: 'Pill & Ambient' },
  { id: 'tasks', label: 'タスク・カードUI', en: 'Task & Warm Light' },
  { id: 'technical', label: 'モノスペース・リスト', en: 'Mono & Inverted' },
  { id: 'navigation', label: 'グリッド・ドック', en: 'Grid & Dock' },
  { id: 'editorial', label: '対比・インデックス', en: 'Editorial Index' },
];

export const patterns = [
  {
    id: 'factura-dark-surface',
    category: 'surface',
    title: 'Factura · Hairline Dark Architecture',
    siteName: 'Factura',
    award: 'Awwwards UI Design Nominee (Tubik PRO)',
    measuredAt: '2026-11-26',
    liveUrl: 'https://getfactura.app/',
    awwwardsUrl: 'https://www.awwwards.com/sites/factura',
    screenshot: './ui/media/factura.png',
    scheme: 'dark',
    fonts: ['Geist', 'system-ui', 'sans-serif'],
    metrics: { baseUnit: '4px', radius: '8px', shadow: 'none', contrast: '17.6:1' },
    palette: [
      { role: 'Canvas', hex: '#08090A' },
      { role: 'Recessed', hex: '#050607' },
      { role: 'Surface', hex: '#111214' },
      { role: 'Hairline', hex: '#303031' },
      { role: 'Ink', hex: '#F5F4FA' },
      { role: 'Accent', hex: '#BA5539' },
    ],
    naturalLanguage: {
      summary: 'ドロップシャドウを完全に捨て、黒の微細な明度差（#050607 / #08090A / #111214）と 1px の極細ボーダーだけで奥行きを作るダークダッシュボード設計。',
      whyItWorks: [
        '背景を純黒にせず #08090A に落とし、入力欄だけ #050607 へ一段沈めることで「押せる・書ける領域」が一瞬で伝わる。',
        '差し色はテラコッタ（#BA5539）の1色だけに絞り、プライマリCTA以外を無彩色で抑えている。',
        '背景にうっすら敷いた 48px の微細グリッドが、情報密度を保ちつつ建築的な秩序を与える。',
      ],
      whenToUse: '報告ダッシュボードの土台、KPI Bento カード、ステータス一覧、設定・比較パネル。',
      avoid: [
        '4px〜6px の太い色付き枠線をカード全体や左端にベタ塗りすること（一気に野暮ったくなる）。',
        'ダーク背景上で彩度の高いネオンカラーを複数同時に使うこと。',
      ],
    },
    css: `:root {
  --fx-canvas: #08090a;
  --fx-recessed: #050607;
  --fx-surface: #111214;
  --fx-surface-hover: #17191c;
  --fx-hairline: rgba(245, 244, 250, 0.09);
  --fx-hairline-strong: #303031;
  --fx-ink: #f5f4fa;
  --fx-muted: #9899a4;
  --fx-accent: #ba5539;
  --fx-radius: 8px;
  --fx-ease: cubic-bezier(0.16, 1, 0.3, 1);
}

.fx-bento {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  padding: 16px;
  border-radius: 14px;
  background:
    linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px) 0 0 / 32px 32px,
    linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px) 0 0 / 32px 32px,
    var(--fx-canvas);
  border: 1px solid var(--fx-hairline);
}

.fx-card {
  position: relative;
  padding: 16px 18px;
  border-radius: var(--fx-radius);
  background: var(--fx-surface);
  border: 1px solid var(--fx-hairline);
  transition: border-color 180ms var(--fx-ease), background-color 180ms var(--fx-ease);
}

.fx-card:hover {
  border-color: var(--fx-hairline-strong);
  background: var(--fx-surface-hover);
}

.fx-cta {
  padding: 9px 16px;
  border-radius: var(--fx-radius);
  background: var(--fx-accent);
  color: #fff;
  font-weight: 600;
  font-size: 13px;
}`,
    js: `// Pointer-tracked subtle radial highlight on hairline cards (respects reduced motion)
export function attachCardSpotlight(container) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const onMove = (event) => {
    const card = event.target.closest('.fx-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', \`\${event.clientX - rect.left}px\`);
    card.style.setProperty('--my', \`\${event.clientY - rect.top}px\`);
  };
  container.addEventListener('pointermove', onMove, { passive: true });
  return () => container.removeEventListener('pointermove', onMove);
}`,
  },
  {
    id: 'cheese-ai-pill-ambient',
    category: 'controls',
    title: 'Cheese AI · Ambient Glow & Pill Controls',
    siteName: 'Cheese AI',
    award: 'Awwwards Minimal & Clean Nominee',
    measuredAt: '2026-11-26',
    liveUrl: 'https://ai.cheesedesign.kr/',
    awwwardsUrl: 'https://www.awwwards.com/sites/cheese-ai',
    screenshot: './ui/media/cheese-ai.png',
    scheme: 'dark',
    fonts: ['Pretendard', '-apple-system', 'sans-serif'],
    metrics: { baseUnit: '12px', radius: '999px (pill) / 16px', shadow: 'none', contrast: '14.5:1' },
    palette: [
      { role: 'Canvas', hex: '#000000' },
      { role: 'Glow', hex: '#283A8A' },
      { role: 'Primary', hex: '#0071E3' },
      { role: 'Accent', hex: '#0A84FF' },
      { role: 'Ink', hex: '#D3D8E2' },
      { role: 'Muted', hex: '#A7AEBB' },
    ],
    naturalLanguage: {
      summary: '純黒キャンバスに低い位置から立ち上がる柔らかなアンビエント光と、999px の完全ピル型コマンド入力・チップを組み合わせた現代的 AI インターフェース。',
      whyItWorks: [
        '本文テキストを純白 #FFF にせず #D3D8E2 に抑えることで、長時間読んでも目が痛くならない。',
        '操作バー・入力欄・提案チップ・送信ボタンをすべて 999px ピルに統一し、視線を迷わせない。',
        'Pretendard のような CJK 親和性の高いゴシックは、日本語 UI へ移植しても字面バランスが崩れない。',
      ],
      whenToUse: 'AI 報告のフィルタバー、検索・絞り込みコマンド入力、クイック返信ビルダー。',
      avoid: [
        'ページ全面に強いグラデーションを敷いて文字の可読性（4.5:1）を落とすこと。',
        '角丸 4px のボタンと 999px のピルボタンを同じ操作列に無秩序に混ぜること。',
      ],
    },
    css: `:root {
  --ca-bg: #000000;
  --ca-ink: #d3d8e2;
  --ca-muted: #a7aebb;
  --ca-primary: #0071e3;
  --ca-accent: #0a84ff;
  --ca-pill-bg: rgba(255, 255, 255, 0.06);
  --ca-pill-border: rgba(255, 255, 255, 0.14);
}

.ca-stage {
  position: relative;
  overflow: hidden;
  padding: 28px 24px;
  border-radius: 16px;
  background:
    radial-gradient(85% 65% at 50% 105%, rgba(40, 58, 138, 0.55), transparent 72%),
    var(--ca-bg);
  color: var(--ca-ink);
}

.ca-command {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 6px 6px 18px;
  border-radius: 999px;
  background: var(--ca-pill-bg);
  border: 1px solid var(--ca-pill-border);
  backdrop-filter: blur(14px);
}

.ca-command:focus-within {
  border-color: var(--ca-accent);
  box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.22);
}

.ca-submit {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: var(--ca-primary);
  color: #fff;
}`,
    js: `// Quick-chip filter & instant prompt composer with keyboard Enter support
export function initCommandPill(root, onSelect) {
  const input = root.querySelector('input');
  root.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-chip]');
    if (!chip) return;
    input.value = chip.dataset.chip;
    input.focus();
    onSelect(chip.dataset.chip);
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && input.value.trim()) {
      onSelect(input.value.trim());
    }
  });
}`,
  },
  {
    id: 'tirus-warm-task-cards',
    category: 'tasks',
    title: 'Tirus · Warm Stone & Tactile Task UI',
    siteName: 'Tirus: Voice Notes & Tasks',
    award: 'Awwwards UI Design Nominee',
    measuredAt: '2026-11-26',
    liveUrl: 'https://tirus.app/',
    awwwardsUrl: 'https://www.awwwards.com/sites/tirus-voice-notes-tasks',
    screenshot: './ui/media/tirus.png',
    scheme: 'light',
    fonts: ['DM Sans', 'system-ui', 'sans-serif'],
    metrics: { baseUnit: '4px', radius: '16px (card) / 12px (btn)', shadow: 'none / subtle float', contrast: '16.8:1' },
    palette: [
      { role: 'Paper', hex: '#F8F6F0' },
      { role: 'Card', hex: '#FFFFFF' },
      { role: 'Ink', hex: '#161616' },
      { role: 'CTA', hex: '#111111' },
      { role: 'Lilac', hex: '#E8C8E5' },
      { role: 'Mint', hex: '#99FFE7' },
    ],
    naturalLanguage: {
      summary: '冷たい純白の代わりに温かみのある石色（#F8F6F0）を地に敷き、白カードと墨黒ボタン（#111111）＋淡いパステルメタタグで親しみやすさと高い判読性を両立するライトUI。',
      whyItWorks: [
        '画面全体を #F8F6F0 にすることで、純白（#FFFFFF）のフローティングヘッダーやタスクカードが影なしでも自然に浮かび上がる。',
        'タスクの完了・担当・期限を小さなパステルバッジで分類し、主要な行動ボタンだけを真っ黒（#111111）にしてメリハリを出している。',
        '角丸を 16px（カード）と 12px（ボタン）の入れ子比率（外側 = 内側 + padding/2）で揃えている。',
      ],
      whenToUse: 'ライトモード報告、「やったこと／まだやってないこと」チェックリスト、あずまへの確認カード。',
      avoid: [
        '白背景の上に白カードを置いて濃い黒ドロップシャドウで無理やり輪郭を出すこと。',
        '淡いパステル背景に白文字を乗せてコントラスト不足にすること（必ず濃い墨文字を乗せる）。',
      ],
    },
    css: `:root {
  --tr-paper: #f8f6f0;
  --tr-card: #ffffff;
  --tr-ink: #161616;
  --tr-muted: #5c5a54;
  --tr-line: rgba(22, 22, 22, 0.09);
  --tr-cta: #111111;
  --tr-lilac: #e8c8e5;
  --tr-mint: #99ffe7;
  --tr-rose: #fb6a91;
}

.tr-shell {
  padding: 20px;
  border-radius: 18px;
  background: var(--tr-paper);
  color: var(--tr-ink);
  border: 1px solid var(--tr-line);
}

.tr-card {
  display: grid;
  gap: 10px;
  padding: 16px;
  border-radius: 16px;
  background: var(--tr-card);
  border: 1px solid var(--tr-line);
}

.tr-btn {
  padding: 10px 16px;
  border-radius: 12px;
  background: var(--tr-cta);
  color: #ffffff;
  font-weight: 600;
  font-size: 13px;
}`,
    js: `// Stateful checklist that computes remaining count & builds a reply snippet
export function bindTaskList(root, onChange) {
  root.addEventListener('change', (event) => {
    if (!event.target.matches('input[type="checkbox"]')) return;
    const items = [...root.querySelectorAll('input[type="checkbox"]')];
    const done = items.filter((el) => el.checked).length;
    onChange({ done, total: items.length });
  });
}`,
  },
  {
    id: 'artemii-mono-inverted-list',
    category: 'technical',
    title: 'Artemii Lebedev · Mono Index & Inverted Row',
    siteName: 'Artemii Lebedev',
    award: 'Awwwards SOTD 7.27/10 (Nov 22, 2026)',
    measuredAt: '2026-11-26',
    liveUrl: 'https://artemiilebedev.com/',
    awwwardsUrl: 'https://www.awwwards.com/sites/artemii-lebedev-1',
    screenshot: './ui/media/artemii.png',
    scheme: 'dark',
    fonts: ['Fragment Mono', 'ui-monospace', 'monospace'],
    metrics: { baseUnit: '4px', radius: '0–2px', shadow: 'none', contrast: '16.9:1' },
    palette: [
      { role: 'Canvas', hex: '#0A0A0A' },
      { role: 'Paper Box', hex: '#FFFFFF' },
      { role: 'Ink', hex: '#EBEBEB' },
      { role: 'Muted', hex: '#8A8A8A' },
      { role: 'Signal', hex: '#0082F3' },
    ],
    naturalLanguage: {
      summary: '角丸 0–2px・等幅フォント（Fragment Mono）・選択行の白黒完全反転ハイライトで、ログ・一覧・検証結果を極限までシャープに整理する技術系スイスUI。',
      whyItWorks: [
        'ホバー／選択行だけを黒地→白地（文字も白→黒）に瞬時に反転させるため、矢印やアイコン無しでも現在位置が強烈に明確。',
        '左に項目名、中央に種別、右端に `tabular-nums` の年/件数/ステータスを揃えることで、1画面に大量の情報を詰めても走査速度が落ちない。',
        '左上の高コントラスト情報ボックス（例：件数バッジ `7 ONGOING PROJECTS`）が全体のアンカーになる。',
      ],
      whenToUse: '検証ログ・実行コマンド一覧、変更ファイルリスト、テスト結果テーブル、バージョン比較。',
      avoid: [
        '長文の日本語説明まで全部等幅フォントにすること（見出し・メタ・表の数値だけモノスペース、説明文はゴシックに分ける）。',
      ],
    },
    css: `.al-list {
  display: grid;
  background: #0a0a0a;
  color: #ebebeb;
  font-family: "Fragment Mono", ui-monospace, Menlo, Consolas, monospace;
  font-size: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.al-row {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 9px 12px;
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  font-variant-numeric: tabular-nums;
}

.al-row:first-child { border-top: 0; }

.al-row:hover,
.al-row[aria-selected="true"] {
  background: #ffffff;
  color: #0a0a0a;
}`,
    js: `// Keyboard-navigable inverted list (ArrowUp / ArrowDown / Click)
export function initInvertedList(listEl, onSelect) {
  const rows = () => [...listEl.querySelectorAll('.al-row')];
  const activate = (row) => {
    for (const item of rows()) item.setAttribute('aria-selected', String(item === row));
    onSelect?.(row.dataset.id, row);
  };
  listEl.addEventListener('click', (e) => {
    const row = e.target.closest('.al-row');
    if (row) activate(row);
  });
  listEl.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const all = rows();
    const cur = Math.max(0, all.findIndex((r) => r.getAttribute('aria-selected') === 'true'));
    const next = all[(cur + (e.key === 'ArrowDown' ? 1 : -1) + all.length) % all.length];
    activate(next);
    next.focus();
  });
}`,
  },
  {
    id: 'studio-loum-grid-dock',
    category: 'navigation',
    title: 'Studio Loum · Hairline Grid & Floating Dock',
    siteName: 'Studio Loum',
    award: 'Awwwards UI Design & Minimal Nominee',
    measuredAt: '2026-11-26',
    liveUrl: 'https://www.studioloum.com/',
    awwwardsUrl: 'https://www.awwwards.com/sites/studio-loum',
    screenshot: './ui/media/studio-loum.png',
    scheme: 'light',
    fonts: ['Special Gothic', 'Inter', 'sans-serif'],
    metrics: { baseUnit: '4px', radius: '0px (grid) / 14px (dock)', shadow: '0 8px 28px rgba(0,0,0,.08)', contrast: '19.5:1' },
    palette: [
      { role: 'Canvas', hex: '#FFFFFF' },
      { role: 'Grid Line', hex: '#EDEDED' },
      { role: 'Crosshair', hex: '#BDBDBD' },
      { role: 'Ink', hex: '#0A0A0A' },
      { role: 'Muted', hex: '#767676' },
    ],
    naturalLanguage: {
      summary: '純白キャンバスを極細の 1px 格子と `+` 交差点マーカーで区切り、ナビゲーションは画面下部の半透明フローティングドック 1 本に集約する建築的ミニマルUI。',
      whyItWorks: [
        'ヘッダーを重くせず、操作系のすべてを下部のコンパクトなフローティングドック（`01 INDEX · 02 ABOUT · 03 CONTACT`）に集めることで、本文と作品が主役になる。',
        '各セルの上端に極小の番号コード（`N°553` 等）を添えるだけで、一覧全体がギャラリー／台帳のような高級感を持つ。',
        'ドック右端に現在時刻や状態メタを 1 個だけ置くと、静的なページに「生きているツール感」が生まれる。',
      ],
      whenToUse: 'セクション切り替えドック、デザインカタログ、複数タブの報告ビューアー、メディア一覧。',
      avoid: [
        'フローティングドックの項目を 6 個以上詰め込むこと（最大 4〜5 項目＋メタ 1 個まで）。',
      ],
    },
    css: `.sl-canvas {
  position: relative;
  padding: 20px 20px 76px;
  border-radius: 14px;
  background:
    linear-gradient(#ededed 1px, transparent 1px) 0 0 / 120px 120px,
    linear-gradient(90deg, #ededed 1px, transparent 1px) 0 0 / 120px 120px,
    #ffffff;
  color: #0a0a0a;
  border: 1px solid #e5e5e5;
}

.sl-dock {
  position: sticky;
  bottom: 14px;
  margin: 20px auto 0;
  width: max-content;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(10, 10, 10, 0.08);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.sl-dock button {
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.sl-dock button[aria-pressed="true"] {
  background: #0a0a0a;
  color: #ffffff;
}`,
    js: `// Floating dock switcher with live HH:MM clock readout
export function initFloatingDock(dock, clockEl, onSwitch) {
  const tick = () => {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };
  tick();
  const id = setInterval(tick, 30_000);
  dock.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-tab]');
    if (!btn) return;
    for (const b of dock.querySelectorAll('button[data-tab]')) {
      b.setAttribute('aria-pressed', String(b === btn));
    }
    onSwitch?.(btn.dataset.tab);
  });
  return () => clearInterval(id);
}`,
  },
  {
    id: 'crl-editorial-index',
    category: 'editorial',
    title: 'Creative Reference Library · Scale & (1) Notation',
    siteName: 'Creative Reference Library',
    award: 'Awwwards SOTD 7.44/10 (Nov 10, 2026)',
    measuredAt: '2026-11-26',
    liveUrl: 'https://crl-2026.webflow.io/',
    awwwardsUrl: 'https://www.awwwards.com/sites/creative-reference-library',
    screenshot: './ui/media/crl.png',
    scheme: 'light',
    fonts: ['Neue Haas Grotesk Text Pro', 'Inter', 'sans-serif'],
    metrics: { baseUnit: '4px', radius: '0px', shadow: 'none', contrast: '7.1:1' },
    palette: [
      { role: 'Stone', hex: '#A1A098' },
      { role: 'Paper', hex: '#F3F2EE' },
      { role: 'Ink', hex: '#111111' },
      { role: 'White', hex: '#FFFFFF' },
      { role: 'Signal', hex: '#0082F3' },
    ],
    naturalLanguage: {
      summary: '巨大なバージョン・タイトル表記と、`(1)` `(2)` の番号付きインデント本文を大胆に対比させるエディトリアル・インデックス記法。',
      whyItWorks: [
        '段落の先頭に `(1)` や `01 /` などの番号を左列へ独立配置することで、絵文字や箇条書きの丸ポチ（•）無しでも構造が一目でわかる。',
        '見出しサイズとメタ情報サイズの比率を 3〜5 倍に振り切ると、装飾が一切なくても強い画面の格が生まれる。',
        '暖色寄りのニュートラルグレー（#A1A098 / #F3F2EE）は、彩度ゼロの無機質な灰色より編集物らしい品が出る。',
      ],
      whenToUse: '報告書のエグゼクティブサマリー、設計判断の根拠リスト、番号付き確認事項（Q1/Q2）。',
      avoid: [
        'モバイル幅（390px）で巨大なディスプレイ文字を固定 px のままにして横はみ出しさせること（必ず `clamp()` を使う）。',
      ],
    },
    css: `.crl-entry {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 12px;
  padding: 16px 0;
  border-top: 1px solid rgba(17, 17, 17, 0.14);
}

.crl-num {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  opacity: 0.65;
}

.crl-hero {
  font-size: clamp(28px, 4.5vw, 52px);
  font-weight: 700;
  line-height: 1.04;
  letter-spacing: -0.03em;
}`,
    js: `// Copyable numbered citation block with subtle status feedback
export async function copyCitation(text, button) {
  await navigator.clipboard.writeText(text);
  const prev = button.textContent;
  button.textContent = 'コピー済み';
  setTimeout(() => { button.textContent = prev; }, 1600);
}`,
  },
];

// Unified design-token synthesis exported for Generative UI reports
export const synthesizedReportTokens = {
  name: 'Awwwards Synthesized Report UI',
  derivedFrom: ['Factura', 'Cheese AI', 'Tirus', 'Artemii Lebedev', 'Studio Loum', 'Creative Reference Library'],
  measuredAt: '2026-11-26',
  dark: {
    canvas: '#08090a',
    surface: '#111215',
    surfaceElevated: '#17191e',
    recessed: '#050607',
    hairline: 'rgba(245, 244, 250, 0.09)',
    hairlineStrong: 'rgba(245, 244, 250, 0.18)',
    ink: '#f2f3f7',
    muted: '#9499a8',
    accent: '#4f8cff',
    accentWarm: '#ba5539',
    success: '#3dd68c',
    warning: '#f0b84f',
    danger: '#ff6b6b',
  },
  light: {
    canvas: '#f8f6f0',
    surface: '#ffffff',
    surfaceElevated: '#fdfcf9',
    recessed: '#efece4',
    hairline: 'rgba(22, 22, 22, 0.09)',
    hairlineStrong: 'rgba(22, 22, 22, 0.18)',
    ink: '#161616',
    muted: '#5f5c55',
    accent: '#0071e3',
    accentWarm: '#ba5539',
    success: '#0f8a5f',
    warning: '#a16207',
    danger: '#c8322b',
  },
  typography: {
    sans: '"Inter", "Noto Sans JP", "Segoe UI", system-ui, sans-serif',
    mono: '"Fragment Mono", "JetBrains Mono", ui-monospace, Consolas, monospace',
    tabular: true,
  },
  motion: {
    ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
    fast: '160ms',
    normal: '240ms',
  },
};
