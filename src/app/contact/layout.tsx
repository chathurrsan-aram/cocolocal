import type { Metadata } from "next";
export const metadata: Metadata = { title: 'Find us', description: 'Visit Coco Local at 210 High Road, South Benfleet, SS7 5LD. Find confirmed opening hours, on-site parking and shop contact details.', alternates: { canonical: "/contact" } };
export default function Layout({ children }: {
    children: React.ReactNode;
}) { return <>{children}</>; }
