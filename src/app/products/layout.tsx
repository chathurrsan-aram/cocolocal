import type { Metadata } from "next";
export const metadata: Metadata = { title: 'Our range', description: 'Explore groceries, world foods, snacks, slushies, pet food and household essentials at Coco Local in South Benfleet.', alternates: { canonical: "/products" } };
export default function Layout({ children }: {
    children: React.ReactNode;
}) { return <>{children}</>; }
