"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { FiChevronLeft, FiChevronRight, FiMaximize2, FiX } from "react-icons/fi";

export default function ImageGallery({ images }) {
  const [current, setCurrent] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const prev = useCallback(() => setCurrent((p) => (p === 0 ? images.length - 1 : p - 1)), [images]);
  const next = useCallback(() => setCurrent((p) => (p === images.length - 1 ? 0 : p + 1)), [images]);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-2xl flex flex-col items-center justify-center gap-3">
        <span className="text-6xl">📷</span>
        <p className="text-sm text-gray-400">No images available</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Main image */}
        <div className="relative aspect-square overflow-hidden rounded-[1.75rem] border border-gray-100 bg-gray-50 group">
          <Image
            src={images[current].url}
            alt="Product"
            fill
            className="object-contain transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />

          {/* Fullscreen button */}
          <button
            onClick={() => setFullscreen(true)}
            className="absolute top-3 right-3 rounded-xl bg-black/45 p-2 text-white opacity-100 transition-all backdrop-blur-sm hover:bg-black/60 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <FiMaximize2 size={16} />
          </button>

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full">
              {current + 1} / {images.length}
            </div>
          )}

          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-xl bg-white/90 p-2 shadow-lg transition-all hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
              >
                <FiChevronLeft size={18} />
              </button>
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-white/90 p-2 shadow-lg transition-all hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
              >
                <FiChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all sm:h-20 sm:w-20 ${
                  current === index
                    ? "border-primary-600 ring-2 ring-primary-200 scale-105"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Image src={img.url} alt={`Thumbnail ${index + 1}`} fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen lightbox */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95" onClick={() => setFullscreen(false)}>
          <button className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] z-10 p-2 text-white/70 hover:text-white" onClick={() => setFullscreen(false)}>
            <FiX size={24} />
          </button>
          <div className="relative w-full h-full max-w-5xl max-h-[85vh] mx-4" onClick={(e) => e.stopPropagation()}>
            <Image src={images[current].url} alt="Product fullscreen" fill className="object-contain" sizes="100vw" />
          </div>
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm">
                <FiChevronLeft size={24} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm">
                <FiChevronRight size={24} />
              </button>
            </>
          )}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setCurrent(i); }} className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-white scale-125" : "bg-white/40"}`} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
