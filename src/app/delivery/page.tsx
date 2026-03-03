"use client";

import { ClipboardList, Package, Truck, Phone, MessageCircle } from "lucide-react";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import PlaceholderImage from "@/components/PlaceholderImage";

const steps = [
  {
    icon: ClipboardList,
    title: "1. Order",
    description:
      "Send us your order via WhatsApp or give us a call. Let us know what you need — whether it's groceries, hot food, drinks, or a mix of everything.",
  },
  {
    icon: Package,
    title: "2. We Pack",
    description:
      "We'll pick and pack your items fresh from the store. Hot food is prepared to order so it arrives warm and ready to enjoy.",
  },
  {
    icon: Truck,
    title: "3. We Deliver",
    description:
      "Your order is delivered straight to your door across Benfleet and surrounding areas. Fast, friendly, and fuss-free.",
  },
];

export default function DeliveryPage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <AnimateOnScroll>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 neon-text">
              Local Delivery
            </h1>
            <p className="text-muted text-base sm:text-lg max-w-xl mx-auto mb-12">
              Can&apos;t make it to the shop? No worries — we&apos;ll bring COCO Local to your doorstep.
              Fast delivery across Benfleet and nearby areas.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="pb-16 sm:pb-24 px-4">
        <div className="max-w-5xl mx-auto">
          <AnimateOnScroll>
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12 neon-text-subtle">
              How It Works
            </h2>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <AnimateOnScroll key={step.title} delay={i * 0.15}>
                <div className="text-center bg-navy-light rounded-2xl p-8 border border-cyan/10 hover:border-cyan/30 transition-all duration-500 hover:shadow-neon group">
                  <div className="w-16 h-16 rounded-2xl bg-cyan/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-cyan/20 transition-colors">
                    <step.icon className="text-cyan" size={30} />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-3">{step.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{step.description}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DELIVERY INFO ===== */}
      <section className="py-16 sm:py-24 px-4 bg-navy-dark">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <AnimateOnScroll>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 neon-text-subtle">
                  Delivery Details
                </h2>

                <div className="space-y-6">
                  <div className="bg-navy rounded-xl p-5 border border-cyan/10">
                    <h3 className="text-white font-semibold mb-2">Area Covered</h3>
                    <p className="text-muted text-sm">
                      We deliver across Benfleet, South Benfleet, Canvey Island, Hadleigh, and
                      Thundersley. If you&apos;re nearby, drop us a message and we&apos;ll see what we can do.
                    </p>
                  </div>

                  <div className="bg-navy rounded-xl p-5 border border-cyan/10">
                    <h3 className="text-white font-semibold mb-2">Minimum Order</h3>
                    <p className="text-muted text-sm">
                      We have a small minimum order for delivery — message us for current details. No
                      delivery charge for orders over a certain amount.
                    </p>
                  </div>

                  <div className="bg-navy rounded-xl p-5 border border-cyan/10">
                    <h3 className="text-white font-semibold mb-2">Delivery Times</h3>
                    <p className="text-muted text-sm">
                      We aim to deliver within 30–45 minutes during opening hours. Same-day delivery
                      available for orders placed before 8:00 PM.
                    </p>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll delay={0.15}>
              <PlaceholderImage
                label="DELIVERY PHOTO — Replace with delivery / driver photo"
                src="/images/delivery.jpg"
                className="w-full h-72 sm:h-80 lg:h-[28rem]"
              />
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <AnimateOnScroll>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 neon-text-subtle">
              Ready to Order?
            </h2>
            <p className="text-muted mb-10 max-w-lg mx-auto">
              Get in touch via WhatsApp for the fastest response, or give us a ring. We&apos;ll
              take your order and have it on its way in no time.
            </p>
          </AnimateOnScroll>

          <AnimateOnScroll delay={0.15}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* REPLACE: Update with real WhatsApp number — format: 447XXXXXXXXX */}
              <a
                href="https://wa.me/447XXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="neon-button inline-flex items-center gap-2 text-base w-full sm:w-auto justify-center"
              >
                <MessageCircle size={20} />
                Order via WhatsApp
              </a>

              {/* REPLACE: Update with real phone number */}
              <a
                href="tel:07XXXXXXXXX"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg border-2 border-cyan/30 text-cyan font-semibold hover:bg-cyan/10 transition-all duration-300 text-base w-full sm:w-auto justify-center"
              >
                <Phone size={20} />
                Call Us
              </a>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </>
  );
}
