import type { Metadata } from "next";
export const metadata: Metadata = { title: 'Delivery enquiries', description: 'Contact Coco Local to check delivery availability and terms for your address.', alternates: { canonical: "/delivery" } };
export default function Layout({ children }: {
    children: React.ReactNode;
}) { return <>{children}</>; }
