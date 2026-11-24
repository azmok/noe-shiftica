/*
 * term-note.js — 用語・注釈を、クリックした語のすぐ近くにポップアップ表示する
 *
 * 記事側の書き方：
 *   <button type="button" class="term" data-note="解説文">用語</button>
 *   （見出しを用語と変えたい時は data-term="見出し" を追加）
 *
 * 操作：
 *   - 用語をクリック／タップ → 開く（もう一度押すと閉じる）
 *   - ポップアップの外をクリック、×ボタン、Escキー → 閉じる
 *   - キーボード（Tab → Enter/Space）でも開閉できる
 */
(function () {
  'use strict';

  var MARGIN = 10;   // 画面の端との最低余白(px)
  var GAP = 10;      // 用語とポップアップの間隔(px)

  var pop, titleEl, bodyEl, arrowEl, closeBtn;
  var mount = null;     // サイトに埋め込まれた時の本文コンテナ（[data-md-root]）。ローカルプレビューでは null
  var current = null;   // いま開いている .term
  var raf = 0;

  function build() {
    pop = document.createElement('div');
    pop.className = 'term-pop';
    pop.id = 'term-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-modal', 'false');
    pop.setAttribute('aria-labelledby', 'term-pop-title');
    pop.tabIndex = -1;
    pop.hidden = true;
    pop.innerHTML =
      '<div class="term-pop__head">' +
        '<span class="term-pop__label">用語</span>' +
        '<strong class="term-pop__title" id="term-pop-title"></strong>' +
        '<button type="button" class="term-pop__close" aria-label="閉じる">×</button>' +
      '</div>' +
      '<p class="term-pop__body"></p>' +
      '<span class="term-pop__arrow" aria-hidden="true"></span>';
    document.body.appendChild(pop);
    titleEl = pop.querySelector('.term-pop__title');
    bodyEl = pop.querySelector('.term-pop__body');
    arrowEl = pop.querySelector('.term-pop__arrow');
    closeBtn = pop.querySelector('.term-pop__close');
    closeBtn.addEventListener('click', function () { close(true); });
  }

  function open(term, byKeyboard) {
    if (current && current !== term) close(false);
    current = term;
    // 本文コンテナ（[data-md-root]）の中にいる用語なら、ポップアップもその中に置く（CSS の閉じ込めが効く）。
    // 本文は2つ描画され片方は非表示なので、押された用語のコンテナへ毎回移す
    mount = term.closest ? term.closest('[data-md-root]') : null;
    var host = mount || document.body;
    if (pop.parentNode !== host) host.appendChild(pop);
    titleEl.textContent = term.getAttribute('data-term') || term.textContent.trim();
    bodyEl.textContent = term.getAttribute('data-note') || '';
    term.setAttribute('aria-expanded', 'true');
    term.classList.add('is-open');
    pop.hidden = false;
    pop.classList.remove('is-visible');
    position();
    // 次のフレームで表示アニメーション
    requestAnimationFrame(function () { pop.classList.add('is-visible'); });
    if (byKeyboard) pop.focus({ preventScroll: true });
  }

  function close(returnFocus) {
    if (!current) return;
    var term = current;
    term.setAttribute('aria-expanded', 'false');
    term.classList.remove('is-open');
    pop.classList.remove('is-visible');
    pop.hidden = true;
    current = null;
    if (returnFocus) term.focus({ preventScroll: true });
  }

  // 用語の位置に合わせて配置（下に置けなければ上に出す。左右は画面内に収める）
  function position() {
    if (!current) return;
    var r = current.getBoundingClientRect();
    // 行をまたいで折り返した用語は、最初の行の位置を基準にする
    var rects = current.getClientRects();
    if (rects.length > 1) r = rects[0];

    var vw = document.documentElement.clientWidth;
    var vh = window.innerHeight;
    var pw = pop.offsetWidth;
    var ph = pop.offsetHeight;

    var below = vh - r.bottom;
    var placeAbove = below < ph + GAP + MARGIN && r.top > below;

    var top = placeAbove ? r.top - ph - GAP : r.bottom + GAP;
    var center = r.left + r.width / 2;
    var left = Math.min(Math.max(center - pw / 2, MARGIN), vw - pw - MARGIN);

    if (mount) {
      // 本文コンテナの中に置くので、祖先の position に影響されない fixed + 画面座標にする
      pop.style.position = 'fixed';
      pop.style.top = top + 'px';
      pop.style.left = left + 'px';
    } else {
      pop.style.top = (top + window.scrollY) + 'px';
      pop.style.left = (left + window.scrollX) + 'px';
    }
    pop.classList.toggle('is-above', placeAbove);

    // 矢印は用語の中央を指す（角丸にかからない範囲で）
    var ax = Math.min(Math.max(center - left, 16), pw - 16);
    arrowEl.style.left = ax + 'px';

    // 用語が画面外（横スクロールした表の外など）に出たら閉じる
    if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) close(false);
  }

  function schedule() {
    if (!current || raf) return;
    raf = requestAnimationFrame(function () { raf = 0; position(); });
  }

  function init() {
    var terms = document.querySelectorAll('.term[data-note]');
    if (!terms.length) return;
    build();
    terms.forEach(function (t) {
      t.setAttribute('aria-expanded', 'false');
      t.setAttribute('aria-controls', 'term-pop');
      if (t.tagName !== 'BUTTON') { t.setAttribute('role', 'button'); t.tabIndex = 0; }
    });

    document.addEventListener('click', function (e) {
      var term = e.target.closest && e.target.closest('.term[data-note]');
      if (term) {
        e.preventDefault();
        if (current === term) close(false);
        else open(term, e.detail === 0);   // detail===0 はキーボード操作によるクリック
        return;
      }
      if (current && !pop.contains(e.target)) close(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && current) { close(true); return; }
      // span 等で書かれた用語も Enter / Space で開けるように
      var t = e.target;
      if ((e.key === 'Enter' || e.key === ' ') && t.classList && t.classList.contains('term') && t.tagName !== 'BUTTON') {
        e.preventDefault();
        if (current === t) close(false); else open(t, true);
      }
    });

    window.addEventListener('resize', schedule);
    // 表の横スクロールなど、どこでスクロールしても追従させる
    document.addEventListener('scroll', schedule, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
