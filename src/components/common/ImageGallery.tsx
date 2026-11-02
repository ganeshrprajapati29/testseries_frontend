import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

/** Full-screen viewer with keyboard navigation. */
export function Lightbox({ images, index, onClose, onIndex }: { images: string[]; index: number; onClose: () => void; onIndex: (i: number) => void }) {
  const prev = useCallback(() => onIndex((index - 1 + images.length) % images.length), [index, images.length, onIndex]);
  const next = useCallback(() => onIndex((index + 1) % images.length), [index, images.length, onIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, prev, next]);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/90 p-4" role="dialog" aria-modal="true" aria-label="Image viewer" onClick={onClose}>
      <button type="button" onClick={onClose} className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Close">
        <X className="h-6 w-6" />
      </button>
      {images.length > 1 && (
        <>
          <button type="button" onClick={(e) => (e.stopPropagation(), prev())} className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Previous image">
            <ChevronLeft className="h-7 w-7" />
          </button>
          <button type="button" onClick={(e) => (e.stopPropagation(), next())} className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Next image">
            <ChevronRight className="h-7 w-7" />
          </button>
        </>
      )}
      <img src={images[index]} alt={`Figure ${index + 1}`} className="max-h-[88vh] max-w-[92vw] rounded-lg bg-white object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
      {images.length > 1 && <p className="absolute bottom-5 text-sm font-medium text-white/80">{index + 1} / {images.length}</p>}
    </div>,
    document.body,
  );
}

/**
 * Displays one or more figures. A single image is shown large; several images are shown in a
 * responsive grid. Every image opens in the lightbox for zooming.
 */
export function ImageGallery({ images, className, compact }: { images: string[]; className?: string; compact?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const list = images.filter(Boolean);
  if (!list.length) return null;
  const single = list.length === 1;
  return (
    <>
      <div className={cn(single ? '' : 'grid grid-cols-2 gap-3 sm:grid-cols-3', className)}>
        {list.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={() => setOpen(i)}
            className="group relative block overflow-hidden rounded-lg border border-slate-200 bg-white text-left"
            aria-label={`Open figure ${i + 1}`}
          >
            <img
              src={src}
              alt={`Figure ${i + 1}`}
              loading="lazy"
              className={cn('w-full object-contain', single ? (compact ? 'max-h-40' : 'max-h-80') : 'h-36')}
            />
            <span className="absolute right-2 bottom-2 rounded-full bg-slate-900/60 p-1.5 text-white opacity-0 transition group-hover:opacity-100">
              <ZoomIn className="h-4 w-4" />
            </span>
          </button>
        ))}
      </div>
      {open !== null && <Lightbox images={list} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </>
  );
}
