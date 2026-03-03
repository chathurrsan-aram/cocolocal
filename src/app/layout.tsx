import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "COCO Local — Your Neighbourhood Convenience Store in Benfleet",
    template: "%s | COCO Local",
  },
  description:
    "COCO Local is a premium convenience store at 210 High Road, Benfleet, Essex. Hot food, groceries, off-licence, and local delivery. Open 7 days a week.",
  keywords: [
    "convenience store",
    "Benfleet",
    "Essex",
    "hot food",
    "grocery",
    "off-licence",
    "delivery",
    "COCO Local",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Navbar />
        <main className="pt-16 sm:pt-20">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
