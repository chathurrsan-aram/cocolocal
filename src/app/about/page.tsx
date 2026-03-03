"use client";

import { Clock, Flame, Heart, Truck } from "lucide-react";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import PlaceholderImage from "@/components/PlaceholderImage";


const features = [
  {
    icon: Clock,
    title: "Open 7 Days",
    description:
      "We're here for you every day of the week — early morning to late evening. No matter when you need us, COCO Local is open.",
  },
  {
    icon: Flame,
    title: "Hot Food Daily",
    description:
      "Freshly prepared wraps, toasties, paninis, and more. Grab a quick lunch or a warm snack on the go — made fresh in-store.",
  },
  {
    icon: Heart,
    title: "Local & Loved",
    description:
      "We're a family-run shop rooted in the Benfleet community. Our customers aren't just shoppers — they're neighbours and friends.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description:
      "Can't pop in? No problem. We deliver across Benfleet and the surrounding areas. Just message us and we'll sort you out.",
  },
];

const galleryItems = Array.from({ length: 6 }, (_, i) => ({
  label: `GALLERY PHOTO ${i + 1} — Replace with real shop/product photo`,
  src: `/images/gallery/${i + 1}.jpg`,
}));

export default function AboutPage() {
  return (
    <>
      {/* ===== OUR STORY ===== */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <AnimateOnScroll>
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 neon-text">
                  Our Story
                </h1>
                <p className="text-muted leading-relaxed mb-4">
                  COCO Local started with a simple idea: give Benfleet a convenience store it can truly
                  rely on. Situated on the bustling High Road, we&apos;ve been serving our community with
                  pride — stocking the essentials you need, the treats you love, and the hot food that
                  keeps you coming back.
                </p>
                <p className="text-muted leading-relaxed mb-4">
                  We&apos;re a family-run business at heart. Every product on our shelves is chosen with
                  care, and every customer who walks through our door is treated like a neighbour.
                  Whether you&apos;re popping in for a morning coffee, grabbing a quick lunch, or picking
                  up essentials on the way home — we&apos;re here for you.
                </p>
                <p className="text-muted leading-relaxed">
                  From the early days of setting up shop to becoming a trusted name on High Road,
                  our journey has always been about community. And we&apos;re just getting started.
                </p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll delay={0.15}>
              <PlaceholderImage
                label="PHOTO PLACEHOLDER — Team / Family photo"
                src="/images/shopfront.jpg"
                className="w-full h-72 sm:h-80 lg:h-[28rem]"
              />
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ===== WHY COCO LOCAL ===== */}
      <section className="py-16 sm:py-24 px-4 bg-navy-dark">
        <div className="max-w-7xl mx-auto">
          <AnimateOnScroll>
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12 neon-text-subtle">
              Why COCO Local?
            </h2>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, i) => (
              <AnimateOnScroll key={feat.title} delay={i * 0.1}>
                <div className="bg-navy rounded-2xl p-6 border border-cyan/10 hover:border-cyan/30 transition-all duration-500 hover:shadow-neon group text-center">
                  <div className="w-14 h-14 rounded-xl bg-cyan/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-cyan/20 transition-colors">
                    <feat.icon className="text-cyan" size={26} />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-3">
                    {feat.title}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ===== GALLERY ===== */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <AnimateOnScroll>
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12 neon-text-subtle">
              Inside COCO Local
            </h2>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryItems.map((item, i) => (
              <AnimateOnScroll key={i} delay={i * 0.08}>
                <PlaceholderImage
                  label={item.label}
                  src={item.src}
                  className="w-full h-56 sm:h-64 hover:border-cyan/50 hover:shadow-neon transition-all duration-500"
                />
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
