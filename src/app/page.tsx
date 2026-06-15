import { VideoIntroHero } from "@/components/book/VideoIntroHero";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { CraftStory } from "@/components/home/CraftStory";
import { KheloIndiaBanner } from "@/components/home/KheloIndiaBanner";
import { Testimonials } from "@/components/home/Testimonials";
import { ContactCTA } from "@/components/home/ContactCTA";
import {
  getAllProducts,
  getCategories,
  getFeaturedProducts,
} from "@/lib/catalog";

export default async function HomePage() {
  const [featured, all] = await Promise.all([getFeaturedProducts(8), getAllProducts()]);
  const categories = getCategories();

  // a cover image per category for the showcase
  const covers = Object.fromEntries(
    categories.map((c) => {
      const p = all.find((x) => x.category === c.slug && x.curated) ?? all.find((x) => x.category === c.slug);
      return [
        c.slug,
        p
          ? { src: p.images[0].thumb, blur: p.images[0].blur }
          : { src: "/images/site/hero-trophy.webp", blur: "" },
      ];
    })
  );

  return (
    <>
      <VideoIntroHero
        videoSrc="/Homepagevideo.mp4"
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
        <FeaturedProducts products={featured} />
        <CategoryShowcase categories={categories} covers={covers} />
        <KheloIndiaBanner />
        <CraftStory />
        <Testimonials />
        <ContactCTA />
      </div>
    </>
  );
}
