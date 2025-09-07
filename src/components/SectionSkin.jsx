
import React, { useEffect, useRef } from "react";

/**
 * SectionSkin
 * When this section is visibly in viewport (~60%), it temporarily overrides
 * the cosmic background skin by setting document.body.dataset.skin = {skin}.
 * On exit, it restores route-based skin automatically.
 *
 * Usage:
 * <SectionSkin skin="facilities">
 *   <Facilities />
 * </SectionSkin>
 */
export default function SectionSkin({ skin, rootMargin = "0px", threshold = 0.6, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onEnter = () => {
      document.body.dataset.skin = skin;
      window.dispatchEvent(new Event("skinchange"));
    };

    const onLeave = () => {
      // Only clear if we were the one who set it
      if (document.body.dataset.skin === skin) {
        delete document.body.dataset.skin;
        window.dispatchEvent(new Event("skinchange"));
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
            onEnter();
          } else {
            onLeave();
          }
        });
      },
      { root: null, rootMargin, threshold: Array.from({ length: 11 }, (_, i) => i / 10) }
    );

    io.observe(el);
    return () => {
      io.disconnect();
      onLeave();
    };
  }, [skin, rootMargin, threshold]);

  return <div ref={ref}>{children}</div>;
}
