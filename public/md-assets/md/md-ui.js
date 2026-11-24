/*
 * md-ui.js — 記事ページの動きと操作感（ini.md.css とセット）
 *
 *  1. AI別ボックス（.ai-box）の折りたたみ
 *  2. スクロールで要素がふわっと現れる演出
 *  3. 太字の結論文に、マーカーが引かれる演出
 *  4. 読了プログレスバー（画面上端）
 *  5. コードブロックの「コピー」ボタン
 *  6. 図・画像とボックスの奥行き（マウスに合わせて少し傾く／光る）
 *  7. ページ上部へ戻るボタン
 *
 *  「動きを減らす」設定の人には、2・3・6 の動きを出さない
 *  JSが動かない環境では、何も隠さず普通に全部表示される
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var boxSeq = 0;   // 複数の本文コンテナがあっても id が重ならないよう、全体で数える

  // 本文コンテナ1つ分の初期化。サイトでは本文がモバイル用・デスクトップ用の2つ描画されるので、
  // [data-md-root] ごとに1回ずつ呼ぶ（片方は CSS で非表示）
  function createUi(root) {
  var mount = root.hasAttribute('data-md-root') ? root : document.body;   // 進捗バー・上へ戻るボタンの置き場所

  /* ---------- 1. AI別ボックスの折りたたみ ---------- */
  // 初期状態：Claude のボックスは開く／ChatGPT・Gemini は閉じる
  // 個別に変えたい時は <div class="ai-box ..." data-open="true|false">
  function setupAiBoxes() {
    root.querySelectorAll('.ai-box').forEach(function (box) {
      var title = box.querySelector('.ai-box__title');
      if (!title || box.classList.contains('is-collapsible')) return;

      // タイトル以外の中身を、開閉する入れ物に移す
      var body = document.createElement('div');
      var inner = document.createElement('div');
      body.className = 'ai-box__body';
      inner.className = 'ai-box__inner';
      body.id = 'ai-box-body-' + (++boxSeq);
      while (title.nextSibling) inner.appendChild(title.nextSibling);
      body.appendChild(inner);
      box.appendChild(body);

      // タイトルの中身をボタンで包む（見出し＋ボタンのアクセシブルな形）
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ai-box__toggle';
      btn.setAttribute('aria-controls', body.id);
      while (title.firstChild) btn.appendChild(title.firstChild);
      var label = document.createElement('span');
      label.className = 'ai-box__hint';
      var chev = document.createElement('span');
      chev.className = 'ai-box__chevron';
      chev.setAttribute('aria-hidden', 'true');
      btn.appendChild(label);
      btn.appendChild(chev);
      title.appendChild(btn);

      var attr = box.getAttribute('data-open');
      var open = attr ? attr === 'true' : box.classList.contains('ai-box--claude');
      box.classList.add('is-collapsible');
      setOpen(box, btn, label, open, false);

      btn.addEventListener('click', function () {
        var next = !box.classList.contains('is-open');
        // 閉じる中に用語ポップアップが開いていたら閉じる
        if (!next && box.querySelector('.term.is-open')) document.body.click();
        setOpen(box, btn, label, next, true);
      });
    });
  }
  function setOpen(box, btn, label, open, animate) {
    box.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    label.textContent = open ? '閉じる' : '開く';
    if (animate) {
      box.classList.add('is-animating');
      setTimeout(function () { box.classList.remove('is-animating'); }, 450);
    }
  }

  /* ---------- 2. スクロールで現れる演出 ---------- */
  function setupReveal() {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    var targets = [];
    Array.prototype.forEach.call(root.children, function (el) {
      var tag = el.tagName;
      if (/^(SCRIPT|LINK|STYLE|H1)$/.test(tag)) return;
      if (el.classList.contains('term-pop') || el.classList.contains('md-progress') || el.classList.contains('md-totop')) return;
      el.classList.add('reveal');
      if (tag === 'UL' || tag === 'OL') el.classList.add('reveal--list');
      targets.push(el);
    });
    // リストの項目は少しずつ時間差で
    root.querySelectorAll('.reveal--list > li').forEach(function (li, i, all) {
      var idx = Array.prototype.indexOf.call(li.parentNode.children, li);
      li.style.setProperty('--i', Math.min(idx, 8));
    });

    document.documentElement.classList.add('js-motion');
    root.classList.add('js-motion');   // サイトに埋め込まれた時は、CSS が本文コンテナの状態クラスを見る
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-inview');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (el) {
      // すでに画面内にあるものは、読み込み直後に順番に出す
      io.observe(el);
    });
  }

  /* ---------- 3. 結論文のマーカー ---------- */
  function setupMarkers() {
    root.querySelectorAll('p > strong:only-child').forEach(function (s) {
      var p = s.parentNode;
      // 段落まるごと太字の「結論の一文」だけを対象にする
      if (p.textContent.trim() !== s.textContent.trim()) return;
      s.classList.add('md-marker');
    });
    if (reduceMotion || !('IntersectionObserver' in window)) {
      root.querySelectorAll('.md-marker').forEach(function (m) { m.classList.add('is-drawn'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          setTimeout(function () { e.target.classList.add('is-drawn'); }, 250);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.9 });
    root.querySelectorAll('.md-marker').forEach(function (m) { io.observe(m); });
  }

  /* ---------- 4. 読了プログレスバー ---------- */
  function setupProgress() {
    var bar = document.createElement('div');
    bar.className = 'md-progress';
    bar.setAttribute('aria-hidden', 'true');
    mount.appendChild(bar);
    var ticking = false;
    function update() {
      ticking = false;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var r = h > 0 ? Math.min(Math.max(window.scrollY / h, 0), 1) : 0;
      bar.style.transform = 'scaleX(' + r + ')';
      toTop && toTop.classList.toggle('is-shown', window.scrollY > window.innerHeight * 0.8);
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- 5. コードのコピー ---------- */
  var COPY_ICON = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 15V6.5A1.5 1.5 0 0 1 6.5 5H15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var DONE_ICON = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function setupCopy() {
    root.querySelectorAll('pre').forEach(function (pre) {
      if (pre.querySelector('.md-copy')) return;
      pre.classList.add('has-copy');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'md-copy';
      b.setAttribute('aria-label', 'コードをコピー');
      b.innerHTML = COPY_ICON + '<span>コピー</span>';
      b.addEventListener('click', function () {
        var code = pre.querySelector('code');
        var text = (code || pre).innerText.replace(/\n$/, '');
        copyText(text).then(function () {
          b.classList.add('is-done');
          b.innerHTML = DONE_ICON + '<span>コピーしました</span>';
          setTimeout(function () {
            b.classList.remove('is-done');
            b.innerHTML = COPY_ICON + '<span>コピー</span>';
          }, 1600);
        });
      });
      pre.appendChild(b);
    });
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      resolve();
    });
  }

  /* ---------- 6. 奥行き（傾き・光） ---------- */
  function setupDepth() {
    if (reduceMotion || !canHover) return;
    // 図・画像：マウス位置に合わせて少しだけ傾ける
    root.querySelectorAll('img:not(.icons)').forEach(function (img) {
      img.classList.add('md-tilt');
      var raf = 0;
      img.addEventListener('pointermove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var r = img.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - 0.5;
          var y = (e.clientY - r.top) / r.height - 0.5;
          img.style.setProperty('--rx', (-y * 4).toFixed(2) + 'deg');
          img.style.setProperty('--ry', (x * 5).toFixed(2) + 'deg');
        });
      });
      img.addEventListener('pointerleave', function () {
        img.style.setProperty('--rx', '0deg');
        img.style.setProperty('--ry', '0deg');
      });
    });
    // ボックス：マウスの位置に光が当たる
    root.querySelectorAll('.ai-box').forEach(function (el) {
      el.classList.add('md-spot');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- 7. 上へ戻るボタン ---------- */
  var toTop = null;
  function setupToTop() {
    toTop = document.createElement('button');
    toTop.type = 'button';
    toTop.className = 'md-totop';
    toTop.setAttribute('aria-label', 'ページの先頭へ戻る');
    toTop.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 14l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    mount.appendChild(toTop);
  }

  setupAiBoxes();
  setupCopy();
  setupMarkers();
  setupDepth();
  setupToTop();
  setupProgress();
  setupReveal();
  document.documentElement.classList.add('md-ready');
  root.classList.add('md-ready');
  }

  function init() {
    // サイトに埋め込まれた時は [data-md-root] が本文コンテナ。無ければ（ローカルプレビュー）従来どおり探す
    var embedded = document.querySelectorAll('[data-md-root]');
    if (embedded.length) Array.prototype.forEach.call(embedded, createUi);
    else createUi(document.querySelector('article') || document.querySelector('main') || document.body);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
