import type { Metadata } from "next";
import WheelDemo from "./WheelDemo";
export const metadata: Metadata = {
  title: "Daily spin — preview",
  description: "Try Coco Local’s daily prize-wheel demo. One spin per browser each day.",
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: "/spin" },
};
export default function SpinPage() { return <WheelDemo />; }
