/**
 * public/md-assets/md/article.css → article.scoped.css を作る（@scope 済み）。
 * article.css の正本は noe-posts/_assets/md/article.css（Action がプルリクエストで持ってくる）。
 *   pnpm md-assets:build
 * 生成物はコミットする（本番ビルドに手順を足さないため）。ズレは unit テストが検出する。
 */
import fs from 'node:fs'
import path from 'node:path'
import { scopeMarkdownCss } from './scopeCss'

const dir = path.resolve(process.cwd(), 'public/md-assets/md')
const src = fs.readFileSync(path.join(dir, 'article.css'), 'utf8')
fs.writeFileSync(path.join(dir, 'article.scoped.css'), scopeMarkdownCss(src), 'utf8')
console.log('wrote public/md-assets/md/article.scoped.css')
