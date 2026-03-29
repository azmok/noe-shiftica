# iOS Safari スクロール修正 — Payload CMS Drawer 内のフルスクリーンエディタ

## 問題

Payload CMS の Admin 画面でカスタム `position: fixed` オーバーレイ（フルスクリーンエディタ等）を実装した場合、**実機 iPhone の Safari** では内部の `<textarea>` を縦スクロールできない。PCのモバイルエミュレータでは正常動作するため、デバッグが非常に困難。

## 根本原因（4層構造）

1. **body scroll 非ロック**: オーバーレイ表示時に `document.body` が固定されていないと、iOS Safari が縦スワイプをページバウンスイベントとして先取りし、textarea に届く前に吸収する。
2. **`overflow-y` 未指定**: `flex: 1` だけでは iOS Safari の textarea 内部スクロールが有効にならない。`overflow-y: scroll` の明示が必要。
3. **`WebkitOverflowScrolling: 'touch'` は無効**: iOS 13 以降は deprecated。何もしない。
4. **Payload drawer の `preventDefault`（決定的原因）**: Payload CMS の drawer コンポーネントが `touchmove` イベントリスナーを設定し、`preventDefault()` を呼んでいる。これにより、drawer 内部の要素（textarea を含む）から bubbling してくる `touchmove` イベントが全て default 動作をキャンセルされ、native scroll が完全に死ぬ。上記3つを全て修正しても、これが残っている限りスクロールは機能しない。

## 修正パターン（4ルール）

```tsx
// 1. Body scroll lock（iOS Safari の body バウンス防止）
useEffect(() => {
  if (isOpen) {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
  } else {
    const scrollY = document.body.style.top
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    document.body.style.overflow = ''
    window.scrollTo(0, parseInt(scrollY || '0') * -1)  // 位置ジャンプ防止
  }
  return () => {
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    document.body.style.overflow = ''
  }
}, [isOpen])

// 4. Payload drawer の preventDefault をブロック（最重要）
useEffect(() => {
  if (!isOpen) return
  const ta = textareaRef.current
  if (!ta) return

  const stopProp = (e: TouchEvent) => {
    e.stopPropagation()  // preventDefault は NG — textarea 自身のスクロールが死ぬ
  }
  // passive: false 必須 — stopPropagation を passive listener より前に実行するため
  ta.addEventListener('touchmove', stopProp, { passive: false })
  return () => ta.removeEventListener('touchmove', stopProp)
}, [isOpen])
```

```tsx
// 2 & 3. textarea スタイル
<textarea
  ref={textareaRef}
  style={{
    flex: 1,
    overflowY: 'scroll',           // 'auto' ではなく 'scroll' を明示
    overscrollBehavior: 'contain', // rubber-band を textarea 内に閉じ込める
    minHeight: 0,                  // flex:1 + overflow が Safari で効くために必要
    // ...
  }}
/>
```

## `stopPropagation` vs `preventDefault` の使い分け

| 操作 | 効果 |
|------|------|
| `e.stopPropagation()` | イベントの bubbling を止める。textarea 自身の native scroll は維持される。**これが正解** |
| `e.preventDefault()` | ブラウザのデフォルト動作（= native scroll）をキャンセルする。textarea のスクロール自体が死ぬ。**NG** |

## 注意事項

- **実機テスト必須**: PC のモバイルエミュレータは OS レベルのタッチイベント処理をバイパスするため、この種のバグを再現しない。
- **Payload の drawer 実装に依存**: Payload のバージョンアップで drawer の touchmove 実装が変わった場合、この修正が不要になる可能性もある。
- オーバーレイの固定コンテナ div には `overflow: 'hidden'` を設定する。

## 参照

- 実装: `src/components/MobileFullscreenEditor/index.tsx`
- バグ記録: `.antigravity/bug-history.md` → `[2026-03-30] iOS Safari Vertical Scroll Locked in MobileFullscreenEditor`
