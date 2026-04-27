import HeroVideo from "@/components/home/HeroVideo";
import LeaguesShowcase from "@/components/home/LeaguesShowcase";
import CollectionsShowcase from "@/components/home/CollectionsShowcase";
import FeaturedGrid from "@/components/home/FeaturedGrid";
import DiscoverByCatalog from "@/components/home/DiscoverByCatalog";
import IsraeliFaves from "@/components/home/IsraeliFaves";
import WhyUs from "@/components/home/WhyUs";
import HomepageFAQ from "@/components/home/HomepageFAQ";
import Newsletter from "@/components/home/Newsletter";

export default function Home() {
  return (
    <>
      <HeroVideo />
      <LeaguesShowcase />
      <CollectionsShowcase />
      <FeaturedGrid />
      <DiscoverByCatalog />
      <IsraeliFaves />
      <WhyUs />
      <HomepageFAQ />
      <Newsletter />
    </>
  );
}
