import Link from "next/link";
import { Facebook, Instagram, Music2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-navy-dark border-t border-cyan/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Logo & About */}
          <div className="sm:col-span-2 lg:col-span-1">
            <img
              src="/images/logo.png"
              alt="COCO Local"
              className="h-10 w-auto object-contain mb-4"
              style={{ filter: "drop-shadow(0 0 8px #00e5ff88)" }}
            />
            <p className="text-muted text-sm leading-relaxed">
              Your neighbourhood convenience store on High Road, Benfleet. Quality products, hot food, and friendly service — every single day.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Home" },
                { href: "/about", label: "About Us" },
                { href: "/products", label: "Products" },
                { href: "/delivery", label: "Delivery" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted text-sm hover:text-cyan transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-muted text-sm">
              <li>210 High Road</li>
              <li>Benfleet, Essex SS7 5LD</li>
              {/* REPLACE: Update with real phone number */}
              <li>
                <a href="tel:07XXXXXXXXX" className="hover:text-cyan transition-colors">
                  07XXXXXXXXX
                </a>
              </li>
              {/* REPLACE: Update with real email */}
              <li>
                <a href="mailto:hello@cocolocal.co.uk" className="hover:text-cyan transition-colors">
                  hello@cocolocal.co.uk
                </a>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div>
            <h3 className="text-white font-semibold mb-4">Opening Hours</h3>
            <ul className="space-y-2 text-muted text-sm">
              <li className="flex justify-between">
                <span>Mon – Sat</span>
                <span className="text-white">7:00 AM – 10:00 PM</span>
              </li>
              <li className="flex justify-between">
                <span>Sunday</span>
                <span className="text-white">8:00 AM – 9:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-cyan/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted text-sm">
            &copy; 2025 COCO Local. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {/* REPLACE: Update href with real Facebook page URL */}
            <a
              href="#"
              aria-label="Facebook"
              className="text-muted hover:text-cyan transition-colors duration-300"
            >
              <Facebook size={20} />
            </a>
            {/* REPLACE: Update href with real Instagram page URL */}
            <a
              href="#"
              aria-label="Instagram"
              className="text-muted hover:text-cyan transition-colors duration-300"
            >
              <Instagram size={20} />
            </a>
            {/* REPLACE: Update href with real TikTok page URL */}
            <a
              href="#"
              aria-label="TikTok"
              className="text-muted hover:text-cyan transition-colors duration-300"
            >
              <Music2 size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
