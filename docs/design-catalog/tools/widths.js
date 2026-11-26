// 同じ文章を 100px で組んだときの幅を比べる。specs を対象のフォントに書き換えて使う。
async () => {
  const T = {
    kanji: '資産型思考制作会社移動時間空間設計構造人生価値', hira: 'だけどそのほとんどはつかったらきえてなくなるものです', kata: 'デザインシステムエネルギーリソースアプリケーション',
    mixed: '給料日にお金が振り込まれて、月末にはほぼゼロ。休日を楽しく過ごしたはずなのに、月曜の朝、なんか虚しい。', latin: 'Design systems and AI models in 2026 are evolving quickly',
    mixedLatin: '英語圏の「資産（Asset）」の感覚とは、かなりズレています。将来的な価値を生み出すResourceです。',
  }
  const apple = location.hostname.includes('apple')
  const specs = apple ? { ref: ['"SF Pro JP","SF Pro Display"', 'normal'] }
    : location.hostname.includes('airbnb') ? { ref: ['cereal,"cereal Fallback",sans-serif', 'normal'] }
      : { apple: ['"Cat Inter","Cat Noto Tight"', '"palt"'], airbnb: ['"Cat Figtree","Cat Noto"', 'normal'], noto100: ['"Cat Inter","Cat Noto"', '"palt"'] }
  const out = {}
  for (const [k, [fam, feat]] of Object.entries(specs)) for (const w of [400, 700]) {
    const row = {}
    for (const [n, t] of Object.entries(T)) {
      await document.fonts.load(`${w} 40px ${fam}`, t)
      const e = document.createElement('span'); e.textContent = t
      e.style.cssText = `position:absolute;white-space:nowrap;letter-spacing:0;font:${w} 100px ${fam};font-feature-settings:${feat}`
      document.body.append(e); await document.fonts.ready; row[n] = Math.round(e.getBoundingClientRect().width); e.remove()
    }
    out[k + w] = row
  }
  return out
}
