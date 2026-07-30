/**
 * Journal entries — the single source for /journal and /journal/[slug].
 *
 * Deliberately a plain typed array rather than a CMS: the shop owner edits
 * this one file to publish. Add an entry to the top of ENTRIES and both the
 * index and its article route appear, sitemap included.
 *
 * `body` is an array of paragraphs; a string beginning with "## " is rendered
 * as a subheading.
 */

export interface JournalEntry {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO date — drives ordering and <time dateTime>. */
  date: string;
  readingMinutes: number;
  image: string;
  body: string[];
}

export const ENTRIES: JournalEntry[] = [
  {
    slug: "what-makes-an-award-worth-keeping",
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

export function getEntries(): JournalEntry[] {
  return [...ENTRIES].sort((a, b) => b.date.localeCompare(a.date));
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
