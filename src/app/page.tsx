import HeroBanner from "@/components/home/HeroBanner";
import LeaguesShowcase from "@/components/home/LeaguesShowcase";
import CollectionsShowcase from "@/components/home/CollectionsShowcase";
import FeaturedGrid from "@/components/home/FeaturedGrid";
import DiscoverByCatalog from "@/components/home/DiscoverByCatalog";
import WhyUs from "@/components/home/WhyUs";
import HomepageFAQ from "@/components/home/HomepageFAQ";
import Newsletter from "@/components/home/Newsletter";

export default function Home() {
  return (
    <>
      <HeroBanner />
      <LeaguesShowcase />
      <CollectionsShowcase />
      <FeaturedGrid />
      <DiscoverByCatalog />
      <WhyUs />
      <HomepageFAQ />
      <Newsletter />
    </>
  );
}
