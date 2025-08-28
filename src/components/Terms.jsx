import React, { useEffect, useMemo } from "react";

/**
 * TermsCosmic.jsx — v1
 * - Aesthetic cosmic-styled Terms & Conditions page
 * - Purpose: trust-building + refund disclaimer
 * - Drop-in, self-styled component
 */

const TERMS = [
  {
    title: "1. Acceptance of Terms",
    text: "By accessing or using CreatorFlow, you agree to be bound by these Terms and our Privacy Policy. If you do not agree, you may not use our services.",
  },
  {
    title: "2. Services Provided",
    text: "CreatorFlow provides AI-assisted tools to help creators generate short-form video scripts, captions, and related content ideas. We may update or modify features at any time without prior notice.",
  },
  {
    title: "3. User Responsibilities",
    text: "You agree not to misuse the platform, share harmful or illegal content, or attempt to interfere with the system. You are responsible for any content you generate and publish.",
  },
  {
    title: "4. Intellectual Property",
    text: "All site content, branding, and proprietary systems remain the property of CreatorFlow. You retain rights to the content you create using our tools.",
  },
  {
    title: "5. Subscriptions & Payments",
    text: "Subscriptions are billed in advance on a recurring basis as selected at the time of purchase. All fees are exclusive of taxes, which are your responsibility.",
  },
  {
    title: "6. Refund Policy",
    text: "All subscription payments are final and non-refundable. By subscribing, you acknowledge and agree that we do not provide refunds for any reason, including unused time, dissatisfaction, or account closure.",
  },
  {
    title: "7. Termination",
    text: "We may suspend or terminate your access if you violate these Terms. You may cancel your subscription at any time, and access will remain active until the end of your billing cycle.",
  },
  {
    title: "8. Limitation of Liability",
    text: "CreatorFlow is not liable for indirect, incidental, or consequential damages arising from your use of the service. We make no guarantees about specific performance or results.",
  },
  {
    title: "9. Governing Law",
    text: "These Terms are governed by and construed in accordance with applicable laws. Any disputes shall be resolved in the courts of our jurisdiction.",
  },
  {
    title: "10. Updates",
    text: "We may revise these Terms at any time. Updates will be effective once posted on this page. Continued use of the service means acceptance of the revised Terms.",
  },
];

function Stars({ count = 50 }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 2 + 0.6,
        delay: Math.random() * 6,
      })),
    [count]
  );
  return (
    <div className="tc-stars" aria-hidden>
      {stars.map((s) => (
        <span
          key={s.id}
          className="tc-star"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function TermsCosmic() {
  useEffect(() => {
    const id = "terms-cosmic-styles";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = CSS;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <main className="tc-wrap">
      <Stars />
      <div className="tc-aurora" />
      <div className="tc-top-feather" />

      <section className="tc-hero">
        <h1 className="tc-title">Terms & Conditions</h1>
        <p className="tc-sub">
          Please read these terms carefully before using CreatorFlow.  
          <br />Last updated: August 2025
        </p>
      </section>

      <section className="tc-body">
        {TERMS.map((item, i) => (
          <article key={i} className="tc-card">
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </article>
        ))}
      </section>

      <footer className="tc-footer">
        <p>© {new Date().getFullYear()} CreatorFlow. All rights reserved.</p>
      </footer>
    </main>
  );
}

const CSS = `
:root {
  --tc-bg: #090112;
  --tc-fg: #ebe6ff;
  --tc-muted: #bfb6d6;
  --tc-accent: #a55cff;
  --tc-border: rgba(165,92,255,.28);
  --tc-ease: cubic-bezier(.4,0,.2,1);
}

.tc-wrap {
  position: relative;
  color: var(--tc-fg);
  background: none;
  isolation: isolate;
  overflow: hidden;
  padding: 80px 20px;
  min-height: 100vh;
}

.tc-top-feather {
  position: absolute;
  inset: 0 0 auto 0;
  height: 160px;
  background: linear-gradient(to bottom, var(--tc-bg), transparent);
  opacity: .95;
  z-index: 0;
}

.tc-aurora {
  position: absolute;
  inset: -25%;
  z-index: 0;
  background: conic-gradient(from 230deg at 50% 50%, #5b3aa999, #126b7f88, #a93a9e88, #5b3aa999);
  filter: blur(160px) saturate(.9) brightness(.7);
  opacity: .18;
  animation: tc-drift 40s linear infinite;
}
@keyframes tc-drift {
  0% { transform: rotate(0) }
  50% { transform: rotate(180deg) }
  100% { transform: rotate(360deg) }
}

.tc-stars {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.tc-star {
  position: absolute;
  display: block;
  background: #fff;
  border-radius: 999px;
  filter: drop-shadow(0 0 8px #ffffffaa);
  opacity: .7;
  animation: tc-twinkle 6s ease-in-out infinite;
}
@keyframes tc-twinkle {
  0%,100% { opacity:.4; transform: scale(.9) }
  50% { opacity:1; transform: scale(1.2) }
}

.tc-hero {
  position: relative;
  z-index: 1;
  text-align: center;
  margin-bottom: 40px;
}
.tc-title {
  font-size: clamp(32px, 4vw, 56px);
  margin: 0 0 12px;
  background: linear-gradient(90deg, #fff, #dcd3ff 30%, var(--tc-accent));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.tc-sub {
  color: var(--tc-muted);
  font-size: 16px;
  max-width: 720px;
  margin: 0 auto;
}

.tc-body {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
  display: grid;
  gap: 16px;
}
.tc-card {
  padding: 20px;
  border: 1px solid var(--tc-border);
  border-radius: 16px;
  background: rgba(255,255,255,.04);
  backdrop-filter: blur(6px);
  transition: transform .2s var(--tc-ease), box-shadow .2s var(--tc-ease);
}
.tc-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0,0,0,.45);
}
.tc-card h2 {
  margin: 0 0 8px;
  font-size: 18px;
  background: linear-gradient(90deg, #fff, var(--tc-accent));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.tc-card p {
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
  color: #efeaff;
}

.tc-footer {
  margin-top: 50px;
  text-align: center;
  font-size: 13px;
  color: var(--tc-muted);
  opacity: .9;
}
`;
