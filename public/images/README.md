# COCO Local — Image Placeholders

Replace the placeholder `<div>` elements in the code with real images by adding files to this folder. The site renders styled placeholder boxes until real images are provided, so it looks complete without any actual image files.

## Required Images

| File Path | Description | Recommended Size |
|---|---|---|
| `/images/logo.png` | COCO Local logo (white on transparent, with neon glow) | 200×60px |
| `/images/hero.jpg` | Homepage hero background image | 1920×1080px |
| `/images/hero-video.mp4` | Homepage hero video alternative | 1920×1080px |
| `/images/shopfront.jpg` | Photo of the shop exterior | 800×600px |
| `/images/delivery.jpg` | Delivery section photo (driver, bag, etc.) | 800×500px |

## Gallery Photos

| File Path | Description | Recommended Size |
|---|---|---|
| `/images/gallery/1.jpg` | Gallery photo 1 — interior / product shot | 600×600px |
| `/images/gallery/2.jpg` | Gallery photo 2 | 600×600px |
| `/images/gallery/3.jpg` | Gallery photo 3 | 600×600px |
| `/images/gallery/4.jpg` | Gallery photo 4 | 600×600px |
| `/images/gallery/5.jpg` | Gallery photo 5 | 600×600px |
| `/images/gallery/6.jpg` | Gallery photo 6 | 600×600px |

## Category Card Images

| File Path | Description | Recommended Size |
|---|---|---|
| `/images/categories/hot-food.jpg` | Hot food category card | 400×400px |
| `/images/categories/grocery.jpg` | Grocery & Essentials category card | 400×400px |
| `/images/categories/off-licence.jpg` | Off-licence category card | 400×400px |
| `/images/categories/delivery.jpg` | Delivery category card | 400×400px |

## Product Images

| File Path | Description | Recommended Size |
|---|---|---|
| `/images/products/chicken-wrap.jpg` | Chicken Wrap | 400×400px |
| `/images/products/cheese-ham-panini.jpg` | Cheese & Ham Panini | 400×400px |
| `/images/products/sausage-roll.jpg` | Sausage Roll | 400×400px |
| `/images/products/bbq-chicken-wings.jpg` | BBQ Chicken Wings | 400×400px |
| `/images/products/hovis-bread.jpg` | Bread — Hovis 800g | 400×400px |
| `/images/products/milk-2l.jpg` | Semi-Skimmed Milk 2L | 400×400px |
| `/images/products/free-range-eggs.jpg` | Free Range Eggs (6 pack) | 400×400px |
| `/images/products/walkers-crisps.jpg` | Walkers Crisps Multipack | 400×400px |
| `/images/products/stella-artois.jpg` | Stella Artois 4-Pack | 400×400px |
| `/images/products/barefoot-chardonnay.jpg` | Barefoot Chardonnay 75cl | 400×400px |
| `/images/products/smirnoff-vodka.jpg` | Smirnoff Vodka 70cl | 400×400px |
| `/images/products/coca-cola-2l.jpg` | Coca-Cola 2L Bottle | 400×400px |
| `/images/products/essentials-bundle.jpg` | Essentials Bundle | 400×400px |
| `/images/products/snack-pack.jpg` | Snack Pack | 400×400px |
| `/images/products/drinks-bundle.jpg` | Weekend Drinks Bundle | 400×400px |
| `/images/products/meal-deal.jpg` | Hot Food Meal Deal | 400×400px |

## How to Replace Placeholders

1. Add your image files to the paths listed above
2. In each component, the `PlaceholderImage` component renders a styled `<div>` with a hidden `<img>` tag comment
3. To activate a real image, replace the `PlaceholderImage` component with a standard `<img>` or Next.js `<Image>` component using the `src` prop value
4. The logo uses `<img src="/images/logo.png">` directly — just add the logo file and it will display automatically
