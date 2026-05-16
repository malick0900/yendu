import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import { resolveImage } from '@/components/ImageUpload';
import { Dialog, DialogContent } from '@/components/ui/dialog';

/**
 * Photo gallery — inline swipeable carousel + click-to-zoom lightbox.
 *
 * Props:
 *   images: string[] — image URLs (raw or storage paths)
 *   alt: string — alt prefix for accessibility
 *   className: string — outer wrapper classes (e.g. height)
 */
export const PhotoGallery = ({ images = [], alt = '', className = '' }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selected, setSelected] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();
    return () => emblaApi.off('select', onSelect);
  }, [emblaApi]);

  if (images.length === 0) {
    return (
      <div className={`relative rounded-3xl bg-muted ${className}`} data-testid="gallery-empty">
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">Aucune photo</div>
      </div>
    );
  }

  const openLightbox = (i) => { setLightboxIndex(i); setLightboxOpen(true); };

  return (
    <>
      <div className={`relative rounded-3xl overflow-hidden bg-muted group ${className}`} data-testid="gallery">
        <div className="overflow-hidden h-full" ref={emblaRef}>
          <div className="flex h-full">
            {images.map((src, i) => (
              <div key={i} className="flex-[0_0_100%] min-w-0 relative">
                <button
                  type="button"
                  onClick={() => openLightbox(i)}
                  className="absolute inset-0 w-full h-full cursor-zoom-in"
                  aria-label={`Agrandir la photo ${i + 1} sur ${images.length}`}
                >
                  <img
                    src={resolveImage(src)}
                    alt={`${alt} - photo ${i + 1}`}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading={i === 0 ? 'eager' : 'lazy'}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={scrollPrev}
              aria-label="Photo précédente"
              data-testid="gallery-prev"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              aria-label="Photo suivante"
              data-testid="gallery-next"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => emblaApi?.scrollTo(i)}
                  aria-label={`Aller à la photo ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === selected ? 'w-6 bg-white' : 'w-1.5 bg-white/60'}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => openLightbox(selected)}
              aria-label="Voir en plein écran"
              data-testid="gallery-fullscreen"
              className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-xs font-medium shadow-md"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              {selected + 1} / {images.length}
            </button>
          </>
        )}
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-6xl p-0 bg-black/95 border-none">
          <Lightbox images={images} startIndex={lightboxIndex} alt={alt} onClose={() => setLightboxOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};

const Lightbox = ({ images, startIndex, alt, onClose }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ startIndex, loop: true });
  const [selected, setSelected] = useState(startIndex);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') emblaApi.scrollPrev();
      if (e.key === 'ArrowRight') emblaApi.scrollNext();
    };
    window.addEventListener('keydown', onKey);
    return () => { emblaApi.off('select', onSelect); window.removeEventListener('keydown', onKey); };
  }, [emblaApi]);

  return (
    <div className="relative w-full h-[80vh]">
      <button onClick={onClose} aria-label="Fermer" className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
        <X className="h-5 w-5" />
      </button>
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {images.map((src, i) => (
            <div key={i} className="flex-[0_0_100%] min-w-0 flex items-center justify-center">
              <img src={resolveImage(src)} alt={`${alt} - photo ${i + 1}`} className="max-h-full max-w-full object-contain" />
            </div>
          ))}
        </div>
      </div>
      {images.length > 1 && (
        <>
          <button onClick={() => emblaApi?.scrollPrev()} aria-label="Précédente" className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button onClick={() => emblaApi?.scrollNext()} aria-label="Suivante" className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 text-white text-sm font-medium">{selected + 1} / {images.length}</div>
        </>
      )}
    </div>
  );
};

export default PhotoGallery;
