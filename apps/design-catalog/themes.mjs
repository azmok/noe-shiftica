export const fonts = {
  system: { label: 'システム＋日本語ゴシック', css: '-apple-system, BlinkMacSystemFont, "Hiragino Sans", Meiryo, system-ui, sans-serif' },
  rounded: { label: '丸みのあるゴシック', css: '"Avenir Next", "Segoe UI", "Hiragino Maru Gothic ProN", "Hiragino Sans", Meiryo, sans-serif' },
  gothic: { label: '日本語ゴシック', css: '"Noto Sans JP", "Yu Gothic", "Hiragino Sans", Meiryo, sans-serif' },
  swiss: { label: 'スイス・グロテスク', css: '"Helvetica Neue", Arial, "Hiragino Sans", "Noto Sans JP", "Yu Gothic", Meiryo, sans-serif' },
  serif: { label: '明朝', css: '"Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", serif' },
};

export const themes = {
  apple: {
    label: 'Apple Newsroom',
    source: 'https://www.apple.com/jp/newsroom/',
    rationale: '本文を細い幅でそろえ、見出しや画像には広い余白を取る。本文の密度を保ったまま写真の存在感を出せる。',
    tokens(width) {
      const large = width >= 1069;
      const medium = width >= 735;
      return {
        font: 'system', size: large ? 19 : 17, leading: large ? 1.368 : 1.353,
        tracking: large ? .012 : 0, weight: 400, rail: large ? 653 : 576,
        inset: medium ? 32 : 24, paragraph: large ? 26 : 23.26, media: large ? 44 : medium ? 36 : 32,
        title: large ? 48 : medium ? 40 : 32, titleLeading: large ? 55 : medium ? 47 : 39,
        titleWeight: 700, titleGap: 24,
        section: large ? 24 : 21, sectionLeading: large ? 30 : 26,
        sectionTracking: large ? .009 : .011, sectionWeight: 700, sectionBefore: 48, sectionAfter: 16,
      };
    },
  },
  airbnb: {
    label: 'Airbnb Newsroom',
    source: 'https://news.airbnb.com/ja/airbnb-2026-fallupdate',
    rationale: '大きめの行間と、太さを抑えた大きな見出しが特徴。段落と段落を詰めすぎず、見出しの前に余白を置くことで長文の区切りが分かる。',
    tokens(width) {
      const large = width >= 950;
      const medium = width >= 744;
      return {
        font: 'rounded', size: medium ? 18 : 16, leading: medium ? 1.556 : 1.5,
        tracking: 0, weight: 400, rail: width >= 1440 ? 632 : medium ? (width - 80) * 2 / 3 - 5.333 : 632,
        inset: medium ? 40 : 24, paragraph: 24, media: large ? 64 : medium ? 48 : 32,
        title: large ? 46 : medium ? 32 : 26, titleLeading: large ? 52 : medium ? 36 : 30,
        titleWeight: 500, titleGap: medium ? 24 : 16,
        section: large ? 32 : 26, sectionLeading: large ? 36 : 30,
        sectionTracking: 0, sectionWeight: 500, sectionBefore: 48, sectionAfter: large ? 28 : 24,
      };
    },
  },
};
