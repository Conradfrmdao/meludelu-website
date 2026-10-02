import Image from "next/image";
import type { ProductImageData } from "@/lib/types";

interface ProductImageProps {
  image: ProductImageData | null | undefined;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Tailwind aspect class; the frame keeps its shape whether or not a photo exists. */
  aspect?: string;
}

// The single image component for products (PRD 7.13). Real photography can replace
// placeholder URLs at any time without layout changes because the frame owns the shape.
export function ProductImage({ image, sizes, priority, className = "", aspect = "aspect-[4/5]" }: ProductImageProps) {
  return (
    <div className={`relative overflow-hidden bg-cream ${aspect} ${className}`}>
      {image?.url ? (
        <Image
          src={image.url}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-serif text-lg tracking-[0.2em] text-taupe/70">MELUDELU</span>
        </div>
      )}
    </div>
  );
}
