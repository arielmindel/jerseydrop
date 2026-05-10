"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { BLUR_DATA_URL } from "@/lib/image-placeholder";

/**
 * Mobile: full-width swipeable Embla carousel + dot pagination.
 * Desktop: thumbnail column on the start side + large main image.
 * Tap any image to open a fullscreen zoom modal (pinch via native zoom).
 */
export default function ProductGalleryV2({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  // Embla carousel for the mobile swipeable view (RTL-aware)
  const [emblaRef, emblaApi] = useEmblaCarousel({
    direction: "rtl",
    align: "start",
    loop: false,
  });

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setActiveIdx(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (i: number) => {
      emblaApi?.scrollTo(i);
      setActiveIdx(i);
    },
    [emblaApi],
  );

  const main = images[activeIdx] || images[0];

  return (
    <>
      {/* ===== MOBILE — swipeable Embla carousel ===== */}
      <div className="md:hidden">
        <div className="relative overflow-hidden rounded-2xl bg-surface" ref={emblaRef}>
          <div className="flex">
            {images.map((src, i) => (
              <button
                key={`m-${i}`}
                type="button"
                onClick={() => setZoomOpen(true)}
                className="relative aspect-[3/4] w-full flex-[0_0_100%]"
                aria-label={`תמונה ${i + 1} מתוך ${images.length}`}
              >
                <Image
                  src={src}
                  alt={alt}
                  fill
                  sizes="100vw"
                  priority={i === 0}
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  className="object-cover"
                />
              </button>
            ))}
          </div>
          {/* Zoom hint */}
          <div className="pointer-events-none absolute end-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
            <ZoomIn className="h-3 w-3" />
            הגדל
          </div>
        </div>
        {/* Pagination dots */}
        {images.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5" role="tablist">
            {images.map((_, i) => (
              <button
                key={`dot-${i}`}
                type="button"
                role="tab"
                aria-selected={activeIdx === i}
                aria-label={`עבור לתמונה ${i + 1}`}
                onClick={() => scrollTo(i)}
                className={`h-2 rounded-full transition-all duration-200 ${
                  activeIdx === i
                    ? "w-6 bg-[#00FF88]"
                    : "w-2 bg-white/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ===== DESKTOP — thumbnail column + main ===== */}
      <div className="hidden md:flex md:gap-4">
        {/* Thumbnail column (RTL: visually start = right) */}
        {images.length > 1 && (
          <div className="flex flex-col gap-3">
            {images.slice(0, 5).map((src, i) => (
              <button
                key={`thumb-${i}`}
                type="button"
                onClick={() => setActiveIdx(i)}
                aria-label={`תמונה ${i + 1}`}
                className={`relative h-20 w-20 overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                  activeIdx === i
                    ? "border-[#00FF88] shadow-[0_0_15px_rgba(0,255,136,0.3)]"
                    : "border-white/10 opacity-70 hover:border-white/30 hover:opacity-100"
                }`}
              >
                <Image
                  src={src}
                  alt={`${alt} ${i + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
        {/* Main image */}
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          className="group relative aspect-[3/4] flex-1 overflow-hidden rounded-2xl border border-white/10 bg-surface"
          aria-label="הגדל תמונה"
        >
          <Image
            key={`main-${activeIdx}`}
            src={main}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 600px, 50vw"
            priority
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
          <div className="pointer-events-none absolute end-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
            <ZoomIn className="h-4 w-4" />
            הגדל
          </div>
        </button>
      </div>

      {/* ===== ZOOM MODAL ===== */}
      {zoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="תצוגה מורחבת"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setZoomOpen(false)}
        >
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            aria-label="סגור"
            className="absolute end-4 top-4 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  scrollTo((activeIdx - 1 + images.length) % images.length);
                }}
                aria-label="הקודם"
                className="absolute end-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 md:inline-flex"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  scrollTo((activeIdx + 1) % images.length);
                }}
                aria-label="הבא"
                className="absolute start-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 md:inline-flex"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            </>
          )}
          <div
            className="relative h-full max-h-[90vh] w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={main}
              alt={alt}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
