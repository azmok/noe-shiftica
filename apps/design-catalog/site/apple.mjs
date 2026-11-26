// 構成：トップ＝apple.com のタイル、サービスと Works＝製品ページ、記事一覧＝ニュースルーム、記事＝ニュースルームの記事。
import * as c from './content.mjs';
import { anchor, contact, each, esc, link, out, paddles, sample, scroller, wrapTables } from './kit.mjs';

const pill = (label, href, kind = '') => anchor(label, href, `pill ${kind}`);
const tile = (cls, head, sub, actions, art = '') => `<section class="tile ${cls}"><div class="tile-copy"><h2>${head}</h2><p>${sub}</p><div class="actions">${actions}</div></div>${art}</section>`;
const sectionHead = (title, side = '') => `<header class="section-head"><h2>${title}</h2>${side}</header>`;
const pageHead = (title) => `<header class="page-header"><h1>${title}</h1></header>`;
const cta = () => `<section class="closing" data-in><h2>Ready to Shift?</h2><p>まず話しましょう。相談は無料。押し売りなし。</p><div class="actions">${pill('無料相談を予約する', contact)}</div></section>`;
const feature = ([title, body], i, label) => `<article class="feature-card"><small>${label ? `${label} ${i + 1}` : ''}</small><h3>${title}</h3><p>${body}</p></article>`;
const newsTile = (post, size) => `<a class="news news-${size}" href="${link('article')}"><span class="frame"><img src="${post.image}" alt="" loading="lazy"></span><span class="news-copy"><small>${esc(post.group)}</small><b>${esc(post.title)}</b></span></a>`;
const story = (post, size) => `<a class="story story-${size}" href="${link('article')}"><img src="${post.image}" alt="" loading="lazy"><span><em>${esc(post.group)}</em><b>${esc(post.title)}</b></span></a>`;

function top() {
  const [mirai, designer] = c.works;
  return `<a class="ribbon" href="${link('article')}">最新の記事：${esc(c.posts[0].title)}<i aria-hidden="true">›</i></a>
  <section class="tile full hero" data-dark><div class="tile-copy"><h1>Design the Shift.</h1><p>本質を設計する。世界観を転換する。</p><div class="actions">${pill('無料相談を予約する', contact)}${pill('実績を見る', link('works'), 'line')}</div></div><div class="hero-art"><canvas aria-hidden="true"></canvas></div></section>
  ${tile('full alt ai', 'AIで速く、人間で美しく。', '制作コストを削減して、その分を「質」に全振りする。', pill('考え方を見る', link('about')) + pill('サービス', link('services'), 'line'), `<div class="triple">${each(c.facts.slice(0, 3), ([n, l]) => `<div><b>${n}</b><span>${l}</span></div>`)}</div>`)}
  <div class="tiles">
    ${tile('half yellow', esc(mirai[0]), esc(mirai[2]), pill('サイトを見る', mirai[4]), `<img class="tile-art" src="${mirai[3]}" alt="">`)}
    ${tile('half black', esc(designer[0]), esc(designer[2]), pill('サイトを見る', designer[4]), `<img class="tile-art" src="${designer[3]}" alt="">`)}
    ${tile('half alt', '明確な価格。', '隠れた費用なし。15万円〜。', pill('プランを見る', '#plans'), `<div class="price-art">${each(c.plans, ([n, p]) => `<span><em>${n}</em><b>${p}</b></span>`)}</div>`)}
    ${tile('half lime', 'フルリモート。', '東京・渋谷から、全国どこへでも。', pill('あずまについて', link('about'), 'ink'), '<img class="tile-art portrait" src="./media/azuma.png" alt="">')}
  </div>
  <section class="block" data-in>${sectionHead('最新の記事。', paddles('latest'))}${scroller('latest', '最新の記事', each(c.posts.slice(0, 6), (p) => `<a class="gallery-card" href="${link('article')}"><img src="${p.image}" alt="" loading="lazy"><span><b>${esc(p.title)}</b><em>${esc(p.group)}</em></span></a>`), 'gallery')}</section>
  <section class="block tinted" data-in>${sectionHead('最短1週間で公開まで。', paddles('steps'))}${scroller('steps', '公開までの流れ', each(c.steps, (s, i) => feature(s, i, 'ステップ')), 'cards')}</section>
  <section class="block" id="plans" data-in>${sectionHead('プランはこちら。')}<div class="lineup">${each(c.plans, ([n, p, d, t]) => `<article><h3>${n}</h3><p class="lead">${d}</p><p class="price">${p}</p><p class="fine">${t}</p><div class="actions">${pill('相談する', contact)}</div></article>`)}</div></section>
  <section class="block tinted" data-in>${sectionHead('よくあるご質問。')}<div class="faq">${each(c.faq, ([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`)}</div></section>${cta()}`;
}

function services() {
  const art = ['<div class="browser"><i></i><i></i><i></i><img src="./media/mirai-foundry-thumb.png" alt=""></div>', `<div class="cms">${each(c.posts.slice(0, 4), (p) => `<span><img src="${p.image}" alt=""><b>${esc(p.title)}</b><em>公開中</em></span>`)}</div>`, '<canvas aria-hidden="true"></canvas>'];
  return `${pageHead('サービス')}
  <nav class="chapters" aria-label="サービス">${each(c.services, ([t], i) => `<a href="#service-${i}"><svg viewBox="0 0 48 48" aria-hidden="true">${['<rect x="5" y="9" width="38" height="26" rx="3"/><path d="M18 41h12M24 35v6"/>', '<rect x="9" y="5" width="30" height="38" rx="3"/><path d="M16 15h16M16 23h16M16 31h10"/>', '<circle cx="24" cy="24" r="7"/><path d="M24 4v9M24 35v9M4 24h9M35 24h9M10 10l6 6M32 32l6 6M38 10l-6 6M16 32l-6 6"/>'][i]}</svg><span>${t}</span></a>`)}</nav>
  ${scroller('service-list', 'サービス', each(c.services, ([t, d, href], i) => `<article class="router ${['alt', 'black', 'lime'][i]}" id="service-${i}"><div class="router-head"><div><h2>${t}</h2><p>${d}</p></div><div class="actions">${href ? pill('事例を見る', href, i === 2 ? 'ink' : '') : pill('実績を見る', link('works'))}</div></div><div class="router-art">${art[i]}</div></article>`), 'routers')}
  <p class="center-paddles">${paddles('service-list')}</p>
  <section class="block tinted" data-in>${sectionHead('こんな方へ。')}<div class="feature-grid">${each(c.audience, (t) => `<article class="feature-card"><h3>${t}</h3></article>`)}</div></section>
  <section class="block" data-in>${sectionHead('制作の流れ。', paddles('flow'))}${scroller('flow', '制作の流れ', each(c.flow, (s, i) => feature(s, i, 'ステップ')), 'cards')}</section>
  <section class="block tinted" data-in>${sectionHead('支える技術。')}<ul class="specs">${each(c.tech, ([n, r]) => `<li><b>${n}</b><span>${r}</span></li>`)}</ul></section>${cta()}`;
}

function works() {
  return `${pageHead('Works')}<div class="work-stack">${each(c.works, ([n, k, d, img, href], i) => `<article class="router ${i ? 'black' : 'yellow'}" data-in><div class="router-head"><div><h2>${esc(n)}</h2><p>${esc(d)}</p></div><div class="actions">${pill('サイトを見る', href, i ? '' : 'ink')}</div></div><div class="router-art"><div class="browser"><i></i><i></i><i></i><img src="${img}" alt="${esc(n)}"></div></div><small>${esc(k)}</small></article>`)}
  <article class="router alt slot" data-in><div><h2>次の作品の場所。</h2><p>3件目は、今のサイトでも準備中です。</p><div class="actions">${pill('相談する', contact)}</div></div></article></div>${cta()}`;
}

function about() {
  return `${pageHead('About')}
  <section class="tile full alt quote"><div class="tile-copy"><h2>${c.quote.replace('。', '。<br>')}</h2></div></section>
  <div class="rail story-text">${each(c.about, ([t, ps]) => `<section data-in><h2>${t}</h2>${each(ps, (p) => `<p>${p}</p>`)}</section>`)}</div>
  <div class="tiles">
    <section class="tile half alt list"><div class="tile-copy"><h2>やらないこと。</h2><ul>${each(c.donts, (t) => `<li>${t}</li>`)}</ul></div></section>
    <section class="tile half lime list"><div class="tile-copy"><h2>やること。</h2><ul>${each(c.dos, (t) => `<li>${t}</li>`)}</ul></div></section>
  </div>
  <section class="block" data-in><div class="me"><span class="frame"><img src="./media/azuma.png" alt="あずま"></span><div><h2>Design the Shift with Me!</h2><p class="lead">東京・渋谷を拠点に、フルリモートで全国対応。</p><p>${c.profile}</p></div></div></section>
  <section class="block tinted" data-in><div class="rail"><h2 class="rail-head">会社概要</h2><dl>${each(c.company, ([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl></div></section>${cta()}`;
}

function blog() {
  const p = c.posts;
  return `<header class="localnav"><b>Journal</b><span>${each(['AI', '制作', '思考'], (g) => `<a href="#all">${g}</a>`)}</span></header>
  <section class="feed"><h1>最新の記事</h1><div class="news-grid">${newsTile(p[0], 'one')}${newsTile(p[1], 'two')}${newsTile(p[2], 'two')}${each(p.slice(3, 6), (x) => newsTile(x, 'three'))}</div></section>
  <section class="stories" data-in><h2>Stories</h2><p>考えて、つくって、言葉にする。</p><div class="story-grid">${story(p[6], 'wide')}${each(p.slice(7, 10), (x) => story(x, 'small'))}</div></section>
  <section class="feed" id="all" data-in><h2>すべての記事を見る</h2><div class="chips" role="group" aria-label="分類">${each(['すべて', 'AI', '制作', '思考'], (g, i) => `<button type="button" value="${g}" aria-pressed="${i === 0}">${g}</button>`)}</div><div class="rows" id="posts">${each(p, (x) => `<a class="row" href="${link('article')}"><span class="frame"><img src="${x.image}" alt="" loading="lazy"></span><span><small>${esc(x.group)}</small><b>${esc(x.title)}</b></span></a>`)}</div></section>`;
}

const article = () => '<header class="localnav"><b>Journal</b><span></span></header><article id="post" class="post"></article>';

async function fill() {
  const { post, src, body } = await sample();
  document.querySelector('#post').innerHTML = `<header class="rail"><p class="eyebrow">制作<time>2026年11月6日</time></p><h1>${esc(post.title)}</h1>${post.intro ? `<p class="deck">${esc(post.intro)}</p>` : ''}</header><span class="frame lead-image"><img src="${src(post.hero)}" alt=""></span><div class="prose">${body}</div>
  <section class="rail docs"><ul><li>この記事のテキスト<span>コピー</span></li><li>この記事の画像<span>ダウンロード</span></li></ul></section>
  <section class="rail latest"><h2>ほかの記事</h2>${each(c.posts.slice(1, 4), (x) => `<a class="latest-row" href="${link('article')}"><span class="frame"><img src="${x.image}" alt=""></span><span><small>${esc(x.group)}</small><b>${esc(x.title)}</b></span></a>`)}</section>`;
  wrapTables('.prose');
}

const shell = (page, main) => `<header class="globalnav"><div><a class="logo" href="${link('top')}">Noe Shiftica</a><nav aria-label="メイン">${each(c.nav, ([id, label]) => `<a href="${link(id)}" ${id === page || (page === 'article' && id === 'blog') ? 'aria-current="page"' : ''}>${label}</a>`)}<a href="${contact}" ${out}>Contact</a></nav><button class="menu" type="button" aria-expanded="false" aria-label="メニュー"><i></i><i></i></button></div></header><main>${main}</main>
<footer><div class="foot"><p class="note">本質を設計する、AI×デザインスタジオ。最新技術と本質の追求で、ビジネスの世界観を転換します。</p><div class="dir"><div><h4>ページ</h4>${each(c.nav, ([id, l]) => `<a href="${link(id)}">${l}</a>`)}</div><div><h4>サービス</h4>${each(c.services, ([t]) => `<a href="${link('services')}">${t}</a>`)}</div><div><h4>規約</h4>${each(c.legal, ([x, l]) => `<a href="${c.live}/${x}" ${out}>${l}</a>`)}</div><div><h4>つながる</h4>${each(c.social, ([l, h]) => `<a href="${h}" ${out}>${l}</a>`)}</div></div><p class="note end"><span class="logo">Noe Shiftica</span><span>日本</span></p></div></footer>`;

export default { pages: { top, services, works, about, blog, article }, shell, fill };
