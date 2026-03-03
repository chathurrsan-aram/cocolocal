interface PlaceholderImageProps {
  label: string;
  src: string;
  className?: string;
  aspectRatio?: string;
}

export default function PlaceholderImage({
  label,
  src,
  className = "",
  aspectRatio,
}: PlaceholderImageProps) {
  return (
    <div
      className={`placeholder-box relative overflow-hidden ${className}`}
      style={aspectRatio ? { aspectRatio } : undefined}
      data-replace-src={src}
    >
      {/* To activate: replace this entire component with <img src={src} alt={label} /> */}
      <span className="text-muted/60 text-xs sm:text-sm uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}
