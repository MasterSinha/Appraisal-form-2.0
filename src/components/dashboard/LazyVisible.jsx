import { useEffect, useRef } from "react";

// Fires onVisible once, the first time this wrapper scrolls within `rootMargin` of the
// viewport - used to defer per-card enrichment (doc counts, legacy scores) on large review
// queues (e.g. VC's, which spans the whole university) until a card is actually about to be
// seen, instead of fetching every person's data up front.
export default function LazyVisible({ children, onVisible, rootMargin = "300px", triggerKey, as: Tag = "div", style }) {
  const ref = useRef(null);
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
  }, [triggerKey]);

  useEffect(() => {
    const node = ref.current;
    if (!node || firedRef.current || typeof IntersectionObserver === "undefined") {
      if (!firedRef.current && typeof IntersectionObserver === "undefined") {
        firedRef.current = true;
        onVisible?.();
      }
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (firedRef.current) return;
        if (entries.some((entry) => entry.isIntersecting)) {
          firedRef.current = true;
          onVisible?.();
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey, rootMargin]);

  return (
    <Tag ref={ref} style={style}>
      {children}
    </Tag>
  );
}
