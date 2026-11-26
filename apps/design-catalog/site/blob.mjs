// 今のトップにある網目の球体を、依存なしの canvas で近づけたもの。
function sphere(depth) {
  const t = (1 + Math.sqrt(5)) / 2;
  const unit = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
  const points = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(unit);
  let faces = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  for (let i = 0; i < depth; i += 1) {
    const cache = new Map();
    const middle = (a, b) => {
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      if (!cache.has(key)) { cache.set(key, points.length); points.push(unit(points[a].map((x, k) => x + points[b][k]))); }
      return cache.get(key);
    };
    faces = faces.flatMap(([a, b, c]) => { const x = middle(a, b); const y = middle(b, c); const z = middle(c, a); return [[a, x, z], [b, y, x], [c, z, y], [x, y, z]]; });
  }
  const edges = new Set(faces.flatMap(([a, b, c]) => [[a, b], [b, c], [c, a]].map(([x, y]) => (x < y ? `${x}_${y}` : `${y}_${x}`))));
  return { points, edges: [...edges].map((e) => e.split('_').map(Number)) };
}

export function blob(canvas, { calm, light }) {
  const { points, edges } = sphere(4);
  const ctx = canvas.getContext('2d');
  let visible = true;
  function draw(time) {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * ratio)) { canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio); }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const s = time / 5200;
    const radius = Math.min(w, h) * .32;
    const [cy, sy, cx, sx] = [Math.cos(s * .6), Math.sin(s * .6), Math.cos(.5), Math.sin(.5)];
    const p = points.map(([x, y, z]) => {
      const k = radius * (1 + .17 * Math.sin(x * 2.6 + s * 2) + .14 * Math.sin(y * 3.1 - s * 1.7) + .1 * Math.sin(z * 4 + s * 1.3));
      const X = x * cy + z * sy;
      const Z = z * cy - x * sy;
      const Y = y * cx - Z * sx;
      const D = y * sx + Z * cx;
      return [w / 2 + X * k, h / 2 + Y * k, D];
    });
    const color = ctx.createLinearGradient(0, h * .1, 0, h * .9);
    for (const [at, value] of light ? [[0, '#0b93ab'], [.55, '#6b2da0'], [1, '#c03a6c']] : [[0, '#37d6e6'], [.5, '#b7d4ff'], [1, '#ffb3cb']]) color.addColorStop(at, value);
    ctx.strokeStyle = color;
    ctx.lineWidth = .7;
    for (const front of [false, true]) {
      ctx.globalAlpha = front ? .55 : .16;
      ctx.beginPath();
      for (const [a, b] of edges) {
        if ((p[a][2] + p[b][2] > 0) !== front) continue;
        ctx.moveTo(p[a][0], p[a][1]);
        ctx.lineTo(p[b][0], p[b][1]);
      }
      ctx.stroke();
    }
    if (!calm && visible) requestAnimationFrame(draw);
  }
  new IntersectionObserver(([entry]) => {
    const was = visible;
    visible = entry.isIntersecting;
    if (visible && !was && !calm) requestAnimationFrame(draw);
  }).observe(canvas);
  if (calm) addEventListener('resize', () => draw(9600));
  requestAnimationFrame(() => draw(calm ? 9600 : performance.now()));
}
