// src/contexts/DeviceContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const DeviceCtx = createContext({ isMobile: false, isDesktop: true });

function computeIsMobile(bp = 768) {
  if (typeof window === "undefined") return false;
  // Prefer matchMedia
  if (window.matchMedia) {
    try {
      return window.matchMedia(`(max-width: ${bp}px)`).matches;
    } catch {}
  }
  // Fallback to innerWidth
  return window.innerWidth <= bp;
}

export function DeviceProvider({ children, breakpoint = 768 }) {
  // URL override – add ?mobile=1 to force mobile, ?mobile=0 to force desktop
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const override = params?.get("mobile");
  const forced = override === "1" ? true : override === "0" ? false : null;

  const [isMobileState, setIsMobileState] = useState(() =>
    forced ?? computeIsMobile(breakpoint)
  );

  useEffect(() => {
    if (forced !== null) {
      setIsMobileState(forced);
      return;
    }

    const update = () => setIsMobileState(computeIsMobile(breakpoint));

    // Listen to changes
    const mq = window.matchMedia?.(`(max-width: ${breakpoint}px)`);
    mq?.addEventListener?.("change", update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    // Initial sync (for some browsers)
    update();

    return () => {
      mq?.removeEventListener?.("change", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [breakpoint, forced]);

  const value = useMemo(
    () => ({ isMobile: isMobileState, isDesktop: !isMobileState }),
    [isMobileState]
  );

  return <DeviceCtx.Provider value={value}>{children}</DeviceCtx.Provider>;
}

export const useDevice = () => useContext(DeviceCtx);
