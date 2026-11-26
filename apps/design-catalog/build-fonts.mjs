// Google Fonts の CSS を取り、参照サイトの字幅に合わせた size-adjust 付きの fonts.css を作る。
//   node apps/design-catalog/build-fonts.mjs
// フォント本体は fonts.gstatic.com から読む（SIL OFL）。参照サイトのフォントは使わない。
// 補正値の根拠は docs/design-catalog/reproduction-guide.md。
import { writeFile } from 'node:fs/promises';

const agent = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' };
const latin = ['latin', 'latin-ext'];
const faces = [
  { query: 'Inter:opsz,wght@14..32,400..800', family: 'Cat Inter', adjust: 97, subsets: latin },
  { query: 'Noto+Sans+JP:wght@400..800', family: 'Cat Noto Tight', adjust: 88 },
  { query: 'Noto+Sans+JP:wght@400..800', family: 'Cat Noto', adjust: 100 },
  { query: 'Figtree:wght@400..800', family: 'Cat Figtree', adjust: 101, subsets: latin },
  { query: 'Lexend:wght@400..700', family: 'Cat Lexend', adjust: 95, subsets: latin },
  { query: 'Oxanium:wght@400..700', family: 'Cat Oxanium', adjust: 100, subsets: latin },
  { query: 'Inter+Tight:wght@400..800', family: 'Cat UI', adjust: 100, subsets: latin },
];

let css = '/* build-fonts.mjs で生成。手で編集しない。 */\n';
for (const { query, family, adjust, subsets } of faces) {
  const response = await fetch(`https://fonts.googleapis.com/css2?family=${query}&display=swap`, { headers: agent });
  if (!response.ok) throw new Error(`${query}: ${response.status}`);
  const text = await response.text();
  let count = 0;
  for (const [, label, body] of text.matchAll(/(?:\/\*\s*([^*]+?)\s*\*\/\s*)?@font-face\s*\{([^}]*)\}/g)) {
    if (subsets && !subsets.includes(label)) continue;
    const rule = body.replace(/font-family:[^;]+;/, `font-family:"${family}";`).replace(/\s+/g, ' ').trim();
    css += `@font-face{${rule}${adjust === 100 ? '' : `size-adjust:${adjust}%;`}}\n`;
    count += 1;
  }
  if (!count) throw new Error(`${family}: フォント定義が見つからない`);
  console.log(family, count);
}
await writeFile(new URL('./fonts.css', import.meta.url), css);
console.log(`fonts.css ${(css.length / 1024).toFixed(0)}KB`);
