import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse our range of hot food, groceries, off-licence drinks, and delivery bundles at COCO Local, Benfleet.",
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
