"use client";

import Link from "next/link";
import { MapPin, Clock } from "lucide-react";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import PlaceholderImage from "@/components/PlaceholderImage";

const categories = [
  {
    name: "Hot Food",
    description: "Freshly made wraps, paninis, and hot bites — ready when you are.",
    src: "/images/categories/hot-food.jpg",
  },
  {
    name: "Grocery & Essentials",
    description: "Everything you need for the kitchen, from fresh bread to household basics.",
    src: "/images/categories/grocery.jpg",
  },
  {
    name: "Off-Licence",
    description: "Beers, wines, spirits, and soft drinks — chilled and ready to go.",
    src: "/images/categories/off-licence.jpg",
  },
  {
    name: "Delivery",
    description: "Can't make it in? We'll bring it to your door across Benfleet.",
    src: "/images/categories/delivery.jpg",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ===== HERO SECTION ===== */}
      <section className="relative w-full h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        {/* Hero Image / Video Placeholder */}
        <div className="absolute inset-0 bg-navy-light flex items-center justify-center border-b-2 border-dashed border-cyan/20">
          <span className="text-muted/40 text-sm uppercase tracking-widest">
            HERO IMAGE / VIDEO PLACEHOLDER — Replace with shop hero photo or video
          </span>
        </div>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy/70 via-navy/50 to-navy" />

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <AnimateOnScroll>
            <img
              src="/images/logo.png"
              alt="COCO Local"
              className="h-20 sm:h-24 md:h-28 w-auto object-contain mx-auto mb-6"
              style={{ filter: "drop-shadow(0 0 12px #00e5ff88)" }}
            />
          </AnimateOnScroll>

          <AnimateOnScroll delay={0.15}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 neon-text">
              Your Local. Done Right.
            </h1>
          </AnimateOnScroll>

          <AnimateOnScroll delay={0.3}>
            <p className="text-muted text-base sm:text-lg mb-8 max-w-xl mx-auto">
              Fresh food, everyday essentials, and friendly faces — right here on High Road, Benfleet.
            </p>
          </AnimateOnScroll>

          <AnimateOnScroll delay={0.45}>
            <Link href="/products" className="neon-button inline-block text-base">
              Explore Our Range
            </Link>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ===== CATEGORY CARDS ===== */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <AnimateOnScroll>
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12 neon-text-subtle">
              What We Offer
            </h2>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, i) => (
              <AnimateOnScroll key={cat.name} delay={i * 0.1}>
                <div className="group bg-navy-light rounded-2xl overflow-hidden border border-cyan/10 hover:border-cyan/40 transition-all duration-500 hover:shadow-neon">
                  <PlaceholderImage
                    label={`${cat.name} — Category Image`}
                    src={cat.src}
                    className="w-full rounded-none border-0 border-b border-dashed"
                    aspectRatio="1/1"
                  />
                  <div className="p-5">
                    <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-cyan transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-muted text-sm leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ABOUT PREVIEW ===== */}
      <section className="py-16 sm:py-24 px-4 bg-navy-dark">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <AnimateOnScroll>
              <PlaceholderImage
                label="SHOPFRONT PHOTO — Replace with photo of COCO Local exterior"
                src="/images/shopfront.jpg"
                className="w-full h-64 sm:h-80 lg:h-96"
              />
            </AnimateOnScroll>

            <AnimateOnScroll delay={0.15}>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 neon-text-subtle">
                  About COCO Local
                </h2>
                <p className="text-muted leading-relaxed mb-4">
                  We&apos;re more than just a corner shop. COCO Local is a family-run convenience store
                  proudly serving the Benfleet community from 210 High Road. Whether you need a quick
                  lunch, tonight&apos;s dinner essentials, or a chilled drink on a sunny afternoon — we&apos;ve
                  got you covered.
                </p>
                <p className="text-muted leading-relaxed mb-6">
                  Pop in and say hello. You&apos;ll see why the locals love us.
                </p>
                <Link
                  href="/about"
                  className="text-cyan font-medium hover:underline transition-all duration-300 neon-text-subtle"
                >
                  Learn More &rarr;
                </Link>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ===== VIDEO SECTION ===== */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <AnimateOnScroll>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-10 neon-text-subtle">
              See What&apos;s In Store
            </h2>
          </AnimateOnScroll>

          <AnimateOnScroll delay={0.15}>
            <div className="relative rounded-2xl overflow-hidden border-2 border-cyan/30 shadow-neon">
              <div
                className="placeholder-box border-0 rounded-none"
                style={{ aspectRatio: "16/9" }}
              >
                <span className="text-muted/60 text-sm uppercase tracking-wide">
                  VIDEO PLACEHOLDER — e.g. shop tour / TikTok embed
                </span>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ===== LOCATION / MAP ===== */}
      <section className="py-16 sm:py-24 px-4 bg-navy-dark">
        <div className="max-w-7xl mx-auto">
          <AnimateOnScroll>
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12 neon-text-subtle">
              Find Us
            </h2>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            <AnimateOnScroll>
              <div className="rounded-2xl overflow-hidden border-2 border-cyan/20 shadow-neon">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2491.5!2d0.5635!3d51.5438!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47d8d1c0e0e0e0e0%3A0x0!2s210+High+Road%2C+Benfleet+SS7+5LD!5e0!3m2!1sen!2suk!4v1700000000000"
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="COCO Local on Google Maps"
                  className="w-full"
                />
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll delay={0.15}>
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-cyan/10 flex items-center justify-center">
                    <MapPin className="text-cyan" size={22} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">Our Address</h3>
                    <p className="text-muted">
                      210 High Road<br />
                      Benfleet, Essex SS7 5LD
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-cyan/10 flex items-center justify-center">
                    <Clock className="text-cyan" size={22} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">Opening Hours</h3>
                    <ul className="text-muted space-y-1">
                      <li className="flex justify-between gap-8">
                        <span>Monday – Saturday</span>
                        <span className="text-white">7:00 AM – 10:00 PM</span>
                      </li>
                      <li className="flex justify-between gap-8">
                        <span>Sunday</span>
                        <span className="text-white">8:00 AM – 9:00 PM</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>
    </>
  );
}
