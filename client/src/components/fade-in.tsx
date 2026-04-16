import { ReactNode } from "react";
import { useInView } from "@/hooks/use-in-view";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Fades its children in with a slide-up when they scroll into view.
 * Uses the .scroll-fade CSS utility in index.css.
 */
export function FadeIn({ children, className = "", delay = 0 }: FadeInProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const style = delay ? { transitionDelay: `${delay}ms` } : undefined;
  return (
    <div ref={ref} className={`scroll-fade ${inView ? "visible" : ""} ${className}`} style={style}>
      {children}
    </div>
  );
}
