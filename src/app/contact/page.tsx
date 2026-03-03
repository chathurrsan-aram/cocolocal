"use client";

import { useState, FormEvent } from "react";
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Music2 } from "lucide-react";
import AnimateOnScroll from "@/components/AnimateOnScroll";

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Form submission backend to be connected.
    setSubmitted(true);
  };

  return (
    <>
      {/* ===== HEADER ===== */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <AnimateOnScroll>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 neon-text">
              Get In Touch
            </h1>
            <p className="text-muted text-base sm:text-lg max-w-xl mx-auto">
              Whether you have a question, want to place a delivery order, or just want to say
              hello — we&apos;d love to hear from you.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ===== CONTACT DETAILS + FORM ===== */}
      <section className="pb-16 sm:pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Left: Contact Info */}
            <AnimateOnScroll>
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-cyan/10 flex items-center justify-center">
                    <MapPin className="text-cyan" size={22} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">Address</h3>
                    <p className="text-muted">
                      210 High Road<br />
                      Benfleet, Essex SS7 5LD
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-cyan/10 flex items-center justify-center">
                    <Phone className="text-cyan" size={22} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">Phone</h3>
                    {/* REPLACE: Update with real phone number */}
                    <a href="tel:07XXXXXXXXX" className="text-muted hover:text-cyan transition-colors">
                      07XXXXXXXXX
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-cyan/10 flex items-center justify-center">
                    <Mail className="text-cyan" size={22} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">Email</h3>
                    {/* REPLACE: Update with real email */}
                    <a
                      href="mailto:hello@cocolocal.co.uk"
                      className="text-muted hover:text-cyan transition-colors"
                    >
                      hello@cocolocal.co.uk
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-cyan/10 flex items-center justify-center">
                    <Clock className="text-cyan" size={22} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">Opening Hours</h3>
                    <ul className="text-muted space-y-1">
                      <li>Monday – Saturday: 7:00 AM – 10:00 PM</li>
                      <li>Sunday: 8:00 AM – 9:00 PM</li>
                    </ul>
                  </div>
                </div>

                {/* Social Media */}
                <div>
                  <h3 className="text-white font-semibold text-lg mb-3">Follow Us</h3>
                  <div className="flex items-center gap-4">
                    {/* REPLACE: Update href with real Facebook page URL */}
                    <a
                      href="#"
                      aria-label="Facebook"
                      className="w-10 h-10 rounded-xl bg-navy-light border border-cyan/10 flex items-center justify-center text-muted hover:text-cyan hover:border-cyan/30 transition-all duration-300"
                    >
                      <Facebook size={18} />
                    </a>
                    {/* REPLACE: Update href with real Instagram page URL */}
                    <a
                      href="#"
                      aria-label="Instagram"
                      className="w-10 h-10 rounded-xl bg-navy-light border border-cyan/10 flex items-center justify-center text-muted hover:text-cyan hover:border-cyan/30 transition-all duration-300"
                    >
                      <Instagram size={18} />
                    </a>
                    {/* REPLACE: Update href with real TikTok page URL */}
                    <a
                      href="#"
                      aria-label="TikTok"
                      className="w-10 h-10 rounded-xl bg-navy-light border border-cyan/10 flex items-center justify-center text-muted hover:text-cyan hover:border-cyan/30 transition-all duration-300"
                    >
                      <Music2 size={18} />
                    </a>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Right: Contact Form */}
            <AnimateOnScroll delay={0.15}>
              <div className="bg-navy-light rounded-2xl p-6 sm:p-8 border border-cyan/10">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">
                  Send Us a Message
                </h2>

                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-cyan/10 flex items-center justify-center mx-auto mb-4">
                      <Mail className="text-cyan" size={28} />
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">Message Sent!</h3>
                    <p className="text-muted text-sm">
                      Thanks for reaching out. We&apos;ll get back to you as soon as possible.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-muted mb-2">
                        Your Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-navy border border-cyan/10 rounded-xl px-4 py-3 text-white placeholder-muted/40 focus:outline-none focus:border-cyan/40 focus:ring-1 focus:ring-cyan/20 transition-all duration-300"
                        placeholder="John Smith"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-muted mb-2">
                        Your Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-navy border border-cyan/10 rounded-xl px-4 py-3 text-white placeholder-muted/40 focus:outline-none focus:border-cyan/40 focus:ring-1 focus:ring-cyan/20 transition-all duration-300"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-muted mb-2">
                        Your Message
                      </label>
                      <textarea
                        id="message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full bg-navy border border-cyan/10 rounded-xl px-4 py-3 text-white placeholder-muted/40 focus:outline-none focus:border-cyan/40 focus:ring-1 focus:ring-cyan/20 transition-all duration-300 resize-none"
                        placeholder="How can we help?"
                      />
                    </div>

                    <button type="submit" className="neon-button w-full text-base">
                      Send Message
                    </button>

                    <p className="text-muted/50 text-xs text-center">
                      Form submission backend to be connected.
                    </p>
                  </form>
                )}
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ===== MAP ===== */}
      <section className="pb-16 sm:pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <AnimateOnScroll>
            <div className="rounded-2xl overflow-hidden border-2 border-cyan/20 shadow-neon">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2491.5!2d0.5635!3d51.5438!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47d8d1c0e0e0e0e0%3A0x0!2s210+High+Road%2C+Benfleet+SS7+5LD!5e0!3m2!1sen!2suk!4v1700000000000"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="COCO Local on Google Maps"
                className="w-full"
              />
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </>
  );
}
