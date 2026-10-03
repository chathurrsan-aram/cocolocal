import type { MetadataRoute } from "next";
import { shop } from "@/lib/shop";
// /wheel is left out while it is password-protected (src/middleware.ts). Add it back when it opens to everyone.
export default function sitemap(): MetadataRoute.Sitemap { return ["", "/products", "/about", "/contact"].map(path => ({ url: shop.url + path })); }
