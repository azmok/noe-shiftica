// DevTools の Console で、本物と自作の両方のページに実行し、返った行を見比べる。
// 画面上の文章を一時的に差し替えるだけ（再読み込みで元に戻る）。
// 使い方: await lineCheck({ title: 'h1', body: 'article p' }, { title: '…', body: '…' })
globalThis.lineCheck = async (selectors, texts) => {
  const out = {};
  for (const [role, selector] of Object.entries(selectors)) {
    const element = document.querySelector(selector);
    if (!element) { out[role] = null; continue; }
    element.textContent = texts[role];
    await new Promise((resolve) => setTimeout(resolve, 1500)); // 字形の追加読み込みを待つ
    await document.fonts.ready;
    const node = element.firstChild;
    const range = document.createRange();
    const lines = [];
    let top = null;
    let line = '';
    for (let i = 0; i < node.length; i += 1) {
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const rects = range.getClientRects();
      const y = rects[rects.length - 1]?.top ?? top;
      if (top !== null && y - top > 8) { lines.push(line); line = ''; }
      top = y;
      line += node.data[i];
    }
    out[role] = [...lines, line];
  }
  return out;
};
