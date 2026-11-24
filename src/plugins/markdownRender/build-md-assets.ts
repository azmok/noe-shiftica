/**
 * public/md-assets/md/ini.md.css → ini.md.scoped.css を作る（@scope 済み）。
 *   pnpm md-assets:build
 * 生成物はコミットする（本番ビルドに手順を足さないため）。ズレは unit テストが検出する。
 */
import fs from 'node:fs'
import path from 'node:path'
import { scopeMarkdownCss } from './scopeCss'

const dir = path.resolve(process.cwd(), 'public/md-assets/md')
const src = fs.readFileSync(path.join(dir, 'ini.md.css'), 'utf8')
fs.writeFileSync(path.join(dir, 'ini.md.scoped.css'), scopeMarkdownCss(src), 'utf8')
console.log('wrote public/md-assets/md/ini.md.scoped.css')
