/**
 * Journal entries — the single source for /journal and /journal/[slug].
 *
 * Deliberately a plain typed array rather than a CMS: the shop owner edits
 * this one file to publish. Add an entry to the top of ENTRIES and both the
 * index and its article route appear, sitemap included.
 *
 * Every entry belongs to one of four sections (see SECTIONS below), which
 * the index filters on. `body` is an array of paragraphs; a string beginning
 * with "## " is rendered as a subheading.
 */

/**
 * The four things the Journal carries. Order is the order of the filter
 * chips on /journal, and `key` is the ?section= value — so renaming a label
 * is free, but changing a key breaks existing links.
 */
export const SECTIONS = [
  {
    key: "launch",
    label: "Launch",
    blurb: "New collections and openings — the pieces the workshop has just put on the shelf.",
  },
  {
    key: "news",
    label: "News",
    blurb: "What is happening at the bench: commissions, capacity, and the odd national podium.",
  },
  {
    key: "product",
    label: "New Products",
    blurb: "Materials, finishes and specifications for pieces that have just joined the catalogue.",
  },
  {
    key: "blog",
    label: "Blog",
    blurb: "Longer notes on craft, and on what separates an award that is kept from one that is not.",
  },
] as const;

export type SectionKey = (typeof SECTIONS)[number]["key"];

const SECTION_KEYS = SECTIONS.map((s) => s.key) as readonly string[];

/** Narrow a raw ?section= value; anything unrecognised means "show all". */
export function parseSection(value: string | undefined): SectionKey | undefined {
  return value && SECTION_KEYS.includes(value) ? (value as SectionKey) : undefined;
}

export function sectionLabel(key: SectionKey): string {
  return SECTIONS.find((s) => s.key === key)!.label;
}

export interface JournalEntry {
  slug: string;
  section: SectionKey;
  title: string;
  excerpt: string;
  /** ISO date — drives ordering and <time dateTime>. */
  date: string;
  readingMinutes: number;
  image: string;
  body: string[];
}

export const ENTRIES: JournalEntry[] = [
  /* ── News ───────────────────────────────────────────────────────── */
  {
    slug: "a-second-engraving-bench",
    section: "news",
    title: "A second engraving bench goes in",
    excerpt:
      "Engraving was the one stage that could not be hurried without being spoiled. So we stopped hurrying it and added a bench instead.",
    date: "2026-08-11",
    readingMinutes: 3,
    image: "/images/site/hero-trophy-alt.webp",
    body: [
      "For most of the last two years, every award we made passed through a single engraving station. Casting could run in parallel. Polishing could run in parallel. Engraving was one bench, one operator, one queue.",
      "As of this month there are two.",
      "## Why this was the bottleneck",
      "Engraving is the last thing that happens and the only thing that cannot be undone. A cup can be re-polished. A base can be re-cut. A misspelled name means the piece starts again from the mould.",
      "That makes it the stage where speed is most expensive. When a season peaks — sports days in February, annual nights in December — a single bench turns a comfortable ten-day promise into an uncomfortable one, and the temptation is to work faster rather than to work later.",
      "## What changes for an order",
      "Nothing about the process, and nothing about the price. What changes is the shape of our peak weeks: the second bench absorbs the surge instead of the schedule absorbing it.",
      "In practice, orders of under fifty pieces placed in a peak month should now quote at the same seven to ten days as they do in a quiet one. Larger runs still get a date we work backwards from rather than a date we hope for.",
      "The proof step is unchanged. Nothing is etched until you have approved exactly how the names read.",
    ],
  },
  {
    slug: "a-sports-day-season-from-the-bench",
    section: "news",
    title: "A sports-day season, seen from the bench",
    excerpt:
      "Two hundred schools, one nine-week window, and a hard lesson about the difference between a deadline and a date.",
    date: "2026-06-28",
    readingMinutes: 4,
    image: "/images/site/hero-trophy.webp",
    body: [
      "Between January and March this year our workshop shipped medals, shields and podium sets to a little over two hundred schools. It is the densest stretch in our calendar and the one that teaches us the most.",
      "## Everyone wants the same fortnight",
      "School sports days cluster. They are set by the academic calendar and the weather, not by our capacity, so a nine-week window carries what would comfortably spread across five months.",
      "We have stopped pretending otherwise. From this year, enquiries for February ceremonies are quoted against a production slot rather than a generic lead time — you are told which week your run is cast in, and that week is held.",
      "## The rolling shield is the real test",
      "Plenty of schools order a shield that comes back every year for a new name. Ours have to match a piece made three, five, eight years ago: the same casting, the same plate spacing, the same typeface.",
      "We keep the artwork and the die reference for every shield we have made. If you send us a photograph of the trophy and the year, we can usually find it without you knowing any part number.",
      "## What we would ask of you",
      "One thing only: send the name list when it is final, not when it is nearly final. Re-engraving a hundred medals because a relay result was contested costs three days that the ceremony does not have.",
    ],
  },

  /* ── Launch ─────────────────────────────────────────────────────── */
  {
    slug: "the-2026-premium-collection",
    section: "launch",
    title: "The 2026 Premium collection is open",
    excerpt:
      "Fifty-one new pieces in optical crystal and cast metal, built around one question: what does this look like on a stage from the back of the hall?",
    date: "2026-08-06",
    readingMinutes: 3,
    image: "/images/site/hero-trophy.webp",
    body: [
      "The Premium collection has been rebuilt for 2026. Fifty-one pieces, most of them new castings, and a handful of long-standing designs kept because clients keep asking for them by name.",
      "## Designed for the back of the hall",
      "An award is photographed from three feet and seen from thirty. Most catalogue trophies are designed for the first distance and disappear at the second.",
      "So the new pieces are taller through the stem, heavier in the base, and carry their detail on the silhouette rather than in surface engraving that vanishes past the third row. Held in the hand they read as considered. Held above a head they read at all.",
      "## What is in it",
      "Optical crystal columns and peaks, die-cast cups with brass detailing, and a set of sculptural forms in blackened metal for organisations that do not want anything that looks like a trophy.",
      "Sizes run from 9 to 22 inches. Engraving is included, as it is on everything we make.",
      "## Where to start",
      "If you know the occasion, the quickest route is the commission desk — tell us what is being honoured and we will point you at three or four pieces rather than fifty-one. If you would rather browse, the collection is in the catalogue now.",
    ],
  },
  {
    slug: "the-storefront-is-open",
    section: "launch",
    title: "The storefront is open",
    excerpt:
      "Twenty years of work, finally with prices on it. Here is what the new site does, and the one thing it deliberately does not.",
    date: "2026-07-24",
    readingMinutes: 3,
    image: "/images/site/hero-trophy-alt.webp",
    body: [
      "For two decades this workshop ran on phone calls, WhatsApp threads and a printed catalogue that went out of date the week it was printed. As of today there is a storefront.",
      "## Everything we make, with prices",
      "Around four hundred pieces are listed, across trophies, medals, mementos, corporate gifting and branded merchandise. Bulk tiers are shown on the page rather than negotiated — from ten pieces the price steps down automatically, and it keeps stepping down.",
      "## Commission, not just order",
      "The part we care about most is the commission desk. Bespoke work has always been the majority of what leaves the workshop, and it has never had a front door. Now it does: a brief goes in, a design proof comes back, and nothing is cast until you have approved it.",
      "## What the site will not do",
      "It will not pretend to be a machine. There is no automated quote for custom work, because a quote given without knowing the date and the quantity is a guess dressed up as a number.",
      "Every enquiry is still read by someone at the bench. That is slower than an instant estimate and considerably more accurate.",
    ],
  },

  /* ── New product information ────────────────────────────────────── */
  {
    slug: "the-meridian-crystal-series",
    section: "product",
    title: "The Meridian crystal series",
    excerpt:
      "Optical crystal, 15 mm through the face, with the engraving sunk from behind so it cannot scuff. Specifications and honest limitations.",
    date: "2026-08-09",
    readingMinutes: 3,
    image: "/images/site/hero-trophy.webp",
    body: [
      "Meridian is a four-piece set of optical crystal awards: a column, a peak, a flat shield and a low block for desk presentation.",
      "## Specification",
      "Optical crystal, not glass — lead-free, cast and hand-polished, 15 mm through the face. Heights of 6, 9, 12 and 15 inches. Each piece ships in a fitted foam-lined box.",
      "Engraving is sub-surface, etched from the back of the face so the front stays smooth. It cannot be scuffed by handling, and it catches light from the reverse, which is what gives crystal engraving its depth.",
      "## What it does well",
      "Corporate recognition, long-service awards, and anything where the name matters more than the form. Colour reproduction of a logo is excellent because the print sits behind glass rather than on it.",
      "## What it does not do",
      "Meridian is not a sports trophy. It is heavy, it has flat faces, and it will chip if it goes over on a podium. For anything that will be lifted, handed round or driven home in a kit bag, cast metal is the honest recommendation and we will say so.",
      "It is also the one material where we cannot rescue a late change. Sub-surface engraving cannot be re-cut — a changed name means a new blank.",
    ],
  },
  {
    slug: "recycled-brass-medals",
    section: "product",
    title: "Recycled brass medals, at the same price",
    excerpt:
      "Our die-struck medals now use reclaimed brass. The finish is identical, the price has not moved, and here is why we are not charging a premium for it.",
    date: "2026-07-02",
    readingMinutes: 3,
    image: "/images/site/hero-trophy-alt.webp",
    body: [
      "Every die-struck medal we make is now struck from reclaimed brass rather than virgin stock. The change happened quietly in April; this is the note that should have accompanied it.",
      "## The finish is the same",
      "Reclaimed brass is re-melted and re-cast before it reaches the die, so what arrives at the press is indistinguishable from new stock. Gold, silver and antique-bronze plating behave identically. Nobody receiving one of these medals could tell you which batch it came from, and that is the point.",
      "## The price is the same",
      "We are not charging more for this, and we are not discounting it either. Reclaimed brass costs us slightly less than virgin; the plating and the striking cost exactly what they did. The saving is roughly the size of the extra handling, so the number on the invoice has not moved.",
      "## Ribbons",
      "Custom-woven ribbons are unchanged — your own colours and text, minimum quantity fifty for a bespoke weave. Below fifty we print onto stock ribbon, which is cheaper and, at arm's length, honestly quite hard to tell apart.",
    ],
  },

  /* ── Blog ───────────────────────────────────────────────────────── */
  {
    slug: "what-makes-an-award-worth-keeping",
    section: "blog",
    title: "What makes an award worth keeping",
    excerpt:
      "Most trophies are thrown away within a decade. The ones that survive have three things in common — and none of them is price.",
    date: "2026-07-10",
    readingMinutes: 4,
    image: "/images/site/hero-trophy.webp",
    body: [
      "There is a particular shelf in most offices and most homes. It holds the pieces nobody could bring themselves to discard. Everything else went into a drawer, then a box, then out.",
      "After two decades of casting awards in Lajpat Nagar, we have a reasonably good idea of what earns a place on that shelf.",
      "## Weight tells the truth",
      "Pick up an award and your hands decide before your eyes do. A hollow, light piece reads as a token no matter how it is finished. Density is the cheapest honesty available to a maker — and the first thing cut when a piece is made to a price rather than to a standard.",
      "## The engraving has to be right",
      "A misspelled name turns a decade of work into an embarrassment. It is the single most common failure we are asked to repair, and it is entirely preventable: read the proof, then read it again, then have somebody who was not involved read it a third time.",
      "This is why nothing leaves our workshop without an approved proof. Not because we enjoy the extra step, but because engraving is the one part of the process that cannot be undone.",
      "## It should look like the occasion",
      "A district kabaddi tournament and a pharmaceutical company's twenty-fifth year do not want the same object. When a trophy is bought from a catalogue with no thought to the room it will stand in, it looks borrowed. When it is designed around the moment, it looks inevitable.",
      "That is the whole argument for commissioning rather than ordering. It usually costs less than people expect, and it is the difference between an award that is received and one that is kept.",
    ],
  },
  {
    slug: "inside-the-lajpat-nagar-workshop",
    section: "blog",
    title: "Inside the Lajpat Nagar workshop",
    excerpt:
      "Design, casting, engraving and finishing under one roof — and why we have never outsourced a single stage of it.",
    date: "2026-06-18",
    readingMinutes: 5,
    image: "/images/site/hero-trophy-alt.webp",
    body: [
      "Most award suppliers in India are, in the strict sense, traders. They take an order, place it with a workshop, and pass the result on. It is an efficient model and it works until something goes wrong — at which point nobody in the chain can fix it quickly.",
      "We built the opposite. Everything happens in our own workshop, and the practical consequence is that when a client calls at nine in the evening because a name has changed, someone can walk over to the engraving bench.",
      "## Design",
      "Every commission starts on paper: proportions, materials, and the words that will be engraved. The proof goes out on WhatsApp because that is where our clients actually are, and revisions happen in hours rather than days.",
      "## Cast and cut",
      "Optical crystal, die-cast metal, brass, acrylic and seasoned hardwood are shaped in-house. Keeping this stage under our own roof is what lets us quote honestly on timelines — we are not waiting on somebody else's queue.",
      "## Engrave",
      "Names, dates and logos are laser-etched or cast as metal badges depending on the material. Engraving is included on every award we make; we have never understood charging separately for the part that makes the object mean something.",
      "## Finish and pack",
      "Polishing, felt bases, boxes and ribbons. Podium sets travel in fitted packaging because an award that arrives chipped may as well not have arrived.",
      "Seven to ten days, start to finish, for most commissions. When a ceremony date is tighter than that, we say so before taking the order rather than after.",
    ],
  },
  {
    slug: "the-khelo-india-commission",
    section: "blog",
    title: "The Khelo India commission",
    excerpt:
      "What it takes to deliver the official awards for a national games — and what the deadline teaches you about production.",
    date: "2026-05-22",
    readingMinutes: 4,
    image: "/images/site/hero-trophy.webp",
    body: [
      "A national games does not move. The ceremony happens on the announced date whether or not the silverware has arrived, which makes it the most useful discipline a workshop can submit itself to.",
      "Making the official awards for the Khelo India Games changed how we plan every order since, national or otherwise.",
      "## Volume changes the failure mode",
      "At ten pieces, a flaw is an inconvenience. At several hundred, a flaw in the mould is a catastrophe discovered too late. So the first article is inspected far more harshly than anything that follows, because everything that follows inherits its faults.",
      "## Build the buffer into the schedule, not the promise",
      "We quote the date we can defend, then work to an internal date well before it. The gap is not padding for its own sake — it is where re-casts live when something goes wrong, and something occasionally does.",
      "## Packaging is part of the product",
      "Awards for a national event are handled by many people across many venues before they reach a podium. Fitted boxes are not presentation; they are insurance.",
      "The lessons scale down cleanly. A school sports day has the same immovable date and the same intolerance for a chipped cup — it simply has fewer of them.",
    ],
  },
];

/** Newest first. Pass a section to narrow to one; omit for everything. */
export function getEntries(section?: SectionKey): JournalEntry[] {
  const pool = section ? ENTRIES.filter((e) => e.section === section) : ENTRIES;
  return [...pool].sort((a, b) => b.date.localeCompare(a.date));
}

/** How many entries each section holds — drives the counts on the chips. */
export function sectionCounts(): Record<SectionKey, number> {
  const counts = Object.fromEntries(SECTIONS.map((s) => [s.key, 0])) as Record<
    SectionKey,
    number
  >;
  for (const e of ENTRIES) counts[e.section] += 1;
  return counts;
}

export function getEntry(slug: string): JournalEntry | undefined {
  return ENTRIES.find((e) => e.slug === slug);
}

/** "2026-07-10" → "10 July 2026" */
export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
