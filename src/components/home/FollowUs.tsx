import { ArrowUpRight } from "lucide-react";
import LoopVideo from "./LoopVideo";
import { shop } from "@/lib/shop";

export default function FollowUs() {
  return (
    <section className="wrap follow" aria-labelledby="follow-title">
      <div className="follow-mark"><LoopVideo name="logo-reveal" width={480} height={480} loop={false} /></div>
      <div className="follow-copy">
        <h2 id="follow-title">Follow Coco Local.</h2>
        <p>New offers and what’s in store, first on Instagram and Facebook.</p>
        <div className="follow-links">
          <a href={shop.instagram} className="follow-link"><span>Instagram</span><strong>@cocolocal_</strong><ArrowUpRight size={20} aria-hidden="true" /></a>
          <a href={shop.facebook} className="follow-link"><span>Facebook</span><strong>Coco Local</strong><ArrowUpRight size={20} aria-hidden="true" /></a>
        </div>
      </div>
    </section>
  );
}
