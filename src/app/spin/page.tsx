import type { Metadata } from "next";
import WheelGate from "./WheelGate";
export const metadata: Metadata = {
  title: "Daily spin — private preview",
  description: "Password-protected Coco Local daily prize-wheel demo.",
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: "/spin" },
};
export default function SpinPage() { return <WheelGate />; }
