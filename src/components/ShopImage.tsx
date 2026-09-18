import Image from "next/image";
export default function ShopImage({ name, alt, priority = false, className = "" }: {
    name: string;
    alt: string;
    priority?: boolean;
    className?: string;
}) {
    return <div className={`shop-photo ${className}`}><Image src={`/images/shop/${name}.webp`} alt={alt} fill priority={priority} sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 600px" className="object-cover"/></div>;
}
