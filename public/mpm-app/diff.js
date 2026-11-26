/*
 * diff.js — 2つの文章の差分（Myers の方法）。Markdown Post Manager の「差分」表示で使う。
 *
 *   NoeDiff.lines(a, b)        … 行ごとの差分。[{ op: ' ' | '-' | '+', a: 旧の行番号, b: 新の行番号, text }]
 *   NoeDiff.chars(a, b)        … 1行の中の文字ごとの差分。[{ op, text }]（変わった部分に色を付けるため）
 *   NoeDiff.hunks(rows, ctx)   … 変更のまわり ctx 行だけを残したかたまりに分ける
 */
(function (global) {
  'use strict'

  /** 配列 a → b の最短の編集手順。[{ op, ai, bi }]（ai / bi は 0 始まりの添字。追加は ai = -1、削除は bi = -1） */
  function myers(a, b) {
    var n = a.length, m = b.length, max = n + m, off = max + 1
    var v = new Int32Array(2 * max + 3), trace = []
    for (var d = 0; d <= max; d++) {
      trace.push(v.slice())
      for (var k = -d; k <= d; k += 2) {
        var x = k === -d || (k !== d && v[off + k - 1] < v[off + k + 1]) ? v[off + k + 1] : v[off + k - 1] + 1
        var y = x - k
        while (x < n && y < m && a[x] === b[y]) { x++; y++ }
        v[off + k] = x
        if (x >= n && y >= m) return backtrack(trace, a, b, off, d)
      }
    }
    return []
  }
  function backtrack(trace, a, b, off, dEnd) {
    var x = a.length, y = b.length, out = []
    for (var d = dEnd; d > 0; d--) {
      var v = trace[d], k = x - y
      var prevK = k === -d || (k !== d && v[off + k - 1] < v[off + k + 1]) ? k + 1 : k - 1
      var px = v[off + prevK], py = px - prevK
      while (x > px && y > py) { x--; y--; out.push({ op: ' ', ai: x, bi: y }) }
      if (x === px) { y--; out.push({ op: '+', ai: -1, bi: y }) } else { x--; out.push({ op: '-', ai: x, bi: -1 }) }
    }
    while (x > 0 && y > 0) { x--; y--; out.push({ op: ' ', ai: x, bi: y }) }
    return out.reverse()
  }

  function split(text) {
    if (text == null) return []
    var t = String(text).replace(/\r\n?/g, '\n')
    if (t.slice(-1) === '\n') t = t.slice(0, -1)
    return t === '' ? [] : t.split('\n')
  }

  function lines(oldText, newText) {
    var a = split(oldText), b = split(newText)
    // 先頭と末尾の同じ行は計算から外す（長い記事でも速い）
    var head = 0
    while (head < a.length && head < b.length && a[head] === b[head]) head++
    var tail = 0
    while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++
    var mid = myers(a.slice(head, a.length - tail), b.slice(head, b.length - tail))
    var rows = []
    for (var i = 0; i < head; i++) rows.push({ op: ' ', a: i + 1, b: i + 1, text: a[i] })
    mid.forEach(function (e) {
      if (e.op === ' ') rows.push({ op: ' ', a: head + e.ai + 1, b: head + e.bi + 1, text: a[head + e.ai] })
      else if (e.op === '-') rows.push({ op: '-', a: head + e.ai + 1, b: null, text: a[head + e.ai] })
      else rows.push({ op: '+', a: null, b: head + e.bi + 1, text: b[head + e.bi] })
    })
    for (var j = tail; j > 0; j--) rows.push({ op: ' ', a: a.length - j + 1, b: b.length - j + 1, text: a[a.length - j] })
    return rows
  }

  /** 1行の中の差分。長すぎる行は丸ごと変わったことにする */
  function chars(oldLine, newLine) {
    var a = Array.from(oldLine || ''), b = Array.from(newLine || '')
    if (a.length * b.length > 4e6) return [{ op: '-', text: oldLine }, { op: '+', text: newLine }]
    var out = []
    myers(a, b).forEach(function (e) {
      var ch = e.op === '+' ? b[e.bi] : a[e.ai], last = out[out.length - 1]
      if (last && last.op === e.op) last.text += ch; else out.push({ op: e.op, text: ch })
    })
    return out
  }

  /** 変更のまわり ctx 行だけを残す。[{ rows, skippedBefore }]（skippedBefore＝その前に省いた行数） */
  function hunks(rows, ctx) {
    var keep = new Array(rows.length).fill(false)
    rows.forEach(function (r, i) {
      if (r.op === ' ') return
      for (var j = Math.max(0, i - ctx); j <= Math.min(rows.length - 1, i + ctx); j++) keep[j] = true
    })
    var out = [], cur = null, skipped = 0
    rows.forEach(function (r, i) {
      if (!keep[i]) { skipped++; cur = null; return }
      if (!cur) { cur = { rows: [], skippedBefore: skipped }; out.push(cur); skipped = 0 }
      cur.rows.push(r)
    })
    if (out.length) out.skippedAfter = skipped
    return out
  }

  /** 追加・削除の行数 */
  function stats(rows) {
    var s = { added: 0, removed: 0 }
    rows.forEach(function (r) { if (r.op === '+') s.added++; else if (r.op === '-') s.removed++ })
    return s
  }

  global.NoeDiff = { lines: lines, chars: chars, hunks: hunks, stats: stats }
})(typeof window !== 'undefined' ? window : globalThis)
