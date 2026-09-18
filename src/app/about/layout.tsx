import type { Metadata } from "next";
export const metadata: Metadata = { title: 'About us', description: 'Meet Coco Local, your family-run neighbourhood shop on High Road in South Benfleet. Take a look inside our shop gallery.', alternates: { canonical: "/about" } };
export default function Layout({ children }: {
    children: React.ReactNode;
}) { return <>{children}</>; }
