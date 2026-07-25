import { VideoIntroHero } from "@/components/book/VideoIntroHero";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { CraftStory } from "@/components/home/CraftStory";
import { HeritageBanner } from "@/components/home/HeritageBanner";
import { Testimonials } from "@/components/home/Testimonials";
import { ContactCTA } from "@/components/home/ContactCTA";
import { getAllProducts, getCategories } from "@/lib/catalog";

export default async function HomePage() {
  const all = await getAllProducts();
  const categories = getCategories();

  // a cover image per category for the showcase
  const covers = Object.fromEntries(
    categories.map((c) => {
      const p = all.find((x) => x.category === c.slug && x.curated) ?? all.find((x) => x.category === c.slug);
      return [
        c.slug,
        p
          ? { src: p.images[0].thumb, blur: p.images[0].blur, dominant: p.images[0].dominant }
          : { src: "/images/site/hero-trophy.webp", blur: "", dominant: "#12121a" },
      ];
    })
  );

  return (
    <>
      <VideoIntroHero
        videoSrc="/Grace-Video8k.mp4"
        posterCover="/images/site/intro-cover.webp"
        posterOpen="/images/site/intro-open.webp"
        leftPage={{
          title: "Premium Trophies",
          tagline: "Crafted to celebrate excellence.",
          href: "/premium",
        }}
        rightPage={{
          title: "General Trophies",
          tagline: "The everyday collection — loved at every podium.",
          href: "/standard",
        }}
      />

      <div id="after-book" className="relative z-10 bg-ink">
        {/* the six collections lead the page — the first thing after the book
            opens is where the customer chooses what they came for */}
        <CategoryShowcase categories={categories} covers={covers} />
        <HeritageBanner />
        <CraftStory />
        <Testimonials />
        <ContactCTA />
      </div>
    </>
  );
}
