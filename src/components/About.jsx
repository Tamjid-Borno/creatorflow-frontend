import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * AboutCosmic.jsx — v2 (humanized copy + your team)
 * - Same cosmic/dark aesthetic, more professional
 * - Warmer, more conversational, psychologically “clicky” copy
 * - Team updated: Borno (Engineering), Mansib (Design), Raju (Project idea & Marketing)
 * - One-file, no external deps
 */

const DEFAULT_HERO = {
  eyebrow: "About us",
  title: "Turning blank screens into viral stories",
  subtitle:
    "We’re a small crew of dreamers and builders helping creators stop overthinking and start posting. If you’ve ever stared at a blinking cursor with zero ideas — that’s exactly the moment we’re here for.",
  metrics: [
    { label: "Creators using us", value: "12.8K+" },
    { label: "Scripts written", value: "356K+" },
    { label: "Avg. rating", value: "4.9/5" },
  ],
};

const DEFAULT_WHAT = [
  {
    title: "Ideas when you need them",
    text: "Never again open Instagram with nothing to post. We hand you hooks, angles, and templates the moment you need them.",
  },
  {
    title: "Your voice, amplified",
    text: "We don’t replace you — we sound like you. Every script still feels personal, just sharper and scroll-stopping.",
  },
  {
    title: "Less stress, more speed",
    text: "Batch a month’s worth of content in one coffee break. That frees your brain to actually focus on creating.",
  },
];

const DEFAULT_HOW = [
  {
    step: 1,
    title: "We learn your vibe",
    text: "Your niche, your audience, your quirks — all taken into account. No generic one-liners.",
  },
  {
    step: 2,
    title: "We hand you drafts",
    text: "Hooks, captions, story beats — ready to use. You can accept, tweak, or remix in seconds.",
  },
  {
    step: 3,
    title: "You test fast",
    text: "Post A/B hooks, watch what sticks, and double down on what’s working. No more guessing.",
  },
  {
    step: 4,
    title: "You hit publish with confidence",
    text: "Scripts come pre-formatted for Reels, Shorts, and TikTok. All that’s left is to record.",
  },
];

const DEFAULT_VALUES = [
  "Creators come first",
  "Your voice matters",
  "Privacy isn’t optional",
  "Evidence over ego",
  "Keep it simple",
  "Fast > Fancy",
];

const DEFAULT_STORY = [
  {
    date: "2023 → Just an idea",
    text: "We hacked together a tiny tool for a friend who was stuck writing hooks. It worked — and we knew we were onto something.",
  },
  {
    date: "2024 → Beta mode",
    text: "We invited a small group of creators, hopped on late-night calls, and fixed every annoying bug they found.",
  },
  {
    date: "2025 → Public launch",
    text: "Now we’re live. Bigger community, smarter tools, but still the same mission: make posting every day feel effortless.",
  },
];

const DEFAULT_TEAM = [
  { name: "Borno", role: "Engineering" },
  { name: "Mansib", role: "Design" },
  { name: "Raju", role: "Project idea & Marketing" },
];

const DEFAULT_FAQ = [
  {
    q: "Do you replace human creativity?",
    a: "Nope. Think of us as your brainstorming buddy. We spark the ideas, you bring the personality.",
  },
  {
    q: "Is my content safe?",
    a: "Yes. Your data stays private, and you can delete everything anytime. We don’t train shared models on your posts.",
  },
  {
    q: "What platforms does this work for?",
    a: "Right now: Instagram Reels, YouTube Shorts, TikTok. The formats are universal — so anywhere short-form lives, we can help.",
  },
  {
    q: "Can my team use this too?",
    a: "Absolutely. Shared workspaces mean editors, writers, and creators can all jam inside the same tool.",
  },
];

function useOnceInView(ref, opts = { threshold: 0.1 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      });
    }, opts);
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, visible, opts]);
  return visible;
}

function Stars({ count = 70 }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 2.2 + 0.6,
        delay: Math.random() * 7,
      })),
    [count]
  );
  return (
    <div className="ab-stars" aria-hidden>
      {stars.map((s) => (
        <span
          key={s.id}
          className="ab-star"
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

function SectionHeader({ eyebrow, title, subtitle, align = "center" }) {
  return (
    <header className={`ab-header ${align === "left" ? "left" : ""}`}>
      {eyebrow && <span className="ab-eyebrow">{eyebrow}</span>}
      {title && <h2>{title}</h2>}
      {subtitle && <p>{subtitle}</p>}
    </header>
  );
}

function Card({ title, text, icon }) {
  return (
    <article className="ab-card">
      {icon ? <div className="ab-card-icon" aria-hidden>{icon}</div> : null}
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function Step({ step, title, text }) {
  return (
    <div className="ab-step">
      <div className="ab-step-num" aria-hidden>{step}</div>
      <div className="ab-step-body">
        <h4>{title}</h4>
        <p>{text}</p>
      </div>
    </div>
  );
}

function TeamAvatar({ name }) {
  const initials = useMemo(
    () =>
      name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase(),
    [name]
  );
  return <div className="ab-avatar" aria-hidden>{initials}</div>;
}

function FAQItem({ q, a, idx }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`ab-faq-item ${open ? "open" : ""}`}>
      <button
        className="ab-faq-q"
        aria-expanded={open}
        aria-controls={`faq-${idx}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{q}</span>
        <svg className="ab-faq-caret" width="16" height="16" viewBox="0 0 24 24" aria-hidden>
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
      <div id={`faq-${idx}`} className="ab-faq-a">
        <p>{a}</p>
      </div>
    </div>
  );
}

export default function AboutCosmic({
  hero = DEFAULT_HERO,
  what = DEFAULT_WHAT,
  how = DEFAULT_HOW,
  values = DEFAULT_VALUES,
  story = DEFAULT_STORY,
  team = DEFAULT_TEAM,
  faq = DEFAULT_FAQ,
  showCTA = false, // you have a global CTA; default off
}) {
  // Inject CSS once
  useEffect(() => {
    const id = "about-cosmic-styles";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = CSS;
      document.head.appendChild(style);
    }
  }, []);

  const wrapRef = useRef(null);
  const visible = useOnceInView(wrapRef, { threshold: 0.08 });

  return (
    <main ref={wrapRef} className={`ab-wrap ${visible ? "ab-visible" : ""}`}>
      {/* Cosmic background */}
      <Stars />
      <div className="ab-aurora" aria-hidden />
      <div className="ab-top-feather" aria-hidden />

      {/* Hero */}
      <section className="ab-hero">
        <div className="ab-hero-inner">
          {hero.eyebrow && <div className="ab-hero-eyebrow">{hero.eyebrow}</div>}
          <h1 className="ab-hero-title">{hero.title}</h1>
          <p className="ab-hero-sub">{hero.subtitle}</p>
          {hero.metrics?.length ? (
            <div className="ab-hero-metrics" role="list">
              {hero.metrics.map((m, i) => (
                <div key={i} className="ab-metric" role="listitem">
                  <div className="ab-metric-value">{m.value}</div>
                  <div className="ab-metric-label">{m.label}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* What we do */}
      <section className="ab-section">
        <SectionHeader
          eyebrow="What we do"
          title="From blank page to published"
          subtitle="Tools that turn good ideas into repeatable formats — so posting daily doesn’t feel like a second job."
        />
        <div className="ab-grid three">
          {what.map((w, i) => (
            <Card key={i} title={w.title} text={w.text} icon={["💡", "🎙️", "⚡"][i] || "✨"} />
          ))}
        </div>
      </section>

      {/* How we work */}
      <section className="ab-section">
        <SectionHeader
          eyebrow="How we work"
          title="A simple system for consistent output"
          subtitle="Understand → Generate → Test → Publish."
        />
        <div className="ab-steps">
          {how.map((h) => (
            <Step key={h.step} step={h.step} title={h.title} text={h.text} />
          ))}
        </div>
      </section>

      {/* Principles */}
      <section className="ab-section">
        <SectionHeader
          eyebrow="Principles"
          title="Things we refuse to compromise"
          subtitle="Clarity, speed, and your voice come first."
        />
        <div className="ab-values">
          {values.map((v, i) => (
            <span key={i} className="ab-chip">{v}</span>
          ))}
        </div>
      </section>

      {/* Story / Timeline */}
      <section className="ab-section">
        <SectionHeader
          eyebrow="Our story"
          title="Built with creators, not just for them"
          subtitle="We ship small, test weekly, and keep what works."
        />
        <div className="ab-timeline">
          {story.map((s, i) => (
            <div key={i} className="ab-time-item">
              <div className="ab-time-date">{s.date}</div>
              <div className="ab-time-dot" aria-hidden />
              <div className="ab-time-text">{s.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="ab-section">
        <SectionHeader
          eyebrow="Team"
          title="Small team, focused craft"
          subtitle="We’re building deliberately: fewer features, better outcomes."
        />
        <div className="ab-grid four">
          {team.map((t, i) => (
            <div key={i} className="ab-team-card">
              <TeamAvatar name={t.name} />
              <div className="ab-team-text">
                <strong>{t.name}</strong>
                <span>{t.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="ab-section">
        <SectionHeader
          eyebrow="FAQ"
          title="Good questions"
          subtitle="If it’s not answered here, we’re one message away."
        />
        <div className="ab-faq">
          {faq.map((f, i) => (
            <FAQItem key={i} idx={i} q={f.q} a={f.a} />
          ))}
        </div>
      </section>

      {/* Optional CTA (off by default) */}
      {showCTA && (
        <section className="ab-cta">
          <a className="ab-cta-btn" href="#get-started" onClick={(e) => e.preventDefault()}>
            Get started
          </a>
          <span className="ab-cta-note">No credit card • Cancel anytime</span>
        </section>
      )}
    </main>
  );
}

const CSS = `
:root{
  --ab-bg: #090112;
  --ab-fg: #ebe6ff;
  --ab-muted: #bfb6d6;
  --ab-accent: #a55cff;
  --ab-border: rgba(165,92,255,.28);
  --ab-ease: cubic-bezier(.4,0,.2,1);
}

.ab-wrap{ position:relative; color:var(--ab-fg); background:none; isolation:isolate; overflow:hidden;
  opacity:0; transform:translateY(28px); transition:opacity .8s var(--ab-ease), transform .8s var(--ab-ease); }
.ab-wrap.ab-visible{ opacity:1; transform:translateY(0); }

.ab-top-feather{ position:absolute; inset:0 0 auto 0; height:160px; background:linear-gradient(to bottom, var(--ab-bg), transparent); opacity:.95; z-index:0; }
.ab-aurora{ position:absolute; inset:-25%; z-index:0;
  background: conic-gradient(from 230deg at 50% 50%, #5b3aa999, #126b7f88, #a93a9e88, #5b3aa999);
  filter: blur(160px) saturate(.9) brightness(.7); opacity:.18; animation:ab-drift 38s linear infinite; }
@keyframes ab-drift{ 0%{transform:translate3d(0,0,0) rotate(0)} 50%{transform:translate3d(0,-2%,0) rotate(180deg)} 100%{transform:translate3d(0,0,0) rotate(360deg)} }

.ab-stars{ position:absolute; inset:0; z-index:0; pointer-events:none; }
.ab-star{ position:absolute; display:block; background:#fff; border-radius:999px; filter:drop-shadow(0 0 10px #ffffffcc);
  opacity:.75; animation:ab-twinkle 7s ease-in-out infinite; }
@keyframes ab-twinkle{ 0%,100%{opacity:.5; transform:scale(.9)} 50%{opacity:1; transform:scale(1.1)} }

.ab-hero{ position:relative; z-index:1; padding: 96px 20px 30px; }
.ab-hero-inner{ max-width:1000px; margin:0 auto; text-align:center; }
.ab-hero-eyebrow{ display:inline-block; font-size:12px; letter-spacing:.6px; text-transform:uppercase; color:var(--ab-muted);
  background:rgba(255,255,255,.05); border:1px solid var(--ab-border); padding:6px 10px; border-radius:999px; }
.ab-hero-title{ margin:14px 0 10px; font-size: clamp(30px, 4vw, 56px); line-height:1.05;
  background: linear-gradient(90deg, #fff, #dcd3ff 30%, var(--ab-accent)); -webkit-background-clip:text; background-clip:text; color:transparent; }
.ab-hero-sub{ margin:0 auto; color:var(--ab-muted); max-width:820px; font-size: clamp(14px, 1.6vw, 18px); }
.ab-hero-metrics{ margin:22px auto 0; display:grid; gap:12px; grid-template-columns:repeat(3,minmax(0,1fr)); max-width:820px; }
@media (max-width: 700px){ .ab-hero-metrics{ grid-template-columns:1fr; } }
.ab-metric{ display:flex; flex-direction:column; gap:6px; align-items:center; padding:12px;
  border:1px solid var(--ab-border); border-radius:14px; background:rgba(255,255,255,.04); backdrop-filter: blur(8px); }
.ab-metric-value{ font-weight:800; font-size: clamp(20px, 4.5vw, 36px); }
.ab-metric-label{ font-size:12px; color:var(--ab-muted); letter-spacing:.4px; text-transform:uppercase; }

/* Generic section scaffold */
.ab-section{ position:relative; z-index:1; padding: 42px 20px; }
.ab-header{ max-width:900px; margin:0 auto 20px; text-align:center; }
.ab-header.left{ text-align:left; }
.ab-header h2{ font-size: clamp(24px, 3vw, 38px); margin: 0 0 10px;
  background:linear-gradient(90deg,#fff,#d7ccff 35%, var(--ab-accent) 90%); -webkit-background-clip:text; background-clip:text; color:transparent; }
.ab-header p{ color:var(--ab-muted); margin:0; }
.ab-eyebrow{ display:inline-block; margin-bottom:8px; font-size:12px; color:var(--ab-muted); letter-spacing:.6px; text-transform:uppercase; }

/* Cards / Grid */
.ab-grid{ max-width:1100px; margin:0 auto; display:grid; gap:14px; }
.ab-grid.three{ grid-template-columns:repeat(3,minmax(0,1fr)); }
.ab-grid.four{ grid-template-columns:repeat(3,minmax(0,1fr)); }
@media (max-width:1000px){ .ab-grid.three{ grid-template-columns:1fr 1fr } .ab-grid.four{ grid-template-columns:1fr 1fr } }
@media (max-width:640px){ .ab-grid.three, .ab-grid.four{ grid-template-columns:1fr } }

.ab-card{ padding:18px; border:1px solid var(--ab-border); border-radius:18px;
  background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02)); box-shadow:0 10px 30px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06);
  transition: transform .22s var(--ab-ease), box-shadow .22s var(--ab-ease), border-color .22s var(--ab-ease); backdrop-filter: blur(6px); }
.ab-card:hover{ transform: translateY(-3px); border-color:#c5b5ff; box-shadow:0 16px 36px rgba(0,0,0,.55), 0 0 0 1px rgba(197,181,255,.18) inset; }
.ab-card-icon{ width:38px; height:38px; display:grid; place-items:center; border-radius:999px; font-size:18px; color:#090112;
  background: radial-gradient(circle at 30% 30%, #fff, #d7ccff 55%, #8bd5ff); margin-bottom:10px; }
.ab-card h3{ margin:0 0 6px; font-size:18px; }
.ab-card p{ margin:0; color:#efeaff; opacity:.95; }

/* Steps */
.ab-steps{ max-width:1100px; margin:0 auto; display:grid; gap:12px; grid-template-columns:repeat(2,minmax(0,1fr)); }
@media (max-width:900px){ .ab-steps{ grid-template-columns:1fr } }
.ab-step{ display:flex; gap:12px; align-items:flex-start; padding:14px; border:1px solid var(--ab-border); border-radius:14px;
  background:rgba(255,255,255,.04); backdrop-filter: blur(6px); }
.ab-step-num{ width:34px; height:34px; border-radius:999px; display:grid; place-items:center; font-weight:800; color:#090112; font-size:14px;
  background: radial-gradient(circle at 30% 30%, #fff, #d7ccff 55%, #8bd5ff); box-shadow: inset 0 0 8px rgba(255,255,255,.65); }
.ab-step-body h4{ margin:0 0 4px; font-size:16px; }
.ab-step-body p{ margin:0; color:#efeaff; opacity:.95; }

/* Values */
.ab-values{ max-width:1000px; margin:0 auto; display:flex; flex-wrap:wrap; gap:10px; justify-content:center; }
.ab-chip{ padding:8px 12px; border:1px solid var(--ab-border); border-radius:999px; background:rgba(255,255,255,.05); color:#e9ddff; font-size:13px; }

/* Timeline */
.ab-timeline{ position:relative; max-width:1000px; margin:0 auto; padding-left:14px; }
.ab-timeline::before{ content:""; position:absolute; left:6px; top:5px; bottom:5px; width:1px; background:linear-gradient(#c5b5ff66, #2aa4c780); }
.ab-time-item{ position:relative; display:grid; grid-template-columns: 160px 16px 1fr; gap:12px; padding:10px 0; }
@media (max-width:640px){ .ab-time-item{ grid-template-columns: 120px 16px 1fr; } }
.ab-time-date{ color:#d7cfff; font-size:13px; opacity:.9; }
.ab-time-dot{ width:12px; height:12px; border-radius:999px; background: radial-gradient(circle at 30% 30%, #fff, #d7ccff 55%, #8bd5ff);
  box-shadow:0 0 10px rgba(165,92,255,.6); margin-top:2px; }
.ab-time-text{ color:#efeaff; }

/* Team */
.ab-team-card{ display:flex; align-items:center; gap:12px; padding:14px; border:1px solid var(--ab-border); border-radius:14px;
  background:rgba(255,255,255,.04); backdrop-filter: blur(6px); }
.ab-avatar{ width:42px; height:42px; border-radius:999px; display:grid; place-items:center; font-weight:800; color:#090112;
  background: radial-gradient(circle at 30% 30%, #fff, #d7ccff 55%, #8bd5ff); box-shadow: inset 0 0 10px rgba(255,255,255,.65); }
.ab-team-text{ display:flex; flex-direction:column; }
.ab-team-text strong{ font-size:14px; }
.ab-team-text span{ font-size:12px; color:var(--ab-muted); }

/* FAQ */
/* FAQ */
.ab-faq{ max-width:900px; margin:0 auto; display:grid; gap:8px; }

.ab-faq-item{
  border:1px solid var(--ab-border);
  border-radius:14px;
  background:rgba(255,255,255,.04);
  overflow:hidden;
}

.ab-faq-q{
  width:100%;
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:12px;
  text-align:left;
  color:var(--ab-fg);
  font-weight:600;
  padding:14px 16px;
  background:transparent;
  border:none;
  cursor:pointer;
}

.ab-faq-caret{ transition: transform .2s var(--ab-ease); opacity:.9; }
.ab-faq-item.open .ab-faq-caret{ transform: rotate(180deg); }

/* ⬇️ Hide by default; animate open */
.ab-faq-a{
  max-height: 0;
  overflow: hidden;
  padding: 0 16px;           /* no bottom padding when closed */
  color:#e9e4ff;
  opacity: 0;
  transition:
    max-height .28s var(--ab-ease),
    padding .28s var(--ab-ease),
    opacity .28s var(--ab-ease);
}

.ab-faq-item.open .ab-faq-a{
  max-height: 500px;         /* large enough for typical answers */
  padding: 0 16px 12px 16px; /* add bottom padding when open */
  opacity: 1;
}

.ab-faq-a p{ margin:0; opacity:.95; }

/* CTA (optional) */
.ab-cta{ position:relative; z-index:1; padding:30px 20px 80px; text-align:center; display:flex; flex-direction:column; gap:10px; }
.ab-cta-btn{ display:inline-block; padding:12px 18px; background: radial-gradient(80% 180% at 20% 0%, #8459ea, #2aa4c7);
  color:#090112; font-weight:800; border-radius:999px; text-decoration:none; border:1px solid #c7b7ff66; box-shadow:0 8px 30px rgba(50,32,125,.45); }
.ab-cta-note{ font-size:12px; color:var(--ab-muted); }

/* Reduced motion */
@media (prefers-reduced-motion: reduce){
  .ab-wrap{ opacity:1 !important; transform:none !important; }
  .ab-aurora{ animation:none !important; }
  .ab-star{ animation:none !important; }
}
`;
