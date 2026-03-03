"use client";

import { useState } from "react";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import PlaceholderImage from "@/components/PlaceholderImage";

type Category = "All" | "Hot Food" | "Grocery & Essentials" | "Off-Licence" | "Delivery";

interface Product {
  name: string;
  category: Exclude<Category, "All">;
  image: string;
}

const products: Product[] = [
  // Hot Food
  { name: "Chicken Wrap", category: "Hot Food", image: "/images/products/chicken-wrap.jpg" },
  { name: "Cheese & Ham Panini", category: "Hot Food", image: "/images/products/cheese-ham-panini.jpg" },
  { name: "Sausage Roll", category: "Hot Food", image: "/images/products/sausage-roll.jpg" },
  { name: "BBQ Chicken Wings", category: "Hot Food", image: "/images/products/bbq-chicken-wings.jpg" },

  // Grocery & Essentials
  { name: "Bread — Hovis 800g", category: "Grocery & Essentials", image: "/images/products/hovis-bread.jpg" },
  { name: "Semi-Skimmed Milk 2L", category: "Grocery & Essentials", image: "/images/products/milk-2l.jpg" },
  { name: "Free Range Eggs (6 pack)", category: "Grocery & Essentials", image: "/images/products/free-range-eggs.jpg" },
  { name: "Walkers Crisps Multipack", category: "Grocery & Essentials", image: "/images/products/walkers-crisps.jpg" },

  // Off-Licence
  { name: "Stella Artois 4-Pack", category: "Off-Licence", image: "/images/products/stella-artois.jpg" },
  { name: "Barefoot Chardonnay 75cl", category: "Off-Licence", image: "/images/products/barefoot-chardonnay.jpg" },
  { name: "Smirnoff Vodka 70cl", category: "Off-Licence", image: "/images/products/smirnoff-vodka.jpg" },
  { name: "Coca-Cola 2L Bottle", category: "Off-Licence", image: "/images/products/coca-cola-2l.jpg" },

  // Delivery
  { name: "Essentials Bundle", category: "Delivery", image: "/images/products/essentials-bundle.jpg" },
  { name: "Snack Pack", category: "Delivery", image: "/images/products/snack-pack.jpg" },
  { name: "Weekend Drinks Bundle", category: "Delivery", image: "/images/products/drinks-bundle.jpg" },
  { name: "Hot Food Meal Deal", category: "Delivery", image: "/images/products/meal-deal.jpg" },
];

const categories: Category[] = ["All", "Hot Food", "Grocery & Essentials", "Off-Licence", "Delivery"];

const categoryColors: Record<string, string> = {
  "Hot Food": "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Grocery & Essentials": "bg-green-500/20 text-green-300 border-green-500/30",
  "Off-Licence": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "Delivery": "bg-cyan/20 text-cyan border-cyan/30",
};

export default function ProductsPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const filtered =
    activeCategory === "All"
      ? products
      : products.filter((p) => p.category === activeCategory);

  return (
    <>
      {/* Banner */}
      <section className="bg-navy-light border-b border-cyan/10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5 text-center">
          <p className="text-cyan font-medium text-sm sm:text-base neon-text-subtle">
            Pop in-store or message us for today&apos;s prices and offers!
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <AnimateOnScroll>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white text-center mb-4 neon-text">
              Our Products
            </h1>
            <p className="text-muted text-center max-w-xl mx-auto mb-10">
              Browse our range below. We stock everything from freshly made hot food to
              everyday groceries and a full off-licence selection.
            </p>
          </AnimateOnScroll>

          {/* Filter Tabs */}
          <AnimateOnScroll delay={0.1}>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-12">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 sm:px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                    activeCategory === cat
                      ? "bg-cyan text-navy border-cyan shadow-neon"
                      : "bg-navy-light text-muted border-cyan/10 hover:border-cyan/30 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </AnimateOnScroll>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product, i) => (
              <AnimateOnScroll key={product.name} delay={i * 0.05}>
                <div className="group bg-navy-light rounded-2xl overflow-hidden border border-cyan/10 hover:border-cyan/30 transition-all duration-500 hover:shadow-neon">
                  <PlaceholderImage
                    label="PRODUCT IMAGE"
                    src={product.image}
                    className="w-full rounded-none border-0 border-b border-dashed"
                    aspectRatio="1/1"
                  />
                  <div className="p-4 sm:p-5">
                    <span
                      className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border mb-3 ${
                        categoryColors[product.category] || ""
                      }`}
                    >
                      {product.category}
                    </span>
                    <h3 className="text-white font-semibold text-base group-hover:text-cyan transition-colors">
                      {product.name}
                    </h3>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
