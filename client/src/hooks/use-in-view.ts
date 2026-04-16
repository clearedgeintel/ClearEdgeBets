import { useEffect, useRef, useState } from "react";

/**
 * Observe an element and toggle a boolean when it enters the viewport.
 * Pair with the `.scroll-fade` / `.scroll-fade.visible` CSS utility for
 * a subtle slide-up fade on reveal.
 *
 * Usage:
 *   const { ref, inView } = useInView();
 *   <div ref={ref} className={`scroll-fade ${inView ? 'visible' : ''}`}>
 */
export function useInView<T extends Element = HTMLDivElement>(options?: {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  const { threshold = 0.1, rootMargin = "0px 0px -40px 0px", once = true } = options || {};

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.unobserve(entry.target);
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, inView };
}
