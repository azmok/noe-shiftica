# Custom Cursor Disappearing & Unmounting Bug

## Date
2026-03-30

## Tags
`frontend`, `ui`, `react`, `framer-motion`, `bugfix`, `spa-routing`

## Issue Description
React (Next.js) の SPA / App Router 環境において、Framer Motion等を利用した「マウス位置に追従するカスタムカーソル」が、ページ遷移などのタイミングで**突如として消失（見えなくなる）する現象**。

### 根本原因のメカニズム
1. ユーザーが「ボタン」や「リンク」にカーソルを合わせる（`mouseover` 発火）。
2. カーソル状態が「吸着モード（対象要素のサイズや座標にピッタリ合わせる）」に変化する。
3. クリックによりページ遷移、あるいはReact Stateの変更により**ホバー中の対象要素がDOMツリーから即座にアンマウント（削除）される**。
4. 要素が削除されたため、離れたことを知らせる `mouseout` イベントが発火する機会を永遠に失う。
5. カーソル制御側の同期ループ（`requestAnimationFrame`）は、**「まだその要素をホバーしている」と誤認**し、消滅した要素に対して `getBoundingClientRect()` を毎フレーム呼び出し続ける。
6. アンマウント済みのDOMノードから返ってくる値は `{ x: 0, y: 0, width: 0, height: 0 }` となるため、**カーソルが左上の座標[0,0]にワープし、サイズが0x0になって完全に消失したように見える**。

## Solution & Best Practice
カーソル制御側の監視ループ（毎フレーム実行される箇所）の冒頭に、**「ホバー対象の要素が現在もDOM上に存在しているか？」** をチェックする安全装置（死活監視）を設ける。

### Code Example (`CustomCursor.tsx`)
```tsx
// requestAnimationFrame による更新ループ内の処理
if (stateRef.current === "hovered" && hoveredElementRef.current) {

  // 【重要】DOMから対象要素が消滅していないか生存確認を行う
  if (!document.body.contains(hoveredElementRef.current)) {
    // 要素が消滅（アンマウント）した場合は、強制的にホバー状態を解除して即座にリセットする
    hoveredElementRef.current = null;
    setHoveredElProps(null);
    stateRef.current = "springing"; // または "normal"
  } else {
    // 要素が生きている場合のみ座標に吸着
    const rect = hoveredElementRef.current.getBoundingClientRect();
    cursorX.set(rect.left);
    cursorY.set(rect.top);
  }
}
```

## UI知識としてのまとめ
- **イベントライフサイクルとReactDOMの乖離を意識する**: ブラウザの標準イベント（`mouseover / mouseout` 等）は、Reactによる仮想DOMの破壊・再構築を関知しないため、ホバーを伴うリッチなカスタムUIを作る際は「要素自体が消滅した際のエスケープルート」を常に実装しておく必要がある。
- **`document.body.contains(el)` の有用性**: カスタムカーソルに限らず、ツールチップ（Tooltip）やフローティングメニューが「要素消滅後も画面に残ってしまうバグ」などに対しても非常に有効な防衛策となる。
