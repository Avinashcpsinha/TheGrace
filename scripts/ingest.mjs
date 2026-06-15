/**
 * The Grace — catalog ingestion pipeline
 * ──────────────────────────────────────
 * Scans the raw photo library in ./Images, and produces:
 *   • public/images/products/<category>/<slug>.webp        (main, ≤1200px)
 *   • public/images/products/<category>/<slug>-thumb.webp  (thumb, ≤480px)
 *   • src/data/products.json   (full seeded catalog)
 *   • src/data/categories.json (category tree with counts)
 *   • src/data/hero.json       (curated hero/featured picks)
 *
 * Deterministic: same input → same names, prices and picks (hash-seeded).
 * Re-run any time with `npm run ingest`.
 */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const ROOT = path.resolve(process.cwd());
const SRC = path.join(ROOT, "Images");
const OUT_IMG = path.join(ROOT, "public", "images", "products");
const OUT_SITE = path.join(ROOT, "public", "images", "site");
const OUT_DATA = path.join(ROOT, "src", "data");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

/** Category definitions — folder name → catalog category */
const CATEGORIES = [
  {
    folder: "Trophies",
    slug: "trophies",
    name: "Trophies",
    blurb: "Cups, columns and sculptural awards in metal, crystal, acrylic and wood.",
    cap: 60,
    priceRange: [1499, 12999],
    premiumShare: 0.45,
  },
  {
    folder: "Medals",
    slug: "medals",
    name: "Medals",
    blurb: "Die-struck medals with custom ribbons, in gold, silver and bronze finishes.",
    cap: 40,
    priceRange: [99, 449],
    premiumShare: 0.1,
  },
  {
    folder: "Momentos",
    slug: "mementos",
    name: "Mementos",
    blurb: "Personalised keepsakes engraved for farewells, felicitations and milestones.",
    cap: 40,
    priceRange: [399, 2999],
    premiumShare: 0.2,
  },
  {
    folder: "Merchandise",
    slug: "merchandise",
    name: "Merchandise",
    blurb: "Branded merchandise — desk pieces, drinkware, keychains and lapel pins.",
    cap: 48,
    priceRange: [149, 2499],
    premiumShare: 0.12,
  },
  {
    folder: "Gifting",
    slug: "gifting",
    name: "Corporate Gifting",
    blurb: "Executive gift sets, hampers and travel gear for clients and teams.",
    cap: 48,
    priceRange: [499, 5999],
    premiumShare: 0.3,
  },
  {
    folder: "Sports",
    slug: "sports",
    name: "Sports Awards",
    blurb: "Tournament cups, player-of-the-match awards and league season trophies.",
    cap: 44,
    priceRange: [599, 4999],
    premiumShare: 0.3,
  },
  {
    folder: "Khelo india",
    slug: "khelo-india",
    name: "Khelo India Legacy",
    blurb: "From our workshop to the national podium — official Khelo India Games awards.",
    cap: 36,
    priceRange: [1999, 14999],
    premiumShare: 0.85,
  },
];

/* ── deterministic helpers ─────────────────────────────────────────── */
const md5 = (b) => crypto.createHash("md5").update(b).digest("hex");
const hashInt = (s) => parseInt(md5(Buffer.from(s)).slice(0, 8), 16);
const pick = (arr, seed) => arr[hashInt(seed) % arr.length];

function indianPrice(seed, [min, max]) {
  const raw = min + (hashInt(seed) % (max - min));
  return Math.max(99, Math.round(raw / 50) * 50 - 1); // ₹X49 / ₹X99 endings
}

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

/* ── naming ────────────────────────────────────────────────────────── */
const ADJ = [
  "Aurelius", "Sovereign", "Zenith", "Imperial", "Eminence", "Regal",
  "Luminous", "Triumph", "Pinnacle", "Stellar", "Majestic", "Radiant",
  "Celestial", "Monarch", "Vanguard", "Gilded", "Royale", "Astral",
  "Paramount", "Etherea", "Solstice", "Crowned", "Halcyon", "Velvetine",
];
const TROPHY_NOUN = [
  "Cup", "Crest", "Star", "Flame", "Column", "Wing", "Orb", "Spire",
  "Laurel", "Summit", "Wave", "Pillar", "Beacon", "Halo", "Ascent",
  "Glory", "Tribute", "Legacy", "Crown", "Meridian",
];
const SPORT_NOUN = [
  "Champions Cup", "Victory Trophy", "League Cup", "Podium Award",
  "Tournament Trophy", "Finals Cup", "Season Trophy", "Player Award",
  "Match Trophy", "Sprint Award", "Strike Trophy", "Rally Cup",
];
const GIFT_NOUN = [
  "Gift Set", "Hamper", "Keepsake", "Desk Set", "Travel Kit",
  "Executive Set", "Welcome Kit", "Celebration Box", "Signature Set",
];
const MERCH_NOUN = [
  "Desk Piece", "Keepsake", "Accessory", "Collectible", "Companion",
  "Essential", "Classic", "Edition",
];
const MEDAL_NOUN = ["Medal", "Medal Set", "Medallion", "Honour Medal"];
const KHELO_NOUN = [
  "Championship Cup", "Winner Trophy", "Games Trophy", "Victory Cup",
  "Podium Trophy", "Games Medal", "University Games Cup", "Finals Trophy",
];
const ROMAN = ["", " II", " III", " IV", " V", " VI", " VII", " VIII", " IX", " X"];

/** is the filename meaningful (human-written) or machine noise? */
function isMeaningfulName(base) {
  if (/^whatsapp image/i.test(base)) return false;
  if (/^pro-shot-/i.test(base)) return false;
  if (/^product beautifier-/i.test(base)) return false;
  if (/^img[-_]/i.test(base)) return false;
  if (/^[A-Z]{4}\d{4}$/.test(base)) return false; // camera codes: ADRW7989
  if (/^\d[\d_]+$/.test(base.replace(/\s/g, ""))) return false;
  if (base.length > 70) return false; // AI-prompt filenames
  return true;
}

function prettifyName(base, categorySlug) {
  let s = base
    .replace(/\(\d+\)/g, " ")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  s = s.replace(/\b\w/g, (c) => c.toUpperCase());
  // domain touch-ups
  s = s
    .replace(/\bKhelo India\b/gi, "Khelo India")
    .replace(/\bUltrafit\b/gi, "UltraFit")
    .replace(/\b(\d+)l\b/gi, "$1L");
  if (categorySlug === "trophies" && !/trophy|cup|award/i.test(s)) s += " Trophy";
  if (categorySlug === "medals" && !/medal/i.test(s)) s += " Medal";
  return s;
}

function generatedName(categorySlug, seed) {
  switch (categorySlug) {
    case "trophies": {
      const noun = pick(TROPHY_NOUN, seed + "n");
      const suffix = noun === "Cup" || noun === "Crown" ? "" : " Trophy";
      return `${pick(ADJ, seed + "a")} ${noun}${suffix}`;
    }
    case "medals":
      return `${pick(ADJ, seed + "a")} ${pick(MEDAL_NOUN, seed + "n")}`;
    case "sports":
      return `${pick(ADJ, seed + "a")} ${pick(SPORT_NOUN, seed + "n")}`;
    case "gifting":
      return `${pick(ADJ, seed + "a")} ${pick(GIFT_NOUN, seed + "n")}`;
    case "merchandise":
      return `${pick(ADJ, seed + "a")} ${pick(MERCH_NOUN, seed + "n")}`;
    case "khelo-india":
      return `Khelo India ${pick(KHELO_NOUN, seed + "n")}`;
    default:
      return `${pick(ADJ, seed + "a")} Keepsake`;
  }
}

/* ── subcategory inference (trophies & others) ─────────────────────── */
function inferSubcategory(categorySlug, base) {
  const b = base.toLowerCase();
  if (categorySlug === "trophies") {
    if (/acrylic/.test(b)) return "acrylic";
    if (/crystal|glass/.test(b)) return "crystal";
    if (/metal|brass|steel|gear/.test(b)) return "metal";
    if (/wood|wooden/.test(b)) return "wooden";
    if (/resin|raisin|fiber/.test(b)) return "resin";
    return "designer";
  }
  if (categorySlug === "sports") {
    if (/cricket/.test(b)) return "cricket";
    if (/football|soccer/.test(b)) return "football";
    return "tournament";
  }
  if (categorySlug === "merchandise") {
    if (/pin|badge/.test(b)) return "lapel-pins";
    if (/key/.test(b)) return "keychains";
    if (/bottle|coaster|clock|table|desk|chess|passport|holder/.test(b)) return "desk-and-decor";
    return "branded";
  }
  if (categorySlug === "gifting") {
    if (/bag|redlemon|red lemon|arctic|hunter|\d+l/.test(b)) return "travel-gear";
    if (/box|hamper|giftbox/.test(b)) return "gift-sets";
    return "executive";
  }
  if (categorySlug === "medals") return "medals";
  if (categorySlug === "khelo-india") return /medal/.test(b) ? "medals" : "cups";
  return undefined;
}

const SUBCAT_LABELS = {
  acrylic: "Acrylic Trophies",
  crystal: "Crystal Trophies",
  metal: "Metal Trophies",
  wooden: "Wooden Trophies",
  resin: "Resin Trophies",
  designer: "Designer Trophies",
  cricket: "Cricket",
  football: "Football",
  tournament: "Tournament",
  "lapel-pins": "Lapel Pins & Badges",
  keychains: "Keychains",
  "desk-and-decor": "Desk & Décor",
  branded: "Branded Goods",
  "travel-gear": "Travel Gear",
  "gift-sets": "Gift Sets",
  executive: "Executive Gifts",
  medals: "Medals",
  cups: "Cups & Trophies",
};

const MATERIALS = {
  acrylic: ["Premium acrylic", "UV-printed face"],
  crystal: ["Optical crystal", "Etched glass"],
  metal: ["Die-cast metal", "24K gold electroplating"],
  wooden: ["Seasoned hardwood", "Brushed metal plate"],
  resin: ["Hand-cast resin", "Antique gold finish"],
  designer: ["Mixed media", "Gold-tone finish"],
  default: ["Premium materials", "Gold-tone finish"],
};

const OCCASIONS = [
  "Corporate", "Sports", "Academic", "Felicitation", "Government", "Social",
];

function buildDescription(name, category, subcat, premium) {
  const material = (MATERIALS[subcat] || MATERIALS.default)[0].toLowerCase();
  const lines = {
    trophies: `${name} is hand-finished in our Lajpat Nagar workshop from ${material}, balanced on a weighted base and polished to a mirror sheen. Engraving of names, logos and event details is included.`,
    medals: `${name} is die-struck with crisp relief detail and paired with a custom-woven ribbon. Available in gold, silver and bronze finishes with free engraving on the reverse.`,
    mementos: `${name} is a personalised keepsake, engraved to order for farewells, felicitations and milestone celebrations.`,
    merchandise: `${name} carries your branding with precision — laser engraving or UV printing, packed in a gift-ready box.`,
    gifting: `${name} is curated for corporate gifting: premium build, elegant packaging and full branding customisation for bulk orders.`,
    sports: `${name} is built for the podium — tournament-grade construction with club crests, fixtures and player names engraved to order.`,
    "khelo-india": `${name} comes from the same workshop that crafted official awards for the Khelo India Games — national-podium quality, now available for your event.`,
  };
  const base = lines[category] || lines.trophies;
  return premium
    ? `${base} Part of our Premium Collection: individually inspected, numbered and delivered in a velvet-lined presentation case.`
    : base;
}

/* ── scanning ──────────────────────────────────────────────────────── */
async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function collectCategory(cat) {
  const dir = path.join(SRC, cat.folder);
  const files = [];
  try {
    for await (const f of walk(dir)) {
      if (IMAGE_EXT.has(path.extname(f).toLowerCase())) files.push(f);
    }
  } catch {
    return [];
  }
  // dedupe by content hash, deterministic order
  files.sort();
  const seen = new Set();
  const unique = [];
  for (const f of files) {
    const buf = await fs.readFile(f);
    const h = md5(buf);
    if (seen.has(h)) continue;
    seen.add(h);
    const base = path.basename(f, path.extname(f));
    unique.push({ file: f, buf, hash: h, base, meaningful: isMeaningfulName(base) });
  }
  // meaningful names first, then fill with generated up to cap
  const named = unique.filter((u) => u.meaningful);
  const unnamed = unique.filter((u) => !u.meaningful);
  // spread unnamed picks across the whole set rather than taking the first N
  const room = Math.max(0, cat.cap - named.length);
  const step = unnamed.length > room && room > 0 ? unnamed.length / room : 1;
  const filled = [];
  for (let i = 0; i < unnamed.length && filled.length < room; i += step) {
    filled.push(unnamed[Math.floor(i)]);
  }
  const chosen = [...named, ...filled];
  return { chosen, dropped: unique.length - chosen.length, total: unique.length };
}

/* ── image rendering ───────────────────────────────────────────────── */
async function renderImages(buf, outDir, slug) {
  await fs.mkdir(outDir, { recursive: true });
  const img = sharp(buf, { failOn: "none" }).rotate();
  const meta = await img.metadata();

  const main = await img
    .clone()
    .resize({ width: 1200, height: 1500, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true });
  await fs.writeFile(path.join(outDir, `${slug}.webp`), main.data);

  const thumb = await img
    .clone()
    .resize({ width: 480, height: 600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 72 })
    .toBuffer();
  await fs.writeFile(path.join(outDir, `${slug}-thumb.webp`), thumb);

  const blurBuf = await img.clone().resize(16).webp({ quality: 40 }).toBuffer();
  const blur = `data:image/webp;base64,${blurBuf.toString("base64")}`;

  let dominant = "#1a1610";
  try {
    const stats = await sharp(buf).stats();
    const { r, g, b } = stats.dominant;
    dominant = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  } catch {}

  return {
    width: main.info.width,
    height: main.info.height,
    blur,
    dominant,
    isStudio: meta.width && meta.height ? false : false,
  };
}

/* ── main ──────────────────────────────────────────────────────────── */
async function main() {
  console.log("The Grace — ingesting photo library…\n");
  await fs.rm(OUT_IMG, { recursive: true, force: true });
  await fs.mkdir(OUT_DATA, { recursive: true });
  await fs.mkdir(OUT_SITE, { recursive: true });

  const products = [];
  const categoriesOut = [];
  const usedSlugs = new Set();
  const usedNamesPerCat = new Map();

  for (const cat of CATEGORIES) {
    const res = await collectCategory(cat);
    const chosen = res.chosen || [];
    const subcounts = {};
    let done = 0;

    // simple promise pool, concurrency 8
    const queue = [...chosen];
    const workers = Array.from({ length: 8 }, async () => {
      while (queue.length) {
        const item = queue.shift();
        if (!item) break;
        const seed = item.hash;
        const subcat = inferSubcategory(cat.slug, item.base);

        // name (unique within category)
        const names = usedNamesPerCat.get(cat.slug) || new Map();
        usedNamesPerCat.set(cat.slug, names);
        let name = item.meaningful
          ? prettifyName(item.base, cat.slug)
          : generatedName(cat.slug, seed);
        const tally = names.get(name) || 0;
        names.set(name, tally + 1);
        if (tally > 0) name += ROMAN[Math.min(tally, ROMAN.length - 1)];

        let slug = `${slugify(name)}-${seed.slice(0, 4)}`;
        while (usedSlugs.has(slug)) slug += "x";
        usedSlugs.add(slug);

        const outDir = path.join(OUT_IMG, cat.slug);
        let rendered;
        try {
          rendered = await renderImages(item.buf, outDir, slug);
        } catch (e) {
          console.warn(`  ! skip ${item.base}: ${e.message}`);
          continue;
        }

        const premium =
          subcat === "crystal" || subcat === "metal" || subcat === "wooden"
            ? true
            : (hashInt(seed + "p") % 100) / 100 < cat.premiumShare;
        const price = indianPrice(
          seed + "price",
          premium
            ? [Math.round((cat.priceRange[0] + cat.priceRange[1]) / 2), cat.priceRange[1]]
            : [cat.priceRange[0], Math.round((cat.priceRange[0] + cat.priceRange[1]) / 1.8)]
        );
        const hasCompare = hashInt(seed + "c") % 100 < 22;
        const compareAtPrice = hasCompare
          ? Math.round((price * (115 + (hashInt(seed + "cc") % 20))) / 100 / 50) * 50 - 1
          : undefined;

        const occasions = [
          pick(OCCASIONS, seed + "o1"),
          pick(OCCASIONS.filter((o) => o !== pick(OCCASIONS, seed + "o1")), seed + "o2"),
        ];
        if (cat.slug === "sports" || cat.slug === "khelo-india") occasions[0] = "Sports";

        const sizes =
          cat.slug === "trophies" || cat.slug === "sports" || cat.slug === "khelo-india"
            ? [
                { label: '12"', priceDelta: 0 },
                { label: '15"', priceDelta: Math.round(price * 0.18 / 10) * 10 },
                { label: '18"', priceDelta: Math.round(price * 0.38 / 10) * 10 },
              ]
            : cat.slug === "medals"
              ? [
                  { label: "50 mm", priceDelta: 0 },
                  { label: "60 mm", priceDelta: 30 },
                  { label: "70 mm", priceDelta: 60 },
                ]
              : [{ label: "Standard", priceDelta: 0 }];

        if (subcat) subcounts[subcat] = (subcounts[subcat] || 0) + 1;

        products.push({
          id: seed.slice(0, 12),
          sku: `TG-${cat.slug.slice(0, 3).toUpperCase()}-${seed.slice(0, 6).toUpperCase()}`,
          slug,
          name,
          category: cat.slug,
          subcategory: subcat,
          price,
          compareAtPrice,
          premium,
          images: [
            {
              src: `/images/products/${cat.slug}/${slug}.webp`,
              thumb: `/images/products/${cat.slug}/${slug}-thumb.webp`,
              blur: rendered.blur,
              width: rendered.width,
              height: rendered.height,
              dominant: rendered.dominant,
            },
          ],
          description: buildDescription(name, cat.slug, subcat, premium),
          materials: MATERIALS[subcat] || MATERIALS.default,
          sizes,
          occasions: [...new Set(occasions)],
          customizable: true,
          inStock: hashInt(seed + "s") % 100 > 4, // ~95% in stock
          curated: item.meaningful || /^pro-shot|^product beautifier/i.test(item.base),
          sourcePath: path.relative(ROOT, item.file).replace(/\\/g, "/"),
        });
        done++;
      }
    });
    await Promise.all(workers);

    categoriesOut.push({
      slug: cat.slug,
      name: cat.name,
      blurb: cat.blurb,
      count: done,
      droppedDuplicatesOrOverCap: res.dropped ?? 0,
      libraryTotal: res.total ?? 0,
      subcategories: Object.entries(subcounts)
        .sort((a, b) => b[1] - a[1])
        .map(([slug, count]) => ({ slug, name: SUBCAT_LABELS[slug] || slug, count })),
    });
    console.log(
      `  ✓ ${cat.name.padEnd(20)} ${String(done).padStart(3)} products` +
        (res.total ? ` (from ${res.total} unique photos)` : " (empty folder — custom-order category)")
    );
  }

  // deterministic ordering: curated first within category, then by id
  products.sort((a, b) =>
    a.category === b.category
      ? Number(b.curated) - Number(a.curated) || a.id.localeCompare(b.id)
      : a.category.localeCompare(b.category)
  );

  // featured picks: curated, spread across categories
  const featured = [];
  for (const cat of CATEGORIES) {
    const top = products.filter((p) => p.category === cat.slug && p.curated && p.inStock);
    featured.push(...top.slice(0, 3).map((p) => p.slug));
  }
  for (const p of products) p.featured = featured.includes(p.slug);

  // hero candidates: studio-style trophy shots
  const heroCandidates = products
    .filter(
      (p) =>
        (p.category === "trophies" || p.category === "khelo-india" || p.category === "sports") &&
        /pro-shot|product beautifier/i.test(p.sourcePath)
    )
    .slice(0, 12)
    .map((p) => ({ slug: p.slug, name: p.name, src: p.images[0].src, source: p.sourcePath }));

  await fs.writeFile(path.join(OUT_DATA, "products.json"), JSON.stringify(products, null, 1));
  await fs.writeFile(path.join(OUT_DATA, "categories.json"), JSON.stringify(categoriesOut, null, 1));
  await fs.writeFile(
    path.join(OUT_DATA, "hero.json"),
    JSON.stringify({ candidates: heroCandidates, chosen: heroCandidates[0]?.slug ?? null }, null, 1)
  );

  const premiumCount = products.filter((p) => p.premium).length;
  console.log(`\nDone: ${products.length} products (${premiumCount} premium / ${products.length - premiumCount} standard)`);
  console.log(`Hero candidates: ${heroCandidates.length} → src/data/hero.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
