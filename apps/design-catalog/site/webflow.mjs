// 構成：トップ＝webflow.com、サービス＝料金ページ、Works＝導入事例、記事一覧＝ブログ、記事＝ブログの記事。
import * as c from './content.mjs';
import { anchor, contact, each, esc, link, out, paddles, sample, scroller, wrapTables } from './kit.mjs';

const btn = (label, href, kind = '') => anchor(label, href, `btn ${kind}`);
const go = '<i class="go" aria-hidden="true">→</i>';
const pill = (text) => `<span class="pill">${esc(text)}</span>`;
const split = (eyebrow, title, deck, action = '') => `<header class="wrap split-head"><p class="eyebrow">${eyebrow}</p><div><h1>${title}</h1><p>${deck}</p>${action}</div></header>`;
const post = (p) => `<a class="post-card" href="${link('article')}"><span class="frame"><img src="${p.image}" alt="" loading="lazy">${go}</span><b>${esc(p.title)}</b>${pill(p.group)}</a>`;
const start = () => `<section class="wrap start" data-in><div><h2 class="giant">Ready<br>to Shift?</h2><div class="actions">${btn('無料相談を予約する', contact)}${btn('料金を見る', `${link('top')}#pricing`, 'soft')}</div></div><p>まず話しましょう。相談は無料。押し売りなし。返信は24時間以内です。</p></section>`;
const plans = () => `<div class="plans">${each(c.plans, ([n, p, d, t], i) => `<article class="${i === 1 ? 'strong' : ''}"><h3>${n}</h3><p>${d}</p><p class="price">${p}</p><p class="fine">${t}</p>${btn('相談する', contact, i === 1 ? '' : 'soft')}</article>`)}</div>`;

function marquee() {
  const [mirai, designer] = c.works;
  const cards = [
    `<figure class="m low"><img src="${c.posts[2].image}" alt=""><figcaption>AIの最新を追う</figcaption></figure>`,
    `<a class="m tall" href="${mirai[4]}" ${out}><span><b>${esc(mirai[0])}</b>${esc(mirai[1])}</span><img src="${mirai[3]}" alt=""></a>`,
    `<figure class="m stat"><b>${c.facts[1][0]}</b><figcaption>${c.facts[1][1]}</figcaption></figure>`,
    `<figure class="m low"><img src="${c.posts[0].image}" alt=""><figcaption>移動を削って、質に使う</figcaption></figure>`,
    `<a class="m tall dark" href="${designer[4]}" ${out}><span><b>${esc(designer[0])}</b>${esc(designer[1])}</span><img src="${designer[3]}" alt=""></a>`,
    `<figure class="m stat lime"><b>${c.facts[0][0]}</b><figcaption>${c.facts[0][1]}</figcaption></figure>`,
    `<figure class="m low"><img src="${c.posts[3].image}" alt=""><figcaption>考え方を言葉にする</figcaption></figure>`,
  ].join('');
  return `<div class="marquee"><div>${cards}<span class="dup" aria-hidden="true">${cards.replaceAll('<a ', '<a tabindex="-1" ')}</span></div></div>`;
}

function top() {
  return `<a class="announce" href="${link('article')}">${esc(c.posts[0].title)} ${go}</a>
  <section class="hero"><div class="wrap"><h1 class="giant">Design the Shift.</h1><p>本質を設計する。世界観を転換する。<br>AIと最新技術で、Webサイトとデジタル体験をつくります。</p><div class="actions">${btn('無料相談を予約する', contact)}${btn('実績を見る', link('works'), 'soft')}</div></div>${marquee()}</section>
  <section class="tech"><ul class="wrap">${each(c.tech, ([n]) => `<li>${n}</li>`)}</ul></section>
  <section class="wrap intro" data-in><p class="eyebrow">制作コストを削減して、その分を「質」に</p><h2 class="giant">AI × Design</h2><div class="stage" data-dark><div class="window"><i></i><i></i><i></i><canvas aria-hidden="true"></canvas></div></div><div class="intro-foot"><div><h3>AIで速く、<br>人間で美しく。</h3>${btn('考え方を見る', link('about'))}</div><ul>${each(c.pillars, ([t, d]) => `<li><b>${t}</b><span>${d}</span></li>`)}</ul></div></section>
  <section class="stories" data-in><div class="wrap row-head"><h2>つくったものが、<br>いちばんの説明になる。</h2>${paddles('cases')}</div>${scroller('cases', 'Works', each(c.works, ([n, k, d, img, href]) => `<a class="case" href="${href}" ${out}><img src="${img}" alt="${esc(n)}"><span><b>${esc(n)}</b><em>${esc(k)}</em><small>${esc(d)}</small>${go}</span></a>`) + `<a class="case next" href="${contact}" ${out}><span><b>次は、あなたの番。</b><em>3件目は準備中です</em><small>無料相談を予約する</small>${go}</span></a>`, 'cases')}</section>
  <section class="wrap two-col" data-in><div><h2>最短1週間で<br>公開まで。</h2><p class="sub">迷いを潰す5ステップ。</p></div><ol class="line-list">${each(c.steps, ([t, d]) => `<li><b>${t}</b><span>${d}</span></li>`)}</ol></section>
  <section class="wrap" id="pricing" data-in><h2>明確な価格。<br>隠れた費用なし。</h2><p class="sub gap">必要な費用は、何のために・誰に・いくらかかるかを必ず事前に説明します。</p>${plans()}</section>
  <section class="wrap" data-in><h2 class="h3">最新の記事</h2><div class="updates">${each(c.posts.slice(0, 3), (p) => `<a href="${link('article')}"><small>${esc(p.group)}</small><b>${esc(p.title)}</b><span class="frame"><img src="${p.image}" alt="" loading="lazy"></span></a>`)}</div></section>
  <section class="ring-section" data-in><h2 class="giant">#DesignTheShift</h2><div class="ring" aria-hidden="true">${each(c.posts.slice(0, 10), (p, i) => `<span style="--i:${i}"><img src="${p.image}" alt="" loading="lazy"></span>`)}</div></section>
  <section class="wrap two-col" data-in><h2>よくあるご質問</h2><div>${each(c.faq, ([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`)}</div></section>${start()}`;
}

function services() {
  return `<header class="wrap plain-head"><h1 class="giant">What We Do.</h1><p>Noe Shifticaが提供する3つのこと</p></header>
  <section class="wrap" data-in><div class="joined">${each(c.services, ([t, d, href], i) => `<article class="${i === 2 ? 'fill' : ''}"><div class="joined-head"><h2 class="h4">${t}</h2>${i === 2 ? '<span class="tag">Premium</span>' : ''}</div><p>${d}</p>${href ? btn('事例詳細を見る', href, 'soft') : btn('実績を見る', link('works'), 'soft')}</article>`)}</div></section>
  <section class="wrap two-col" data-in><div><h2>制作の流れ</h2><p class="sub">発注から納品まで、全ステップを明示します。</p></div><ol class="line-list">${each(c.flow, ([t, d]) => `<li><b>${t}</b><span>${d}</span></li>`)}</ol></section>
  <section class="wrap" data-in><h2 class="gap">こんな方へ</h2><div class="cards three">${each(c.audience, (t) => `<div class="card"><h3 class="h4">${t}</h3></div>`)}</div></section>
  <section class="wrap" data-in><div class="black-card"><div><h2 class="h4">支える技術</h2><p>公開後も成長できる構成で作ります。</p></div><ul>${each(c.tech, ([n, r]) => `<li><b>${n}</b><span>${r}</span></li>`)}</ul></div></section>
  <section class="wrap" data-in><h2 class="gap">料金</h2>${plans()}</section>${start()}`;
}

function works() {
  return `${split('Works', 'つくったもの', '公開中の制作実績です。', btn('無料相談を予約する', contact))}
  <div class="tabs"><div class="wrap"><span class="on">公開中の作品</span></div></div>
  <section class="wrap" data-in><div class="cards two">${each(c.works, ([n, k, d, img, href]) => `<a class="card work" href="${href}" ${out}><span class="frame"><img src="${img}" alt="${esc(n)}"></span><h2 class="h4">${esc(n)}</h2><p>${esc(d)}</p>${pill(k)}${go}</a>`)}<div class="card work empty"><h2 class="h4">次の作品の場所</h2><p>3件目は、今のサイトでも準備中です。</p></div></div></section>${start()}`;
}

function about() {
  return `${split('About', '本質を設計する、<br>AI×デザインスタジオ。', c.about[0][1][0])}
  <section class="wrap testimonial" data-in><span class="portrait"><img src="./media/azuma.png" alt="あずま"></span><div>${pill('Philosophy')}<blockquote>${c.quote}</blockquote><p>あずま、Noe Shiftica</p></div></section>
  <div class="tabs empty-tabs"></div>
  <div class="wrap">${each(c.about, ([t, ps]) => `<section class="aside-row" data-in><h2 class="h4">${t}</h2><div>${each(ps, (p, i) => `<p class="${i ? '' : 'lede'}">${p}</p>`)}</div></section>`)}</div>
  <section class="wrap" data-in><div class="joined pair"><article><h2 class="h4">やらないこと</h2><ul>${each(c.donts, (t) => `<li>${t}</li>`)}</ul></article><article class="lime"><h2 class="h4">やること</h2><ul>${each(c.dos, (t) => `<li>${t}</li>`)}</ul></article></div></section>
  <section class="wrap" data-in><div class="black-card me"><div><h2>Design the Shift<br>with Me!</h2></div><p>${c.profile}</p></div></section>
  <section class="wrap aside-row" data-in><h2 class="h4">会社概要</h2><dl>${each(c.company, ([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl></section>${start()}`;
}

function blog() {
  const p = c.posts;
  return `<header class="wrap blog-head"><p class="eyebrow">Noe Shiftica Journal</p><h1 class="giant">考えて、つくって、<br>言葉にする。</h1><p>AIとデザインと、その裏側にある考え方。</p><div class="chips pills" role="group" aria-label="分類">${each(['すべて', 'AI', '制作', '思考'], (g, i) => `<button type="button" value="${g}" aria-pressed="${i === 0}">${g}</button>`)}</div></header>
  <section class="wrap feature-split" data-in><a class="lead-post" href="${link('article')}"><span class="frame"><img src="${p[0].image}" alt="">${go}</span><b>${esc(p[0].title)}</b><small>${esc(p[0].group)}</small></a><div><h2 class="h4">注目の記事</h2>${each(p.slice(1, 5), (x) => `<a class="line-post" href="${link('article')}"><small>${esc(x.group)}</small><b>${esc(x.title)}</b>${go}</a>`)}</div></section>
  <section class="wrap" data-in><a class="banner" href="${link('services')}"><span><em>Services</em>記事で書いたことを、そのままサイトに。</span><u>サービスを見る ↗</u></a></section>
  <section class="wrap feature-split flip" data-in><div>${each(p.slice(5, 9), (x) => `<a class="thumb-post" href="${link('article')}"><span class="frame"><img src="${x.image}" alt="" loading="lazy"></span><span><small>${esc(x.group)}</small><b>${esc(x.title)}</b></span></a>`)}</div><div><h2 class="h4">あわせて読む</h2><a class="lead-post" href="${link('article')}"><span class="frame"><img src="${p[2].image}" alt="">${go}</span><b>${esc(p[2].title)}</b></a></div></section>
  <section class="wrap" data-in><h2 class="browse">すべての記事</h2><div class="post-grid" id="posts">${each(p, post)}</div></section>${start()}`;
}

const article = () => '<article id="post"></article>';

async function fill() {
  const { post: item, src, body } = await sample();
  const root = document.querySelector('#post');
  root.innerHTML = `<header class="article-head"><span class="tint" style="background-image:url('${src(item.hero)}')"></span><div class="wrap"><div><p class="crumb">Blog　›　制作</p><h1>${esc(item.title)}</h1></div><span class="frame"><img src="${src(item.hero)}" alt=""></span></div></header>
  <div class="wrap article-body"><aside><div class="author"><img src="./media/azuma.png" alt=""><span><b>あずま</b><small>Noe Shiftica</small></span></div><nav class="toc" aria-label="目次"><b>目次</b><ol></ol></nav></aside><div class="prose">${body}</div></div>
  <section class="wrap related"><h2>ほかの記事</h2><div class="post-grid">${each(c.posts.slice(1, 5), post)}</div></section>`;
  wrapTables('.prose');
  root.querySelector('.toc ol').innerHTML = each([...root.querySelectorAll('.prose > h2')].slice(0, 7), (h, i) => { h.id = `h-${i}`; return `<li><a href="#h-${i}">${esc(h.textContent)}</a></li>`; });
}

const shell = (page, main) => `<header class="bar"><div class="wrap"><a class="logo" href="${link('top')}">Noe Shiftica</a><nav aria-label="メイン">${each(c.nav, ([id, label]) => `<a href="${link(id)}" ${id === page || (page === 'article' && id === 'blog') ? 'aria-current="page"' : ''}>${label}</a>`)}<a class="btn" href="${contact}" ${out}>Contact</a></nav><button class="menu" type="button" aria-expanded="false" aria-label="メニュー"><i></i><i></i></button></div></header><main>${main}</main>
<footer><div class="wrap foot"><div><h4>ページ</h4>${each(c.nav, ([id, l]) => `<a href="${link(id)}">${l}</a>`)}</div><div><h4>サービス</h4>${each(c.services, ([t]) => `<a href="${link('services')}">${t}</a>`)}</div><div><h4>規約</h4>${each(c.legal, ([x, l]) => `<a href="${c.live}/${x}" ${out}>${l}</a>`)}</div><div><h4>つながる</h4>${each(c.social, ([l, h]) => `<a href="${h}" ${out}>${l}</a>`)}</div></div><p class="mega logo" aria-hidden="true">Noe Shiftica</p></footer>`;

export default { pages: { top, services, works, about, blog, article }, shell, fill };
