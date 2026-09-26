// Coco Wheel teaser. Deliberately no link: /spin stays a private preview until launch.
export default function WheelSoon() {
  return (
    <section className="wrap wheel-soon" aria-labelledby="wheel-title">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/home/wheel-poster-480.webp"
        srcSet="/images/home/wheel-poster-480.webp 480w, /images/home/wheel-poster-720.webp 720w"
        sizes="160px"
        width={480}
        height={853}
        loading="lazy"
        decoding="async"
        alt="Coco Wheel poster: a prize wheel with slushie, coffee and snack prizes, marked coming soon"
      />
      <div>
        <p className="eyebrow">Coming soon</p>
        <h2 id="wheel-title">The Coco Wheel.</h2>
        <p>A little spin for a little treat, launching in store soon. Prizes and rules to be confirmed.</p>
      </div>
    </section>
  );
}
