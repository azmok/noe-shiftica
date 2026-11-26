// 参照サイトを実際に表示して測った値（2026-11-26、Windows Chromium、1440 / 820 / 390）。
// 根拠と測り方は docs/design-catalog/reproduction-guide.md。
export const fonts = {
  apple: { label: 'Inter＋Noto Sans JP（詰め組み）', css: '"Cat Inter", "Cat Noto Tight", "Segoe UI", "Segoe UI Symbol", "Segoe UI Historic", sans-serif', features: '"palt"' },
  airbnb: { label: 'Figtree＋Noto Sans JP', css: '"Cat Figtree", "Cat Noto", "Segoe UI", "Segoe UI Symbol", "Segoe UI Historic", sans-serif', features: 'normal' },
  webflow: { label: 'Lexend＋Noto Sans JP', css: '"Cat Lexend", "Cat Noto", "Segoe UI", "Segoe UI Symbol", "Segoe UI Historic", sans-serif', features: 'normal' },
  neutral: { label: 'Inter＋Noto Sans JP（等倍）', css: '"Cat Inter", "Cat Noto", "Segoe UI", "Segoe UI Symbol", "Segoe UI Historic", sans-serif', features: 'normal' },
};

// Webflow は 390px と 1440px の値の間を、画面幅に比例して動く
const fluid = (width, min, max) => Math.round((min + (Math.min(1440, Math.max(390, width)) - 390) * (max - min) / 1050) * 100) / 100;

export const themes = {
  apple: {
    label: 'Apple Newsroom',
    source: 'https://www.apple.com/jp/newsroom/',
    rationale: '日本語の字幅が通常の約86%で、句読点とカナも詰まる。細い本文の列と980pxの画像の差が、静かな本文と大きな写真を両立させている。',
    size: (width) => (width >= 1069 ? 'l' : width >= 735 ? 'm' : 's'),
    tokens(width) {
      const large = width >= 1069;
      const medium = width >= 735;
      return {
        font: 'apple', size: large ? 19 : 17, leading: large ? 1.3684 : 1.3529,
        tracking: large ? .004 : -.008, weight: 400, rail: large ? 653 : 576,
        inset: medium ? 32 : 24, paragraph: large ? 26 : 23.26, media: large ? 44 : medium ? 36 : 32,
        title: large ? 48 : medium ? 40 : 32, titleLeading: large ? 55 : medium ? 47 : 39,
        titleWeight: 760, titleTracking: .012, titleGap: large ? 20 : 16,
        section: large ? 24 : 21, sectionLeading: large ? 30 : 26,
        sectionTracking: large ? .005 : .007, sectionWeight: 740, sectionBefore: large ? 44 : 36, sectionAfter: 16,
      };
    },
  },
  airbnb: {
    label: 'Airbnb Newsroom',
    source: 'https://news.airbnb.com/ja/airbnb-2026-fallupdate',
    rationale: '日本語は等倍、行間は約1.56倍。見出しの前の48pxと、16〜24pxの大きな角丸、22pxのリード文が、ゆったりした印象を作っている。',
    size: (width) => (width >= 950 ? 'l' : width >= 744 ? 'm' : 's'),
    tokens(width) {
      const large = width >= 950;
      const medium = width >= 744;
      return {
        font: 'airbnb', size: medium ? 18 : 16, leading: medium ? 1.5556 : 1.5,
        tracking: 0, weight: 400, rail: width >= 1128 ? 624.5 : medium ? Math.round((width - 80) * 2 / 3 - 5.33) : 624.5,
        inset: large ? 80 : medium ? 40 : 24, paragraph: 24, media: large ? 64 : medium ? 48 : 32,
        title: large ? 46 : medium ? 32 : 26, titleLeading: large ? 52 : medium ? 36 : 30,
        titleWeight: 500, titleTracking: 0, titleGap: medium ? 24 : 16,
        section: large ? 32 : 26, sectionLeading: large ? 36 : 30,
        sectionTracking: 0, sectionWeight: 700, sectionBefore: 48, sectionAfter: large ? 28 : 24,
      };
    },
  },
  webflow: {
    label: 'Webflow Blog',
    source: 'https://webflow.com/blog/how-ai-will-transform-design-systems',
    rationale: '題名と画像を左右に割り、56pxの詰まった題名、32pxの書き出し、16pxの本文と、大きさの差を思い切りつける。寸法は画面幅に比例して動き、色は黒と青だけ。',
    size: (width) => (width >= 992 ? 'l' : width >= 480 ? 'm' : 's'),
    tokens(width) {
      const title = fluid(width, 33.5, 56);
      const section = fluid(width, 28.75, 40);
      return {
        font: 'webflow', size: 16, leading: 1.6, tracking: 0, weight: 400,
        rail: width >= 992 ? Math.round(width * .5156) : 900, inset: width >= 992 ? Math.round(width * .05) : width >= 480 ? Math.round(width * .04) : 15,
        paragraph: fluid(width, 10.38, 16), media: fluid(width, 36.75, 48),
        title, titleLeading: title * 1.04, titleWeight: 600, titleTracking: -.035, titleGap: fluid(width, 20.25, 24),
        section, sectionLeading: section * 1.2, sectionTracking: -.01, sectionWeight: 500,
        sectionBefore: fluid(width, 50, 80), sectionAfter: fluid(width, 10.38, 16),
        lede: fluid(width, 22.63, 32),
      };
    },
  },
};
