"use client";

import { ReactNode } from "react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

interface LazySectionProps {
  children: ReactNode;
  onVisible?: () => void;
  fallback?: ReactNode;
  className?: string;
}

export function LazySection({ children, onVisible, fallback, className }: LazySectionProps) {
  const [ref, isVisible] = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true,
  });

  if (isVisible && onVisible) {
    onVisible();
  }

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : (fallback || <div className="h-64" />)}
    </div>
  );
}
