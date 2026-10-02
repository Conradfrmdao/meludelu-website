"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { ProductImageData } from "@/lib/types";
import { ProductImage } from "./product-image";

export function ProductGallery({ images, name }: { images: ProductImageData[]; name: string }) {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    return <ProductImage image={null} sizes="100vw" className="rounded-[var(--radius-panel)]" />;
  }

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div>
      {/* Phone: swipeable, full-bleed */}
      <div className="relative -mx-5 sm:mx-0 lg:hidden">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto sm:rounded-[var(--radius-panel)]"
          aria-label={`${name} photos`}
          role="region"
          tabIndex={0}
        >
          {images.map((img, i) => (
            <div key={img.url} className="relative aspect-[4/5] w-full shrink-0 snap-center bg-cream">
              <Image src={img.url} alt={img.alt} fill priority={i === 0} sizes="(min-width: 640px) 80vw, 100vw" className="object-cover" />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-ivory/80 px-2.5 py-1.5 backdrop-blur" aria-hidden="true">
            {images.map((img, i) => (
              <span key={img.url} className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-4 bg-charcoal" : "w-1.5 bg-charcoal/30"}`} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: large first image, the rest in a two-column grid */}
      <div className="hidden gap-3 lg:grid lg:grid-cols-2">
        {images.map((img, i) => (
          <div
            key={img.url}
            className={`relative overflow-hidden rounded-[var(--radius-card)] bg-cream ${
              i === 0 || images.length === 2 ? "col-span-2 aspect-[4/5]" : "aspect-[4/5]"
            }`}
          >
            <Image src={img.url} alt={img.alt} fill priority={i === 0} sizes={i === 0 ? "55vw" : "28vw"} className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
