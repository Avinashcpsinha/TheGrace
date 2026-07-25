/**
 * The Grace — catalog ingestion pipeline
 * ──────────────────────────────────────
 * Scans the customer's photo library in ./public/New products, and produces:
 *   • public/images/products/<category>/<slug>.webp        (main, ≤1200px)
 *   • public/images/products/<category>/<slug>-thumb.webp  (thumb, ≤480px)
 *   • src/data/products.json   (full seeded catalog)
 *   • src/data/categories.json (category tree with counts — drives the nav dropdown)
 *   • src/data/hero.json       (curated hero/featured picks)
 *
 * Photos are published with the background they were shot on — the studio
 * sweep in the customer's image is preserved exactly, and each product records
 * that sweep's colour so the card behind it can be painted to match.
 *
 * The six category folders are the single source of truth: the header
 * dropdown, the mobile menu, the homepage bento and /category/<slug> all read
 * categories.json, so adding or renaming a folder here is the only edit
 * needed to change the site's navigation.
 *
 * Deterministic: same input → same names, prices and picks (hash-seeded).
 * Re-run any time with `npm run ingest`.
 */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const ROOT = path.resolve(process.cwd());
const SRC = path.join(ROOT, "public", "New products");
const OUT_IMG = path.join(ROOT, "public", "images", "products");
const OUT_SITE = path.join(ROOT, "public", "images", "site");
const OUT_DATA = path.join(ROOT, "src", "data");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

/**
 * Category definitions — folder name under "New products" → catalog category.
 * Order matters twice over: the homepage CategoryShowcase renders the first
 * two as the large bento tiles (so the two image-richest collections lead),
 * and the header dropdown lists them in this order.
 */
const CATEGORIES = [
  {
    folder: "Trophies",
    slug: "trophies",
    name: "Trophies",
    blurb: "Cups, columns and sculptural awards in metal, crystal, acrylic and wood.",
    priceRange: [1499, 12999],
    premiumShare: 0.45,
  },
  {
    folder: "Merchandise",
    slug: "merchandise",
    name: "Merchandise",
    blurb: "Branded merchandise — desk pieces, drinkware, keychains, bags and lapel pins.",
    priceRange: [149, 2499],
    premiumShare: 0.12,
  },
  {
    folder: "Gifting",
    slug: "gifting",
    name: "Corporate Gifting",
    blurb: "Curated gift boxes, hampers and welcome kits — presentation-packed and branded to your house style.",
    priceRange: [499, 7999],
    premiumShare: 0.35,
  },
  {
    folder: "Medals",
    slug: "medals",
    name: "Medals",
    blurb: "Die-struck medals with custom-woven ribbons, in gold, silver and bronze finishes.",
    priceRange: [99, 449],
    premiumShare: 0.1,
  },
  {
    folder: "Momentos",
    slug: "mementos",
    name: "Mementos",
    blurb: "Commemorative keepsakes and souvenirs — the piece that outlives the occasion.",
    priceRange: [899, 5999],
    premiumShare: 0.3,
  },
  {
    folder: "Sports",
    slug: "sports",
    name: "Sports Awards",
    blurb: "Podium pieces for leagues, tournaments and sports days — built for a full season of silverware.",
    priceRange: [999, 8999],
    premiumShare: 0.25,
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
  "Lumina", "Cavalier", "Meridian", "Obsidian", "Aurora", "Empyrean",
];
const TROPHY_NOUN = [
  "Cup", "Crest", "Star", "Flame", "Column", "Wing", "Orb", "Spire",
  "Laurel", "Summit", "Wave", "Pillar", "Beacon", "Halo", "Ascent",
  "Glory", "Tribute", "Legacy", "Crown", "Meridian", "Obelisk", "Chalice",
  "Sceptre", "Zenith", "Accolade", "Emblem",
];
const MERCH_NOUN = [
  "Desk Piece", "Keepsake", "Accessory", "Collectible", "Companion",
  "Essential", "Classic", "Edition", "Carry-All", "Drinkware Set",
  "Keychain", "Lapel Pin", "Notebook", "Desk Clock", "Bottle", "Tumbler",
  "Organiser", "Portfolio", "Travel Set", "Pen Set",
];
const MEDAL_NOUN = ["Medal", "Medal Set", "Medallion", "Honour Medal", "Finisher Medal", "Podium Medal"];
const GIFT_NOUN = [
  "Gift Box", "Hamper", "Gift Set", "Presentation Box", "Keepsake Box",
  "Signature Set", "Welcome Kit", "Celebration Box", "Desk Set",
  "Executive Set", "Festive Hamper", "Gifting Trunk",
];
const MEMENTO_NOUN = [
  "Memento", "Keepsake", "Souvenir", "Commemorative", "Tribute Piece",
  "Milestone Piece", "Remembrance", "Honour Piece",
];
const SPORTS_NOUN = [
  "Championship Cup", "League Trophy", "Podium Award", "Victory Cup",
  "Tournament Trophy", "Finalist Award",
];
const ROMAN = ["", " II", " III", " IV", " V", " VI", " VII", " VIII", " IX", " X"];

/** is the filename meaningful (human-written) or machine noise? */
function isMeaningfulName(base) {
  const b = base.replace(/^copy of\s+/i, "").trim();
  if (!b) return false;
  if (/^whatsapp image/i.test(b)) return false;
  if (/^pro-shot-/i.test(b)) return false;
  if (/^product beautifier-/i.test(b)) return false;
  if (/^product staging-/i.test(b)) return false;
  if (/^ghost mannequin-/i.test(b)) return false;
  if (/^describe-a-change/i.test(b)) return false; // AI edit exports
  if (/congratulation/i.test(b)) return false; // one-off personalised proofs
  if (/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(b)) return false; // UUID
  if (/^tg[-\s_]*\d+$/i.test(b)) return false; // stock codes: TG-00001
  if (/^img[-_]/i.test(b)) return false;
  if (/^[A-Z]{2,5}$/.test(b)) return false; // brand/stock initialisms: AOS
  if (/^[A-Z]{4}\d{4}$/.test(b)) return false; // camera codes: ADRW7989
  if (/^\d[\d_]+$/.test(b.replace(/\s/g, ""))) return false;
  if (b.length > 70) return false; // AI-prompt filenames
  return true;
}

function prettifyName(base, categorySlug, seed) {
  let s = base
    .replace(/^copy of\s+/i, "")
    .replace(/\(\d+\)/g, " ")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  s = s.replace(/\b\w/g, (c) => c.toUpperCase());
  // domain touch-ups
  s = s
    .replace(/\bUltrafit\b/gi, "UltraFit")
    .replace(/\b(\d+)l\b/gi, "$1L");
  // a bare noun ("Bag", "Queen") reads as a placeholder — give it a house prefix
  if (s.split(" ").length === 1) s = `${pick(ADJ, seed + "a")} ${s}`;
  if (categorySlug === "trophies" && !/trophy|cup|award/i.test(s)) s += " Trophy";
  if (categorySlug === "medals" && !/medal/i.test(s)) s += " Medal";
  if (categorySlug === "sports" && !/trophy|cup|award|medal/i.test(s)) s += " Award";
  return s;
}

function generatedName(categorySlug, seed) {
  const adj = pick(ADJ, seed + "a");
  switch (categorySlug) {
    case "trophies": {
      const noun = pick(TROPHY_NOUN, seed + "n");
      const suffix = noun === "Cup" || noun === "Crown" || noun === "Chalice" ? "" : " Trophy";
      return `${adj} ${noun}${suffix}`;
    }
    case "medals":
      return `${adj} ${pick(MEDAL_NOUN, seed + "n")}`;
    case "merchandise":
      return `${adj} ${pick(MERCH_NOUN, seed + "n")}`;
    case "gifting":
      return `${adj} ${pick(GIFT_NOUN, seed + "n")}`;
    case "mementos":
      return `${adj} ${pick(MEMENTO_NOUN, seed + "n")}`;
    case "sports":
      return `${adj} ${pick(SPORTS_NOUN, seed + "n")}`;
    default:
      return `${adj} Keepsake`;
  }
}

/* ── subcategory inference ─────────────────────────────────────────── */
/**
 * Only filename evidence is used. The library is overwhelmingly machine-named,
 * so most pieces land on the category's default bucket rather than being
 * assigned a material they may not be made of.
 */
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
  if (categorySlug === "merchandise") {
    if (/pin|badge/.test(b)) return "lapel-pins";
    if (/key/.test(b)) return "keychains";
    if (/bag|backpack|tote|luggage/.test(b)) return "bags";
    if (/bottle|coaster|clock|table|desk|chess|passport|holder|king|queen/.test(b)) return "desk-and-decor";
    return "branded";
  }
  if (categorySlug === "gifting") {
    if (/hamper|basket/.test(b)) return "hampers";
    if (/welcome|onboarding|kit/.test(b)) return "welcome-kits";
    return "gift-sets";
  }
  if (categorySlug === "mementos") return "mementos";
  if (categorySlug === "medals") return "medals";
  if (categorySlug === "sports") return "sports-awards";
  return undefined;
}

const SUBCAT_LABELS = {
  acrylic: "Acrylic Trophies",
  crystal: "Crystal Trophies",
  metal: "Metal Trophies",
  wooden: "Wooden Trophies",
  resin: "Resin Trophies",
  designer: "Designer Trophies",
  "lapel-pins": "Lapel Pins & Badges",
  keychains: "Keychains",
  bags: "Bags & Carry",
  "desk-and-decor": "Desk & Décor",
  branded: "Branded Goods",
  "gift-sets": "Gift Sets",
  hampers: "Hampers",
  "welcome-kits": "Welcome Kits",
  mementos: "Mementos",
  medals: "Medals",
  "sports-awards": "Sports Awards",
};

const MATERIALS = {
  acrylic: ["Premium acrylic", "UV-printed face"],
  crystal: ["Optical crystal", "Etched glass"],
  metal: ["Die-cast metal", "24K gold electroplating"],
  wooden: ["Seasoned hardwood", "Brushed metal plate"],
  resin: ["Hand-cast resin", "Antique gold finish"],
  designer: ["Mixed media", "Gold-tone finish"],
  "lapel-pins": ["Enamelled brass", "Butterfly clutch"],
  keychains: ["Polished alloy", "Enamel inlay"],
  bags: ["Coated canvas", "Embroidered branding"],
  "desk-and-decor": ["Engraved metal", "Hardwood base"],
  branded: ["Premium materials", "Laser-engraved branding"],
  "gift-sets": ["Rigid presentation box", "Foam-cut insert"],
  hampers: ["Woven hamper", "Ribbon-tied finish"],
  "welcome-kits": ["Rigid kit box", "Printed collateral"],
  mementos: ["Cast metal", "Hardwood mount"],
  medals: ["Die-struck alloy", "Custom-woven ribbon"],
  "sports-awards": ["Die-cast metal", "Weighted base"],
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
    merchandise: `${name} carries your branding with precision — laser engraving or UV printing, packed in a gift-ready box.`,
    gifting: `${name} is assembled to order from ${material} — curated, branded and presentation-packed, ready to hand over at onboarding, Diwali or a milestone announcement.`,
    mementos: `${name} is cast and finished to commemorate the occasion in ${material}, engraved with the names, dates and words you want remembered.`,
    sports: `${name} is built for the podium — ${material}, weighted for the handover photo and engraved with team, event and season.`,
  };
  const base = lines[category] || lines.trophies;
  return premium
    ? `${base} Part of our Premium Collection: individually inspected, numbered and delivered in a velvet-lined presentation case.`
    : base;
}

function buildSizes(categorySlug, price) {
  switch (categorySlug) {
    case "trophies":
    case "sports":
      return [
        { label: '12"', priceDelta: 0 },
        { label: '15"', priceDelta: Math.round((price * 0.18) / 10) * 10 },
        { label: '18"', priceDelta: Math.round((price * 0.38) / 10) * 10 },
      ];
    case "medals":
      return [
        { label: "50 mm", priceDelta: 0 },
        { label: "60 mm", priceDelta: 30 },
        { label: "70 mm", priceDelta: 60 },
      ];
    case "gifting":
      return [
        { label: "Classic", priceDelta: 0 },
        { label: "Signature", priceDelta: Math.round((price * 0.3) / 10) * 10 },
        { label: "Grand", priceDelta: Math.round((price * 0.65) / 10) * 10 },
      ];
    default:
      return [{ label: "Standard", priceDelta: 0 }];
  }
}

/* ── scanning ──────────────────────────────────────────────────────── */
async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

/** Every unique photo in the folder becomes a product — the library IS the catalog. */
async function collectCategory(cat, seenHashes) {
  const dir = path.join(SRC, cat.folder);
  const files = [];
  try {
    for await (const f of walk(dir)) {
      if (IMAGE_EXT.has(path.extname(f).toLowerCase())) files.push(f);
    }
  } catch {
    return { chosen: [], dropped: 0, total: 0 };
  }
  files.sort(); // deterministic order
  const chosen = [];
  let dropped = 0;
  for (const f of files) {
    const buf = await fs.readFile(f);
    const h = md5(buf);
    if (seenHashes.has(h)) { dropped++; continue; } // duplicate, here or in an earlier folder
    seenHashes.add(h);
    const base = path.basename(f, path.extname(f));
    chosen.push({ file: f, buf, hash: h, base, meaningful: isMeaningfulName(base) });
  }
  return { chosen, dropped, total: files.length };
}

/* ── image rendering ───────────────────────────────────────────────── */
/**
 * Write the main / thumb / blur set straight from the customer's photo — the
 * shot's own studio background is kept exactly as delivered, no keying or
 * recolouring. `dominant` is sampled from the photo so the card behind it can
 * be painted the same colour and the plate blends into its frame.
 */
async function renderImages(buf, outDir, slug) {
  await fs.mkdir(outDir, { recursive: true });
  const img = sharp(buf, { failOn: "none" }).rotate();

  const main = await img
    .clone()
    .resize({ width: 1200, height: 1500, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  await fs.writeFile(path.join(outDir, `${slug}.webp`), main.data);

  const thumb = await img
    .clone()
    .resize({ width: 480, height: 600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 74 })
    .toBuffer();
  await fs.writeFile(path.join(outDir, `${slug}-thumb.webp`), thumb);

  const blurBuf = await img.clone().resize(16).webp({ quality: 40 }).toBuffer();
  const blur = `data:image/webp;base64,${blurBuf.toString("base64")}`;

  // sample the sweep from the border ring, not the whole frame: sharp's
  // dominant bin follows the subject on a busy shot, and it is the *edge*
  // colour the card has to match for the plate to sit flush in its frame
  let dominant = "#ffffff";
  try {
    const edge = await sharp(buf, { failOn: "none" })
      .rotate()
      .resize(24, 24, { fit: "fill" })
      .removeAlpha()
      .raw()
      .toBuffer();
    const px = [];
    const at = (x, y) => { const i = (y * 24 + x) * 3; px.push([edge[i], edge[i + 1], edge[i + 2]]); };
    for (let x = 0; x < 24; x++) { at(x, 0); at(x, 23); }
    for (let y = 1; y < 23; y++) { at(0, y); at(23, y); }
    const mid = (k) => {
      const a = px.map((p) => p[k]).sort((m, n) => m - n);
      return a[a.length >> 1];
    };
    dominant = `#${[mid(0), mid(1), mid(2)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  } catch {}

  return { width: main.info.width, height: main.info.height, blur, dominant };
}

/* ── main ──────────────────────────────────────────────────────────── */
async function main() {
  console.log("The Grace — ingesting the customer photo library…\n");
  console.log(`  source: ${path.relative(ROOT, SRC)}\n`);
  await fs.rm(OUT_IMG, { recursive: true, force: true });
  await fs.mkdir(OUT_DATA, { recursive: true });
  await fs.mkdir(OUT_SITE, { recursive: true });

  const products = [];
  const categoriesOut = [];
  const usedSlugs = new Set();
  const usedNamesPerCat = new Map();
  const seenHashes = new Set();

  for (const cat of CATEGORIES) {
    const res = await collectCategory(cat, seenHashes);
    const chosen = res.chosen;
    const subcounts = {};
    let done = 0;
    let skipped = 0;

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
          ? prettifyName(item.base, cat.slug, seed)
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
          skipped++;
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
        if (cat.slug === "sports" && !occasions.includes("Sports")) occasions[1] = "Sports";

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
          sizes: buildSizes(cat.slug, price),
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
      droppedDuplicatesOrOverCap: (res.dropped ?? 0) + skipped,
      libraryTotal: res.total ?? 0,
      subcategories: Object.entries(subcounts)
        .sort((a, b) => b[1] - a[1])
        .map(([slug, count]) => ({ slug, name: SUBCAT_LABELS[slug] || slug, count })),
    });
    console.log(
      `  ✓ ${cat.name.padEnd(20)} ${String(done).padStart(3)} products` +
        (res.total ? ` (from ${res.total} photos${skipped ? `, ${skipped} unreadable` : ""})` : " (empty folder — custom-order category)")
    );
  }

  // deterministic ordering: curated first within category, then by id
  const catOrder = new Map(CATEGORIES.map((c, i) => [c.slug, i]));
  products.sort((a, b) =>
    a.category === b.category
      ? Number(b.curated) - Number(a.curated) || a.id.localeCompare(b.id)
      : catOrder.get(a.category) - catOrder.get(b.category)
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
        p.category === "trophies" &&
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
