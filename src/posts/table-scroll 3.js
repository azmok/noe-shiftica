/**
 * table-scroll.js
 * .table-scroll 内のテーブルが横スクロール可能な場合、
 * フェード影の表示切り替えとスクロール検知を行う。
 * また、3カラム以上のテーブルでは、セル内テキストが5文字以上の
 * セルに .cell-wide クラスを付与し、幅を10emに強制する
 * （横スクロールを確実に発生させるための仕掛け）。
 */

// 各テーブルの列数を数えて、3カラム以上なら該当セルに .cell-wide を付与
function applyWideCellClasses() {
  const tables = document.querySelectorAll('.table-scroll table');

  tables.forEach((table) => {
    const firstRow = table.querySelector('tr');
    if (!firstRow) return;

    const columnCount = firstRow.children.length;
    if (columnCount < 3) return; // 3カラム未満は対象外

    const cells = table.querySelectorAll('th, td');
    cells.forEach((cell) => {
      const text = (cell.textContent || '').trim();
      // サロゲートペア（絵文字等）も1文字としてカウント
      const charCount = Array.from(text).length;

      if (charCount >= 5) {
        cell.classList.add('cell-wide');
      }
    });
  });
}

function initTableScroll() {
  applyWideCellClasses();

  const wraps = document.querySelectorAll('.table-scroll');

  wraps.forEach((wrap) => {
    const inner = wrap.querySelector('.table-scroll__inner');
    if (!inner) return;

    const update = () => {
      const scrollLeft = inner.scrollLeft;
      const maxScrollLeft = inner.scrollWidth - inner.clientWidth;

      wrap.classList.toggle('has-scroll-left', scrollLeft > 4);
      wrap.classList.toggle('has-scroll-right', scrollLeft < maxScrollLeft - 4);

      // そもそもスクロールが必要ないテーブルにはヒントを出さない
      const canScroll = maxScrollLeft > 4;
      wrap.classList.toggle('is-scrollable', canScroll);

      if (scrollLeft > 4) {
        wrap.classList.add('is-scrolled');
      }
    };

    // --- ドラッグ＆ドロップ（スワイプ）スクロール機能 ---
    let isDown = false;
    let startX = 0;
    let scrollLeftStart = 0;
    let isDragging = false;

    inner.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, a, input, textarea, select')) return;
      isDown = true;
      isDragging = false;
      startX = e.pageX - inner.offsetLeft;
      scrollLeftStart = inner.scrollLeft;
      inner.setPointerCapture(e.pointerId);
    });

    inner.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const x = e.pageX - inner.offsetLeft;
      const walk = (x - startX) * 1.2;
      if (Math.abs(walk) > 4) {
        isDragging = true;
        inner.classList.add('is-dragging');
      }
      if (isDragging) {
        inner.scrollLeft = scrollLeftStart - walk;
      }
    });

    const endDrag = (e) => {
      if (!isDown) return;
      isDown = false;
      setTimeout(() => {
        inner.classList.remove('is-dragging');
        isDragging = false;
      }, 0);
      try {
        if (inner.hasPointerCapture(e.pointerId)) {
          inner.releasePointerCapture(e.pointerId);
        }
      } catch (err) {}
    };

    inner.addEventListener('pointerup', endDrag);
    inner.addEventListener('pointercancel', endDrag);
    inner.addEventListener('pointerleave', endDrag);

    inner.addEventListener('click', (e) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    inner.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    requestAnimationFrame(update);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTableScroll);
} else {
  initTableScroll();
}
