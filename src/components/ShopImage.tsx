import Image from "next/image";

type ShopImageProps = {
  name: string;
  alt: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
};

export default function ShopImage({
  name,
  alt,
  priority = false,
  className = "",
  sizes = "(max-width: 700px) calc(100vw - 36px), (max-width: 1000px) 50vw, 600px",
}: ShopImageProps) {
  return (
    <div className={`shop-photo ${className}`}>
      <Image
        src={`/images/shop/${name}.webp`}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover"
      />
    </div>
  );
}
