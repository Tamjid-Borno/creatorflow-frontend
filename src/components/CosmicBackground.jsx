
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Crossfading gradient background tied to the current route ("skin").
 * Supports in-page overrides by setting document.body.dataset.skin and dispatching 'skinchange'.
 */
export default function CosmicBackground() {
  const location = useLocation();
  const [activeSkin, setActiveSkin] = useState("home");
  const [overrideSkin, setOverrideSkin] = useState(null);
  const aRef = useRef(null);
  const bRef = useRef(null);
  const frontIsA = useRef(true);

  // Listen for external skin overrides (e.g., sections with data-skin + IntersectionObserver)
  useEffect(() => {
    const handler = () => {
      const s = document.body?.dataset?.skin || null;
      setOverrideSkin(s);
    };
    window.addEventListener("skinchange", handler);
    // prime initial
    handler();
    return () => window.removeEventListener("skinchange", handler);
  }, []);

  const routeSkin = useMemo(() => {
    const p = location.pathname;
    if (p === "/") return "home";
    if (p.startsWith("/about")) return "about";
    if (p.startsWith("/contact")) return "contact";
    if (p.startsWith("/privacy")) return "privacy";
    if (p.startsWith("/terms")) return "terms";
    if (p.startsWith("/plans")) return "plans";
    if (p.startsWith("/signup")) return "auth";
    if (p.startsWith("/target") || p.startsWith("/thedoorway")) return "app";
    return "default";
  }, [location.pathname]);

  const skin = overrideSkin || routeSkin;

  useEffect(() => {
    if (skin === activeSkin) return;
    const show = frontIsA.current ? bRef.current : aRef.current;
    const hide = frontIsA.current ? aRef.current : bRef.current;

    if (show) {
      show.className = `cosmic-bg__layer bg-skin--${skin}`;
      void show.offsetHeight; // reflow before fade
      show.classList.add("is-active");
    }
    if (hide) hide.classList.remove("is-active");

    frontIsA.current = !frontIsA.current;
    setActiveSkin(skin);
  }, [skin, activeSkin]);

  return (
    <div className="cosmic-bg" aria-hidden>
      <div ref={aRef} className="cosmic-bg__layer bg-skin--home is-active" />
      <div ref={bRef} className="cosmic-bg__layer bg-skin--base" />
      <div className="cosmic-stars" />
      <div className="cosmic-aurora" />
    </div>
  );
}
