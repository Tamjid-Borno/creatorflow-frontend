import "./Landing.desktop.css";
import MyImage from "../../assets/planet.png";
import { IonIcon } from "@ionic/react";
import { bulbOutline, chatboxEllipsesOutline, flashOutline, logoInstagram } from "ionicons/icons";

export default function LandingDesktop({ animate, isBusy, user, handleCTA, rightBoxRef }) {
  return (
    <div className="landing-root">
      <div className="landing-overlay" aria-hidden="true" />
      <main className="landing-container" aria-busy={isBusy ? "true" : "false"}>
        <section className="grid-container">
          <div className="grid-box left-box">
            <h1 className="headline">Creator-Tested Scripts That Actually Work</h1>
            <p className="subtext">
              Thousands of hooks, trends, and formulas<br />— distilled into scripts
              you can generate in seconds.<br />Because your content deserves to win.
            </p>
            <button
              className="cta-button"
              onClick={handleCTA}
              aria-label={user ? "Open your workspace" : "Create an account to get started"}
              disabled={isBusy}
            >
              {isBusy ? "Checking credits…" : "Generate"}
            </button>
          </div>

          <div className={`grid-box right-box ${animate ? "is-visible" : ""}`} ref={rightBoxRef}>
            <img
              src={MyImage}
              alt="Stylized planet artwork representing creative ideas orbiting"
              className="box-image"
              draggable="false"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </div>
        </section>

        <section className="glassmorphic-box" role="list" aria-label="Highlights">
          <Feature icon={logoInstagram} label="Instagram" />
          <Feature icon={flashOutline} label="Trending" />
          <Feature icon={bulbOutline} label="Ideas" />
          <Feature icon={chatboxEllipsesOutline} label="Scripts" />
        </section>
      </main>
    </div>
  );
}

function Feature({ icon, label }) {
  return (
    <div className="icon-wrapperr" role="listitem">
      <IonIcon icon={icon} className="custom-icon" aria-hidden="true" />
      <p className="para">{label}</p>
    </div>
  );
}
