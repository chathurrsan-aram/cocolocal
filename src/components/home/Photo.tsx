import { homePhotos, photoSources, type PhotoName } from "@/data/homePhotos";

type PhotoProps = {
  name: PhotoName;
  sizes: string;
  priority?: boolean;
  lowPriority?: boolean;
  className?: string;
};

// Plain <img> with our own 800/1200/2400 srcset. Width/height reserve space (no layout shift).
export default function Photo({ name, sizes, priority = false, lowPriority = false, className }: PhotoProps) {
  const { w, h, alt } = homePhotos[name];
  const { src, srcSet } = photoSources(name);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      width={w}
      height={h}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : lowPriority ? "low" : undefined}
      decoding={priority ? "sync" : "async"}
    />
  );
}
