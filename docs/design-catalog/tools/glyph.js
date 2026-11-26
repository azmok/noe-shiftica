// 字形を 32x32 の濃度と字幅で採る。候補側は window.__cands にフォント名の配列を入れる。
async () => {
  const LAT = [...'abcdefghiknopqrstuvwyzABCEGMNPRSQ0123456789']
  const JPN = [...'あのきさをるアデザイン新画期的構築日本語読旅空間']
  const host = location.hostname
  let list
  if (host.includes('apple.com')) list = [['ref', '"SF Pro JP","SF Pro Display","SF Pro Text"']]
  else if (host.includes('airbnb')) list = [['ref', 'cereal,"cereal Fallback",sans-serif']]
  else list = window.__cands.map((f) => [f, `"${f}"`])
  const weights = [400, 500, 600, 700]
  const c = document.createElement('canvas'); c.width = c.height = 96
  const x = c.getContext('2d', { willReadFrequently: true })
  const res = {}
  for (const [name, fam] of list) {
    for (const w of weights) {
      try { await document.fonts.load(`${w} 64px ${fam}`, LAT.join('') + JPN.join('')) } catch {}
      const o = {}
      for (const ch of [...LAT, ...JPN]) {
        x.fillStyle = '#fff'; x.fillRect(0, 0, 96, 96); x.fillStyle = '#000'; x.font = `${w} 64px ${fam}`; x.textBaseline = 'alphabetic'
        const m = x.measureText(ch)
        const ink = (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2
        x.fillText(ch, 48 - ink, 70)
        const d = x.getImageData(0, 0, 96, 96).data
        let s = ''
        for (let gy = 0; gy < 32; gy++) for (let gx = 0; gx < 32; gx++) { let a = 0; for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) a += 255 - d[((gy * 3 + j) * 96 + gx * 3 + i) * 4]; s += Math.round(a / 9 / 255 * 9) }
        o[ch] = [Math.round(m.width * 100) / 100, s]
      }
      res[name + '|' + w] = o
    }
  }
  return res
}
