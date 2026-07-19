'use client';

import { useEffect, useRef, useState } from 'react';

interface LazyVideoProps {
  src: string;
  className?: string;
}

/** Loads and plays video only when scrolled into view. */
export function LazyVideo({ src, className }: LazyVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { rootMargin: '80px', threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      src={active ? src : undefined}
      className={className}
      muted
      playsInline
      loop
      preload={active ? 'metadata' : 'none'}
    />
  );
}
