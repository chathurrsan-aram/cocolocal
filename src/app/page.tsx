import Hero from "@/components/home/Hero";
import ShopWalk from "@/components/home/ShopWalk";
import Offers from "@/components/Offers";
import Slushies from "@/components/home/Slushies";
import VisitUs from "@/components/home/VisitUs";
import FollowUs from "@/components/home/FollowUs";
import WheelSoon from "@/components/home/WheelSoon";

export const revalidate = 3600;
export const metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return <>
    <Hero />
    <ShopWalk />
    <Offers />
    <Slushies />
    <VisitUs />
    <FollowUs />
    <WheelSoon />
  </>;
}
