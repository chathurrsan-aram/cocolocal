import type { MetadataRoute } from "next";
import { shop } from "@/lib/shop";
export default function sitemap(): MetadataRoute.Sitemap { return ["", "/products", "/about", "/contact"].map(path => ({ url: shop.url + path })); }
