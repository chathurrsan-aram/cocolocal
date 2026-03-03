import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delivery",
  description:
    "Order delivery from COCO Local. We deliver groceries, hot food, and drinks across Benfleet, Canvey Island, Hadleigh, and Thundersley.",
};

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
