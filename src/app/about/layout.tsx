import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about COCO Local — a family-run convenience store on High Road, Benfleet, Essex. Open 7 days, hot food, groceries, and more.",
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
