/**
 * SQL を1文ずつに分ける（migrate-over-https.ts 用）。
 *
 * Neon の HTTPS ドライバは1回の問い合わせに1文しか送れない（"cannot insert multiple
 * commands into a prepared statement"）。マイグレーションは1つの sql`...` に複数の文を
 * 書いているので、文字列・識別子・ドル引用（DO $$ ... $$）・コメントの中の `;` は
 * 区切りとみなさずに分ける。
 */
export function splitSqlStatements(text: string): string[] {
  const out: string[] = []
  let start = 0
  let i = 0

  while (i < text.length) {
    const ch = text[i]
    const next = text[i + 1]

    if (ch === '-' && next === '-') {
      const end = text.indexOf('\n', i)
      i = end === -1 ? text.length : end + 1
    } else if (ch === '/' && next === '*') {
      const end = text.indexOf('*/', i + 2)
      i = end === -1 ? text.length : end + 2
    } else if (ch === "'" || ch === '"') {
      // '' / "" inside the literal is an escaped quote
      i++
      while (i < text.length) {
        if (text[i] === ch && text[i + 1] === ch) i += 2
        else if (text[i] === ch) {
          i++
          break
        } else i++
      }
    } else if (ch === '$') {
      const tag = text.slice(i).match(/^\$[A-Za-z_]*\$/)
      if (tag) {
        const end = text.indexOf(tag[0], i + tag[0].length)
        i = end === -1 ? text.length : end + tag[0].length
      } else i++
    } else if (ch === ';') {
      out.push(text.slice(start, i))
      i++
      start = i
    } else i++
  }
  out.push(text.slice(start))

  return out.map((s) => s.trim()).filter((s) => s && !/^(--[^\n]*\n?|\/\*[\s\S]*?\*\/|\s)*$/.test(s))
}
