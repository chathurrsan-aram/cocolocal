"use client";

import { useInViewOnce } from "./useInViewOnce";
import styles from "./PriceDrop.module.css";

// Offer price that drops in with the motion kit's timing (a firm spring, tiny settle)
// and a yellow underline that sweeps in after it. `index` staggers cards in a row.
export default function PriceDrop({ children, index = 0, className = "" }: { children: React.ReactNode; index?: number; className?: string }) {
  const { ref, armed, inView } = useInViewOnce<HTMLParagraphElement>(0.6);
  const state = armed && !inView ? styles.armed : armed && inView ? styles.play : "";
  return (
    <p ref={ref} className={`${styles.price} ${state} ${className}`} style={{ ["--d" as string]: `${(index % 3) * 0.09}s` }}>
      <span className={styles.value}>{children}</span>
      <span className={styles.bar} aria-hidden="true" />
    </p>
  );
}
