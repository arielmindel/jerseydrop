import HeroVideo from "@/components/home/HeroVideo";
import CategoryShowcase from "@/components/home/CategoryShowcase";
import LeagueStrip from "@/components/home/LeagueStrip";
import NationsStrip from "@/components/home/NationsStrip";
import FeaturedGrid from "@/components/home/FeaturedGrid";
import DiscoverByCatalog from "@/components/home/DiscoverByCatalog";
import CollectionsSection from "@/components/home/CollectionsSection";
import IsraeliFaves from "@/components/home/IsraeliFaves";
import WhyUs from "@/components/home/WhyUs";
import HomepageFAQ from "@/components/home/HomepageFAQ";
import Newsletter from "@/components/home/Newsletter";

export default function Home() {
  return (
    <>
      <HeroVideo />
      <CategoryShowcase />
      <LeagueStrip />
      <NationsStrip />
      <FeaturedGrid />
      <DiscoverByCatalog />
      <CollectionsSection />
      <IsraeliFaves />
      <WhyUs />
      <HomepageFAQ />
      <Newsletter />
    </>
  );
}
