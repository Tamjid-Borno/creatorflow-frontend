
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";

/** Wrap your routed pages to fade/slide content smoothly between routes */
export default function PageTransition({ children }) {
  const location = useLocation();
  const reduceMotion = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const perfLow = typeof document !== "undefined" && document.documentElement.classList.contains("perf-low");

  if (reduceMotion || perfLow) {
    // Render without motion to avoid jank on low-end devices
    return <div>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.28, ease: "easeInOut" }}
        style={{ willChange: "opacity, transform" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
