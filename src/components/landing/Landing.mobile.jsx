// src/components/landing/Landing.mobile.jsx
import "./Landing.mobile.css";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/* Art */
import PlanetPng from "../../assets/planetmobile.png";

/* Your PNG icons */
import InstagramPng from "../../assets/icons/instagram.png";
import TrendingPng  from "../../assets/icons/trending.png";
import IdeasPng     from "../../assets/icons/ideas.png";
import ScriptsPng   from "../../assets/icons/scripts.png";

export default function LandingMobile({ isBusy, user, handleCTA }) {
  const navigate = useNavigate();

  // Page-scoped class so background/nav only change on this route
  useEffect(() => {
    document.body.classList.add("landing-mobile");
    return () => document.body.classList.remove("landing-mobile");
  }, []);

  return (
    <div className="m-screen">
      {/* HERO (no card) */}
      <section className="m-hero" aria-busy={isBusy ? "true" : "false"}>
        {/* Shared column so H1 & sub start at the exact same x and stay centered */}
        <div className="m-copy">
          <h1 className="m-h1">
            Creator-Tested<br/>
            <span className="m-grad">Scripts</span> That<br/>
            <span className="m-grad">Actually Work</span>
          </h1>

          <p className="m-sub">
            Generate creator-ready social media scripts in seconds — keep your voice.
          </p>
        </div>

        <div className="m-actions">
          <button
            className="m-cta-primary"
            onClick={handleCTA}
            aria-label={user ? "Open your workspace" : "Create an account to get started"}
            disabled={isBusy}
          >
            {isBusy ? "Checking…" : "Generate"}
          </button>

          <button
            className="m-cta-ghost"
            type="button"
            onClick={() => navigate("/about")}
            aria-label="About CreatorFlow"
          >
            About
          </button>
        </div>
      </section>

      {/* Planet visual + gradient glow (CSS on wrapper) */}
      <div className="m-planet-wrap">
        <img
          src={PlanetPng}
          alt=""
          aria-hidden="true"
          className="m-planet"
          draggable="false"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </div>

      {/* Feature icons (PNG) */}
      <section className="m-feature-group" role="list" aria-label="Highlights">
        <Feature src={InstagramPng} label="Instagram" alt="Instagram" />
        <Feature src={TrendingPng}  label="Trending"  alt="Trending" />
        <Feature src={IdeasPng}     label="Ideas"     alt="Ideas" />
        <Feature src={ScriptsPng}   label="Scripts"   alt="Scripts" />
      </section>
    </div>
  );
}

function Feature({ src, label, alt }) {
  return (
    <div className="m-feature" role="listitem">
      <div className="m-feature-ico">
        <img src={src} alt={alt || label} loading="lazy" decoding="async" />
      </div>
      <div className="m-feature-txt">{label}</div>
    </div>
  );
}
