import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Delivery updates",
  description: "Delivery is not available at Coco Local yet. Deliveroo and Just Eat are planned; visit our South Benfleet shop in the meantime.",
  alternates: { canonical: "/delivery" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
