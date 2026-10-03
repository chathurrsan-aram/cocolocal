import type { Metadata } from "next";
import Link from "next/link";
import { shop } from "@/lib/shop";

export const metadata: Metadata = {
  title: "Coco Wheel preview",
  robots: { index: false, follow: false },
  alternates: { canonical: "/wheel/unlock" },
};

const MESSAGES: Record<string, string> = {
  "1": "That password isn’t right. Please check it and try again.",
  busy: "Too many tries in a minute. Please wait a moment and try again.",
};

// The password screen in front of /wheel (see src/middleware.ts). A plain form, so it works without JavaScript.
export default async function WheelUnlock({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const message = error ? MESSAGES[error] ?? MESSAGES["1"] : "";
  return (
    <section className="wrap gate" aria-labelledby="gate-title">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="gate-art" src="/wheel/hero-poster.webp" width={540} height={840} alt="" />
      <div className="gate-card">
        <span className="sticker">Sneak preview</span>
        <h1 id="gate-title">The Coco Wheel is <span>nearly here</span></h1>
        <p>We’re testing it with a few neighbours first. Got the password? Pop it in to have a spin.</p>
        <form className="entry-form gate-form" method="post" action="/api/wheel/unlock">
          <div className="entry-field">
            <label htmlFor="gate-password">Password</label>
            <input id="gate-password" name="password" type="password" autoComplete="off" autoCapitalize="none" spellCheck={false}
              required maxLength={200} autoFocus aria-invalid={message ? true : undefined} aria-describedby={message ? "gate-error" : undefined} />
          </div>
          {message && <p id="gate-error" className="wheel-error" role="alert">{message}</p>}
          <button type="submit" className="button entry-submit">Unlock the wheel</button>
        </form>
        <p className="wheel-small">No password yet? Follow us on <a href={shop.instagram}>Instagram</a> or <a href={shop.facebook}>Facebook</a> to hear when it opens to everyone. <Link href="/">Back to Coco Local</Link></p>
      </div>
    </section>
  );
}
