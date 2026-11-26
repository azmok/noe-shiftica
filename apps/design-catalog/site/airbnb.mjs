import * as c from './content.mjs';
import { arrowLess as button, contact, each, esc, link, out, sample, wrapTables } from './kit.mjs';

const teaser = (post, cls = '') => `<a class="teaser ${cls}" href="${link('article')}"><span class="frame"><img src="${post.image}" alt="" loading="lazy"></span><span class="teaser-text"><b>${esc(post.title)}</b><small>${esc(post.group)}</small></span></a>`;
const work = ([name, kind, note, image, href], cls = '') => `<a class="work ${cls}" href="${href}" ${out}><span class="frame"><img src="${image}" alt="${esc(name)}"></span><b>${esc(name)}</b><small>${esc(kind)}</small><span class="work-note">${esc(note)}</span></a>`;
const cta = () => `<section class="wrap cta" data-in><h2>Ready to Shift?</h2><p class="deck">まず話しましょう。相談は無料。押し売りなし。</p>${button('無料相談を予約する', contact)}</section>`;
const head = (title, deck) => `<header class="wrap page-head"><h1>${title}</h1><p class="deck">${deck}</p></header>`;

function top() {
  return `<section class="wrap hero"><div class="hero-text"><h1 class="wordline">Design<br>the Shift.</h1><p class="deck">本質を設計する。世界観を転換する。</p><p>AIと最新技術で、Webサイトとデジタル体験を設計する。テンプレートではなく、あなただけの世界観を。最短1週間、15万円〜。</p><div class="actions">${button('無料相談を予約する', contact)}${button('実績を見る', link('works'), 'secondary')}</div><p class="small">返信は24時間以内・相談無料・押し売りなし</p></div><div class="hero-art frame"><canvas aria-hidden="true"></canvas></div></section>
  <section class="wrap" data-in><div class="rule"><h2 class="label">最新の記事</h2><div class="grid four">${each(c.posts.slice(0, 4), (p) => teaser(p))}</div></div></section>
  <section class="wrap" data-in><h2>制作コストを削減して、<br>その分を「質」に全振りする。</h2><p class="deck narrow">Noe Shifticaは、AIワークフローで制作の非効率を削ぎ落とし、本来なら50万〜数百万円かかるレベルのデザイン体験を、15万円〜で提供します。</p><div class="grid three text-grid">${each(c.pillars, ([t, d]) => `<div><h3>${t}</h3><p>${d}</p></div>`)}</div></section>
  <section class="wrap" data-in><div class="row-head"><h2>Works</h2><a href="${link('works')}">すべて見る</a></div><div class="grid two">${each(c.works, (w) => work(w))}</div></section>
  <section class="wrap split" data-in><div><h2>最短1週間で公開まで。</h2><p class="deck">迷いを潰す5ステップ。</p></div><ol class="steps">${each(c.steps, ([t, d], i) => `<li><span>${i + 1}</span><div><h3>${t}</h3><p>${d}</p></div></li>`)}</ol></section>
  <section class="wrap" id="pricing" data-in><h2>明確な価格。隠れた費用なし。</h2><p class="deck narrow">必要な費用は、何のために・誰に・いくらかかるかを必ず事前に説明します。</p><div class="grid three">${each(c.plans, ([n, p, d, t]) => `<div class="plan"><h3>${n}</h3><p class="price">${p}</p><p>${d}</p><p class="small">${t}</p>${button('相談する', contact, 'secondary')}</div>`)}</div></section>
  <section class="wrap split" data-in><h2>よくあるご質問</h2><div>${each(c.faq, ([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`)}</div></section>${cta()}`;
}
function services() {
  return `${head('What We Do.', 'Noe Shifticaが提供する3つのこと')}
  <section class="wrap list" data-in>${each(c.services, ([t, d, href]) => `<div class="list-row"><h2>${t}</h2><div><p>${d}</p>${href ? `<a href="${href}" ${out}>事例詳細を見る</a>` : ''}</div></div>`)}</section>
  <section class="wrap" data-in><h2>こんな方へ</h2><div class="grid three">${each(['テンプレートに飽きた方', '制作費が不透明で不安な方', '公開後も育てたいサイトを持ちたい方'], (t) => `<div class="card"><h3>${t}</h3></div>`)}</div></section>
  <section class="wrap split" data-in><div><h2>制作の流れ</h2><p class="deck">発注から納品まで、全ステップを明示します。</p></div><ol class="steps">${each(c.flow, ([t, d], i) => `<li><span>${i + 1}</span><div><h3>${t}</h3><p>${d}</p></div></li>`)}</ol></section>${cta()}`;
}
function works() {
  return `${head('Works', '公開中の制作実績')}<section class="wrap" data-in>${work(c.works[0], 'wide')}</section><section class="wrap" data-in><div class="grid two offset">${work(c.works[1])}<div class="slot"><h3>次の作品の場所</h3><p>3件目は、今のサイトでも準備中です。</p>${button('相談する', contact, 'secondary')}</div></div></section>${cta()}`;
}
function about() {
  return `${head('About Noe Shiftica.', '本質を設計する、AI×デザインスタジオ。')}
  <section class="wrap" data-in><blockquote>デザインとは表面を整えることではない。<br>ブランドの核心を見抜き（Noe）、<br>それを美しい形に転換する（Shiftica）こと。</blockquote></section>
  <article class="rail">${each(c.about, ([t, ps]) => `<section data-in><h2>${t}</h2>${each(ps, (p) => `<p>${p}</p>`)}</section>`)}</article>
  <section class="wrap" data-in><div class="grid two promise"><div class="card"><h3>やらないこと</h3><ul>${each(c.donts, (t) => `<li>${t}</li>`)}</ul></div><div class="card strong"><h3>やること</h3><ul>${each(c.dos, (t) => `<li>${t}</li>`)}</ul></div></div></section>
  <section class="wrap profile" data-in><span class="frame"><img src="./media/azuma.png" alt="あずま"></span><div><h2>Design the Shift with Me!</h2><p class="deck">東京・渋谷を拠点に、フルリモートで全国対応。</p><p>こんにちは、あずまです！AIという最強の武器と、認知科学に基づいたデザインで、あなたのビジネスの本質を形にします。一人で運営しているからこそ、あなたの想いに200%コミットできる。難しいことは全部お任せください！一緒に、世界を驚かせるシフトを起こしましょう！</p></div></section>
  <section class="rail" data-in><h2>会社概要</h2><dl>${each(c.company, ([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl></section>${cta()}`;
}
function blog() {
  const [first, ...rest] = c.posts;
  const groups = ['すべて', ...new Set(c.posts.map((p) => p.group))];
  return `<section class="wrap feature"><div><small>${first.group}</small><h1>${esc(first.title)}</h1>${button('記事を読む', link('article'))}</div><a class="frame" href="${link('article')}" aria-label="記事を読む"><img src="${first.image}" alt=""></a></section>
  <section class="wrap" data-in><div class="rule"><h2 class="label">新着</h2><div class="grid four">${each(rest.slice(0, 4), (p) => teaser(p))}</div></div></section>
  <section class="wrap" data-in><h2>すべての記事</h2><div class="chips" role="group" aria-label="分類">${each(groups, (g, i) => `<button type="button" value="${g}" aria-pressed="${i === 0}">${g}</button>`)}</div><div class="grid four" id="posts">${each(c.posts, (p) => teaser(p, 'compact'))}</div></section>`;
}
function article() {
  return '<article class="rail post" id="post"></article>';
}

async function fill() {
  const { post, src, body } = await sample();
  document.querySelector('#post').innerHTML = `<h1>${esc(post.title)}</h1><p class="meta">投稿： Noe Shiftica · <u>制作</u></p>${post.intro ? `<p class="deck">${esc(post.intro)}</p>` : ''}<span class="frame wide"><img src="${src(post.hero)}" alt=""></span><div class="prose">${body}</div>`;
  document.querySelector('main').insertAdjacentHTML('beforeend', `<section class="wrap"><h2>ほかの記事</h2><div class="grid three">${each(c.posts.slice(1, 4), (p) => teaser(p))}</div></section>`);
  wrapTables('.prose');
}

const shell = (page, main) => `<header class="bar"><a class="logo" href="${link('top')}">Noe Shiftica</a><nav aria-label="メイン">${each(c.nav, ([id, label]) => `<a href="${link(id)}" ${id === page || (page === 'article' && id === 'blog') ? 'aria-current="page"' : ''}>${label}</a>`)}<a class="btn primary" href="${contact}" ${out}>Contact</a></nav><button class="menu" type="button" aria-expanded="false" aria-label="メニュー"><i></i><i></i></button></header><main>${main}</main>
<footer><div class="wrap foot"><div><b class="logo">Noe Shiftica</b><p>最新技術と本質の追求で、ビジネスの世界観を転換します。</p></div><div><h4>ページ</h4>${each(c.nav, ([id, label]) => `<a href="${link(id)}">${label}</a>`)}</div><div><h4>規約</h4>${each(c.legal, ([p, l]) => `<a href="${c.live}/${p}" ${out}>${l}</a>`)}</div><div><h4>つながる</h4>${each(c.social, ([l, h]) => `<a href="${h}" ${out}>${l}</a>`)}</div></div></footer>`;

export default { pages: { top, services, works, about, blog, article }, shell, fill };
