import HeroVideo from "@/components/home/HeroVideo";
import CategoryShowcase from "@/components/home/CategoryShowcase";
import LeagueStrip from "@/components/home/LeagueStrip";
import NationsStrip from "@/components/home/NationsStrip";
import FeaturedGrid from "@/components/home/FeaturedGrid";
import IsraeliFaves from "@/components/home/IsraeliFaves";
import WhyUs from "@/components/home/WhyUs";
import Newsletter from "@/components/home/Newsletter";
import { getShowcaseProducts } from "@/lib/products";

export default function Home() {
  // Pick 4 distinct featured products for the hero collage. Mix of
  // top clubs + WC2026 nationals so the colour variety reads well.
  const heroPool = [
    ...getShowcaseProducts({ team: "real-madrid" }, 1),
    ...getShowcaseProducts({ category: "national", isWorldCup2026: true }, 2),
    ...getShowcaseProducts({ team: "barcelona" }, 1),
    ...getShowcaseProducts({ team: "manchester-united" }, 1),
    ...getShowcaseProducts({ team: "psg" }, 1),
  ];
  const seen = new Set<string>();
  const heroImages: string[] = [];
  for (const p of heroPool) {
    if (seen.has(p.id) || !p.images?.length) continue;
    seen.add(p.id);
    heroImages.push(p.images[0]);
    if (heroImages.length >= 4) break;
  }

  return (
    <>
      <HeroVideo showcaseImages={heroImages} />
      <CategoryShowcase />
      <LeagueStrip />
      <NationsStrip />
      <FeaturedGrid />
      <IsraeliFaves />
      <WhyUs />
      <Newsletter />
    </>
  );
}
