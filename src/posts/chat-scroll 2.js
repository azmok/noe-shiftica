/**
 * chat-scroll.js
 * 3AI比較カードの横スクロール補助 & 表示切り替えトグル
 */
function initChatCompare() {
  const wrappers = document.querySelectorAll('.chat-scroll-wrapper');

  // --- 1. 横スクロール & 左右ボタン & Peek演出 ---
  wrappers.forEach((wrapper) => {
    const container = wrapper.querySelector('.chat-scroll-container');
    const prevBtn = wrapper.querySelector('.chat-nav-btn.prev');
    const nextBtn = wrapper.querySelector('.chat-nav-btn.next');

    if (!container) return;

    const updateScrollState = () => {
      const scrollLeft = container.scrollLeft;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;

      const hasLeft = scrollLeft > 6;
      const hasRight = scrollLeft < maxScrollLeft - 6;

      wrapper.classList.toggle('has-overflow-left', hasLeft);
      wrapper.classList.toggle('has-overflow-right', hasRight);

      if (prevBtn) prevBtn.disabled = !hasLeft;
      if (nextBtn) nextBtn.disabled = !hasRight;
    };

    container.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState, { passive: true });
    wrapper._updateScrollState = updateScrollState; // 外部再計算用

    // 初回描画反映
    requestAnimationFrame(updateScrollState);

    const getScrollStep = () => {
      const firstCard = container.querySelector('.chat:not(.is-hidden)');
      return firstCard ? firstCard.offsetWidth + 18 : 320;
    };

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        container.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        container.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
      });
    }

    // --- ドラッグ＆ドロップ（スワイプ）スクロール機能 ---
    let isDown = false;
    let startX = 0;
    let scrollLeftStart = 0;
    let isDragging = false;
    let lastX = 0;
    let lastTime = 0;
    let velocityX = 0;

    container.addEventListener('pointerdown', (e) => {
      // リンクやボタン、フォーム要素のクリック時はドラッグ開始しない
      if (e.target.closest('button, a, input, textarea, select')) return;
      isDown = true;
      isDragging = false;
      startX = e.pageX - container.offsetLeft;
      lastX = e.pageX;
      lastTime = performance.now();
      velocityX = 0;
      scrollLeftStart = container.scrollLeft;
      container.setPointerCapture(e.pointerId);
    });

    container.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.1; // スクロール移動量
      if (Math.abs(walk) > 4) {
        isDragging = true;
        container.classList.add('is-dragging');
      }
      if (isDragging) {
        container.scrollLeft = scrollLeftStart - walk;
        const now = performance.now();
        const dt = now - lastTime;
        if (dt > 10) {
          velocityX = (e.pageX - lastX) / dt; // 離した時の速度 (px/ms)
          lastX = e.pageX;
          lastTime = now;
        }
      }
    });

    const snapToNearestCard = () => {
      const cards = Array.from(container.querySelectorAll('.chat:not(.is-hidden)'));
      if (!cards.length) return;

      const containerScroll = container.scrollLeft;
      // 慣性を考慮した目標スクロール位置
      const projectedScroll = containerScroll - (velocityX * 180);

      // 各カードの開始位置から一番近いカードを探す
      let bestCard = cards[0];
      let minDiff = Infinity;

      cards.forEach((card) => {
        const cardLeft = card.offsetLeft - container.offsetLeft;
        const diff = Math.abs(cardLeft - projectedScroll);
        if (diff < minDiff) {
          minDiff = diff;
          bestCard = card;
        }
      });

      const targetScroll = bestCard.offsetLeft - container.offsetLeft;
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    };

    const endDrag = (e) => {
      if (!isDown) return;
      isDown = false;
      const wasDragging = isDragging;
      
      container.classList.remove('is-dragging');
      
      try {
        if (container.hasPointerCapture(e.pointerId)) {
          container.releasePointerCapture(e.pointerId);
        }
      } catch (err) {}

      if (wasDragging) {
        // 所定の位置（最近接カード）へ綺麗にスムーズアニメーションでスクロール
        requestAnimationFrame(snapToNearestCard);
        setTimeout(() => {
          isDragging = false;
        }, 50);
      } else {
        isDragging = false;
      }
    };

    container.addEventListener('pointerup', endDrag);
    container.addEventListener('pointercancel', endDrag);
    container.addEventListener('pointerleave', endDrag);

    // ドラッグ中の誤クリック防止
    container.addEventListener('click', (e) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    // 初回Peek（チラ見せ）演出：視界に入ったときに少しだけ右へスクロールして戻す
    let hasPeeked = false;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasPeeked) {
            hasPeeked = true;
            const canScroll = container.scrollWidth > container.clientWidth;
            if (canScroll && container.scrollLeft === 0) {
              setTimeout(() => {
                container.scrollTo({ left: 50, behavior: 'smooth' });
                setTimeout(() => {
                  container.scrollTo({ left: 0, behavior: 'smooth' });
                }, 400);
              }, 350);
            }
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(wrapper);
  });

  // --- 2. 表示切り替えトグル機能 ---
  const filterButtons = document.querySelectorAll('.chat-filter-btn');
  if (!filterButtons.length) return;

  // 表示されているカード数に応じてコンテナの幅調整用属性を更新
  const updateVisibleCounts = () => {
    const activeBtns = document.querySelectorAll('.chat-filter-btn.is-active');
    const count = activeBtns.length;

    wrappers.forEach((w) => {
      const c = w.querySelector('.chat-scroll-container');
      if (c) {
        c.setAttribute('data-visible-count', String(count));
      }
      if (typeof w._updateScrollState === 'function') {
        w._updateScrollState();
      }
    });
  };

  // 初期カウント設定（3社表示）
  updateVisibleCounts();

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target; // 'claude' | 'gemini' | 'chatgpt'
      const isCurrentlyActive = btn.classList.contains('is-active');

      // 全解除の防止：他に最低1つアクティブなボタンがあるか確認
      const activeBtns = document.querySelectorAll('.chat-filter-btn.is-active');
      if (isCurrentlyActive && activeBtns.length <= 1) {
        btn.classList.add('is-shaking');
        setTimeout(() => btn.classList.remove('is-shaking'), 300);
        return;
      }

      // トグル状態を反転
      const nextActive = !isCurrentlyActive;
      btn.classList.toggle('is-active', nextActive);
      btn.setAttribute('aria-pressed', nextActive ? 'true' : 'false');

      // 該当AIのカードをすべて表示/非表示（chat--gpt と chat--chatgpt の両対応）
      const selector = target === 'chatgpt' 
        ? '.chat--chatgpt, .chat--gpt' 
        : `.chat--${target}`;
      
      const targetCards = document.querySelectorAll(selector);
      targetCards.forEach((card) => {
        card.classList.toggle('is-hidden', !nextActive);
      });

      // 表示数とスクロール状態を再計算
      updateVisibleCounts();
    });
  });
}

// DOMの読み込み状態に応じて安全に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatCompare);
} else {
  initChatCompare();
}