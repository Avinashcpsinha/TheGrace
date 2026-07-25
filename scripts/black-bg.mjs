/**
 * The Grace — studio-white → studio-black background keying.
 *
 * The customer's photo library ("public/New products") is shot on white / light
 * grey sweeps. The storefront is a black house, so every catalogue image is
 * keyed onto pure #000000 before it is written to public/images/products.
 *
 * How it works
 * ────────────
 * 1. Estimate the sweep colour from the median of the border ring.
 * 2. Flood-fill inward from the border, 4-connected. A neighbour joins the
 *    background when it is (a) within `localTol` of the pixel it grew from —
 *    this follows the smooth studio gradient without jumping a product edge —
 *    and (b) still within `globalTol` of the sweep colour overall.
 * 3. Sanity-check the mask. Cream products on cream sweeps (dress forms, wood,
 *    ivory boxes) can leak, so the tolerance ladder is walked from aggressive
 *    to conservative and the first mask that survives the check wins.
 * 4. Erode the keep-region by 1px and soften the alpha, then premultiply.
 *    Premultiplying against black is exactly "composite onto #000000", and it
 *    kills the white fringe the sweep leaves around the silhouette.
 *
 * Photos already shot on a dark background are passed through untouched.
 */
import sharp from "sharp";

/**
 * Tolerance ladder, tried in order; the first mask that passes the quality
 * gate wins.
 *
 * `local` is deliberately small: the studio sweeps are smooth, so a tight
 * step-to-step tolerance walks the whole gradient yet refuses to cross the
 * subject's outline. `global` is generous so deep corner falloff still keys.
 * Raising `local` to 16 was measurably destructive — it chewed holes in
 * polished medals and cup interiors.
 */
const LADDER = [
  { local: 8, global: 90 },
  { local: 12, global: 100 },
  { local: 5, global: 70 },
];

const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

/** median colour of the outermost ring — the sweep, in practice */
function borderReference(data, W, H) {
  const rs = [], gs = [], bs = [];
  const take = (x, y) => {
    const p = (y * W + x) * 3;
    rs.push(data[p]); gs.push(data[p + 1]); bs.push(data[p + 2]);
  };
  for (let x = 0; x < W; x++) { take(x, 0); take(x, H - 1); }
  for (let y = 1; y < H - 1; y++) { take(0, y); take(W - 1, y); }
  const mid = (a) => { a.sort((m, n) => m - n); return a[a.length >> 1]; };
  return [mid(rs), mid(gs), mid(bs)];
}

function floodMask(data, W, H, bg, localTol, globalTol) {
  const mask = new Uint8Array(W * H);
  const stack = new Int32Array(W * H);
  let top = 0;

  const farFromBg = (i) => {
    const p = i * 3;
    return Math.max(
      Math.abs(data[p] - bg[0]),
      Math.abs(data[p + 1] - bg[1]),
      Math.abs(data[p + 2] - bg[2])
    ) > globalTol;
  };
  const step = (from, to) => {
    if (mask[to] || farFromBg(to)) return;
    const a = from * 3, b = to * 3;
    const d = Math.max(
      Math.abs(data[a] - data[b]),
      Math.abs(data[a + 1] - data[b + 1]),
      Math.abs(data[a + 2] - data[b + 2])
    );
    if (d > localTol) return;
    mask[to] = 1;
    stack[top++] = to;
  };
  const seed = (i) => {
    if (mask[i] || farFromBg(i)) return;
    mask[i] = 1;
    stack[top++] = i;
  };

  for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }

  while (top > 0) {
    const i = stack[--top];
    const x = i % W;
    if (x > 0) step(i, i - 1);
    if (x < W - 1) step(i, i + 1);
    if (i >= W) step(i, i - W);
    if (i < (H - 1) * W) step(i, i + W);
  }
  return mask;
}

/**
 * Mask quality metrics.
 *
 * `frac`     — share of the frame keyed away.
 * `enclosed` — share of the frame that was keyed away *while boxed in by
 *              product on all four sides*. A clean sweep barely registers
 *              (only genuine gaps, like the space inside a cup handle); a leak
 *              into a white bottle or a cream dress form hollows out the
 *              subject and spikes this number. It is the reliable tell for
 *              "the key ate the product".
 */
function maskMetrics(mask, W, H) {
  let total = 0;
  for (let i = 0; i < mask.length; i++) if (mask[i]) total++;

  const left = new Uint8Array(W * H);
  const right = new Uint8Array(W * H);
  const up = new Uint8Array(W * H);
  const down = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    let seen = 0;
    for (let x = 0; x < W; x++) { const i = y * W + x; left[i] = seen; if (!mask[i]) seen = 1; }
    seen = 0;
    for (let x = W - 1; x >= 0; x--) { const i = y * W + x; right[i] = seen; if (!mask[i]) seen = 1; }
  }
  for (let x = 0; x < W; x++) {
    let seen = 0;
    for (let y = 0; y < H; y++) { const i = y * W + x; up[i] = seen; if (!mask[i]) seen = 1; }
    seen = 0;
    for (let y = H - 1; y >= 0; y--) { const i = y * W + x; down[i] = seen; if (!mask[i]) seen = 1; }
  }
  let enclosed = 0;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] && left[i] && right[i] && up[i] && down[i]) enclosed++;
  }
  return { frac: total / (W * H), enclosed: enclosed / (W * H) };
}

/**
 * Drop retained specks — isolated sweep crumbs the flood fill could not reach
 * (JPEG mosquito noise around the silhouette). Anything smaller than
 * `minArea` and not part of the subject's body is folded into the background.
 */
function despeckle(mask, W, H, minArea) {
  const seen = new Uint8Array(W * H);
  const stack = new Int32Array(W * H);
  const blob = new Int32Array(W * H);
  for (let start = 0; start < mask.length; start++) {
    if (mask[start] || seen[start]) continue;
    let top = 0, n = 0;
    seen[start] = 1;
    stack[top++] = start;
    while (top > 0) {
      const i = stack[--top];
      blob[n++] = i;
      const x = i % W;
      if (x > 0 && !mask[i - 1] && !seen[i - 1]) { seen[i - 1] = 1; stack[top++] = i - 1; }
      if (x < W - 1 && !mask[i + 1] && !seen[i + 1]) { seen[i + 1] = 1; stack[top++] = i + 1; }
      if (i >= W && !mask[i - W] && !seen[i - W]) { seen[i - W] = 1; stack[top++] = i - W; }
      if (i < (H - 1) * W && !mask[i + W] && !seen[i + W]) { seen[i + W] = 1; stack[top++] = i + W; }
    }
    if (n < minArea) for (let k = 0; k < n; k++) mask[blob[k]] = 1;
  }
}

/** 1px erosion of the keep-region, then two 3×3 box blurs → soft alpha */
function softAlpha(mask, W, H) {
  const a = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (mask[i]) continue;
      const bgAdjacent =
        (x > 0 && mask[i - 1]) ||
        (x < W - 1 && mask[i + 1]) ||
        (y > 0 && mask[i - W]) ||
        (y < H - 1 && mask[i + W]);
      a[i] = bgAdjacent ? 0 : 255;
    }
  }
  const tmp = new Uint8Array(W * H);
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const l = x > 0 ? a[i - 1] : a[i];
        const r = x < W - 1 ? a[i + 1] : a[i];
        tmp[i] = (l + a[i] + r) / 3;
      }
    }
    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) {
        const i = y * W + x;
        const u = y > 0 ? tmp[i - W] : tmp[i];
        const d = y < H - 1 ? tmp[i + W] : tmp[i];
        a[i] = (u + tmp[i] + d) / 3;
      }
    }
  }
  return a;
}

/**
 * Catastrophe guard only. `enclosed` cannot separate a leak from a subject
 * with genuine holes (hanging medals, an open frame) — measured overlap is
 * total — so it is set where only a collapsed silhouette trips it.
 */
const ENCLOSED_MAX = 0.3;

async function prepare(buf, maxWidth, maxHeight) {
  const { data, info } = await sharp(buf, { failOn: "none" })
    .rotate()
    .resize({ width: maxWidth, height: maxHeight, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" }) // transparent PNGs: key the white, same path
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, W: info.width, H: info.height, bg: borderReference(data, info.width, info.height) };
}

/** Diagnostic: metrics for one tolerance, no pixels touched. Used by scripts/_keytest*. */
export async function maskReport(buf, { maxWidth = 700, maxHeight = 900, forceTol = LADDER[0] } = {}) {
  const { data, W, H, bg } = await prepare(buf, maxWidth, maxHeight);
  const mask = floodMask(data, W, H, bg, forceTol.local, forceTol.global);
  return maskMetrics(mask, W, H);
}

/**
 * Key `buf` onto black and return a raw RGB buffer plus a report.
 *
 * `status` is one of:
 *   "keyed"       — sweep removed, subject intact
 *   "already-dark"— shot on a dark background already, passed through
 *   "rejected"    — every tolerance hollowed out the subject; caller should
 *                   drop this photo rather than publish a damaged cut-out
 */
export async function keyOntoBlack(buf, { maxWidth = 1200, maxHeight = 1500, forceTol = null } = {}) {
  const { data, W, H, bg } = await prepare(buf, maxWidth, maxHeight);

  // already a dark-sweep shot — nothing to key, it is already on black
  if (luma(bg[0], bg[1], bg[2]) < 70) {
    return { data, width: W, height: H, status: "already-dark", tol: null, frac: 0, enclosed: 0 };
  }

  let best = null;
  let last = { frac: 0, enclosed: 0 };
  for (const tol of forceTol ? [forceTol] : LADDER) {
    const mask = floodMask(data, W, H, bg, tol.local, tol.global);
    const m = maskMetrics(mask, W, H);
    last = m;
    const ok = forceTol
      ? true
      : m.frac > 0.03 && m.frac < 0.985 && m.enclosed <= ENCLOSED_MAX;
    if (ok) { best = { mask, tol, ...m }; break; }
  }
  if (!best) {
    return { data, width: W, height: H, status: "rejected", tol: null, ...last };
  }

  despeckle(best.mask, W, H, Math.max(48, Math.round(W * H * 0.00012)));
  const alpha = softAlpha(best.mask, W, H);
  for (let i = 0; i < W * H; i++) {
    const a = alpha[i];
    if (a === 255) continue;
    const p = i * 3;
    data[p] = (data[p] * a) / 255;
    data[p + 1] = (data[p + 1] * a) / 255;
    data[p + 2] = (data[p + 2] * a) / 255;
  }
  return {
    data,
    width: W,
    height: H,
    status: "keyed",
    tol: best.tol,
    frac: best.frac,
    enclosed: best.enclosed,
  };
}

/** sharp pipeline over a keyed raw RGB buffer, always flattened onto #000000 */
export function fromKeyed(keyed) {
  return sharp(keyed.data, {
    raw: { width: keyed.width, height: keyed.height, channels: 3 },
  }).flatten({ background: "#000000" });
}
