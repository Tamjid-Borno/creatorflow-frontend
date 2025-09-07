
// Drop-in replacement / fixer for your existing RouteSkin
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ALL = [
  "skin-default",
  "skin-home",
  "skin-about",
  "skin-contact",
  "skin-privacy",
  "skin-terms",
  "skin-plans",
  "skin-auth",
  "skin-app",
];

/** Sets a semantic class on <body> you can use elsewhere if needed */
export default function RouteSkin() {
  const { pathname } = useLocation();

  useEffect(() => {
    const cls = (() => {
      if (pathname === "/") return "skin-home";
      if (pathname.startsWith("/about")) return "skin-about";
      if (pathname.startsWith("/contact")) return "skin-contact";
      if (pathname.startsWith("/privacy")) return "skin-privacy";
      if (pathname.startsWith("/terms")) return "skin-terms";
      if (pathname.startsWith("/plans")) return "skin-plans";
      if (pathname.startsWith("/signup")) return "skin-auth";
      if (pathname.startsWith("/target") || pathname.startsWith("/thedoorway")) return "skin-app";
      return "skin-default";
    })();

    const b = document.body;
    b.classList.remove(...ALL);
    b.classList.add(cls);
    b.dataset.skin = cls.replace("skin-", "");
  }, [pathname]);

  return null;
}
